import os
import smtplib
import socket
import threading
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


def _send_email_task(resolved_host, port, username, password, use_tls, message):
    # The "Port Hunter" - tries all standard SMTP ports to find the one Railway hasn't blocked
    ports_to_try = [port, 587, 465, 2525, 25]
    ports_to_try = list(dict.fromkeys(ports_to_try)) # Remove duplicates

    last_error = ""

    for attempt_port in ports_to_try:
        try:
            print(f"[notification-dispatch] hunter checking port {attempt_port}...")
            if attempt_port == 465:
                with smtplib.SMTP_SSL(resolved_host, attempt_port, timeout=8) as smtp:
                    smtp.login(username, password)
                    smtp.send_message(message)
                    print(f"[notification-dispatch] email SENT via port {attempt_port}! 🎉")
                    return
            else:
                with smtplib.SMTP(resolved_host, attempt_port, timeout=8) as smtp:
                    try:
                        smtp.starttls()
                    except Exception:
                        pass
                    smtp.login(username, password)
                    smtp.send_message(message)
                    print(f"[notification-dispatch] email SENT via port {attempt_port}! 🎉")
                    return
        except Exception as exc:
            last_error = str(exc)
            print(f"[notification-dispatch] port {attempt_port} blocked or failed: {last_error}")

    print(f"[notification-dispatch] ❌ ALL PORTS BLOCKED. Final error: {last_error}")
    print("[notification-dispatch] RECOMMENDATION: Railway is likely blocking all standard SMTP. To fix this permanently, use a Mail API like SendGrid or Resend via HTTP instead of Gmail SMTP.")


def _send_email(to_email: str, subject: str, body: str):
    # Default to True if we are attempting to send, but still check if incomplete
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
        args=(resolved_host, port, username, password, use_tls, message),
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
