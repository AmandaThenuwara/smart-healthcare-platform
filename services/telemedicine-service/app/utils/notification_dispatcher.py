import os
import smtplib
import socket
import threading
import json
import http.client
from datetime import datetime, timezone
from email.message import EmailMessage

from pymongo import MongoClient


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.getenv(name, str(default)).strip().lower()
    return value in {"1", "true", "yes", "on"}


def _get_mongo_client() -> MongoClient:
    return MongoClient(
        os.getenv("MONGO_URI", "mongodb://localhost:27018"),
        username=os.getenv("MONGO_USERNAME", ""),
        password=os.getenv("MONGO_PASSWORD", ""),
        authSource=os.getenv("MONGO_AUTH_SOURCE", "admin"),
    )


def _insert_notification(user_id: str, title: str, message: str, notification_type: str):
    client = None
    try:
        client = _get_mongo_client()
        notifications = client["notification_db"]["notifications"]
        notifications.insert_one(
            {
                "userId": str(user_id),
                "title": title.strip(),
                "message": message.strip(),
                "type": notification_type,
                "isRead": False,
                "createdAt": datetime.now(timezone.utc),
            }
        )
    except Exception as exc:
        print(f"[notification-dispatch] notification insert failed: {exc}")
    finally:
        if client is not None:
            client.close()


def _send_via_resend(api_key, to_email, subject, body, sender):
    try:
        conn = http.client.HTTPSConnection("api.resend.com")
        payload = json.dumps({
            "from": sender,
            "to": [to_email],
            "subject": subject,
            "text": body
        })
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {api_key}'
        }
        conn.request("POST", "/emails", payload, headers)
        res = conn.getresponse()
        data = res.read()
        if res.status in [200, 201]:
            print(f"[notification-dispatch] email successfully sent via Resend HTTP! ⚡")
            return True
        else:
            print(f"[notification-dispatch] Resend API failed (Status {res.status}): {data.decode()}")
            return False
    except Exception as exc:
        print(f"[notification-dispatch] Resend HTTP error: {exc}")
        return False


def _is_port_open(host, port):
    try:
        # Fast 3-second connection check
        with socket.create_connection((host, port), timeout=3):
            return True
    except Exception:
        return False


def _send_email_task(resolved_host, port, username, password, use_tls, message, to_email, subject, body, sender):
    # BYPASS MODE: Check for Resend API Key first (The unblockable path)
    resend_key = os.getenv("RESEND_API_KEY")
    if resend_key:
        print("[notification-dispatch] hunter using Resend HTTP Bypass...")
        if _send_via_resend(resend_key, to_email, subject, body, sender):
            return

    # SMTP MODE (The fallback path)
    ports_to_try = [port, 587, 465, 2525]
    ports_to_try = list(dict.fromkeys(ports_to_try))

    for attempt_port in ports_to_try:
        if not _is_port_open(resolved_host, attempt_port):
            print(f"[notification-dispatch] port {attempt_port} is closed/firewalled. skipping...")
            continue

        try:
            print(f"[notification-dispatch] hunter attacking port {attempt_port}...")
            if attempt_port == 465:
                with smtplib.SMTP_SSL(resolved_host, attempt_port, timeout=10) as smtp:
                    smtp.login(username, password)
                    smtp.send_message(message)
                    print(f"[notification-dispatch] SMTP SUCCESS via port {attempt_port}! 🎉")
                    return
            else:
                with smtplib.SMTP(resolved_host, attempt_port, timeout=10) as smtp:
                    try:
                        smtp.starttls()
                    except Exception:
                        pass
                    smtp.login(username, password)
                    smtp.send_message(message)
                    print(f"[notification-dispatch] SMTP SUCCESS via port {attempt_port}! 🎉")
                    return
        except Exception as exc:
            print(f"[notification-dispatch] smtp error on port {attempt_port}: {exc}")

    print("[notification-dispatch] ❌ ALL PATHS FAILED. Recommendation: Add 'RESEND_API_KEY' for HTTP bypass.")


def _send_email(to_email: str, subject: str, body: str):
    if not _env_bool("EMAIL_NOTIFICATIONS_ENABLED", True):
        return

    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    username = os.getenv("SMTP_USERNAME", "")
    password = os.getenv("SMTP_PASSWORD", "")
    sender = os.getenv("SMTP_FROM", username)
    use_tls = _env_bool("SMTP_USE_TLS", True)

    if not all([to_email, username, password, sender]):
        print("[notification-dispatch] email skipped: SMTP configuration is incomplete")
        return

    message = EmailMessage()
    message["From"] = sender
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    # Force IPv4 resolution
    try:
        resolved_host = socket.gethostbyname(host)
    except Exception:
        resolved_host = host

    # Send in background thread to prevent 504 timeouts
    thread = threading.Thread(
        target=_send_email_task,
        args=(resolved_host, port, username, password, use_tls, message, to_email, subject, body, sender),
    )
    thread.daemon = True
    thread.start()


def dispatch_notification(
    *,
    user_id: str,
    title: str,
    message: str,
    notification_type: str,
    email_to: str | None = None,
    email_subject: str | None = None,
    email_body: str | None = None,
):
    _insert_notification(user_id, title, message, notification_type)

    if email_to:
        _send_email(
            email_to,
            email_subject or title,
            email_body or message,
        )


def dispatch_bulk_notifications(events: list[dict]):
    for event in events:
        try:
            dispatch_notification(
                user_id=str(event.get("user_id", "")),
                title=str(event.get("title", "")),
                message=str(event.get("message", "")),
                notification_type=str(event.get("notification_type", "GENERAL")),
                email_to=event.get("email_to"),
                email_subject=event.get("email_subject"),
                email_body=event.get("email_body"),
            )
        except Exception as exc:
            print(f"[notification-dispatch] bulk dispatch failed: {exc}")
