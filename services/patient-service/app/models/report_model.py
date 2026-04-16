from datetime import datetime, timezone


def build_report_document(payload) -> dict:
    return {
        "patientId": payload.patientId,
        "title": payload.title.strip(),
        "fileName": payload.fileName.strip(),
        "fileUrl": payload.fileUrl.strip(),
        "reportType": payload.reportType.strip(),
        "uploadedAt": datetime.now(timezone.utc),
    }


def serialize_report(document: dict) -> dict:
    return {
        "reportId": str(document["_id"]),
        "patientId": document["patientId"],
        "title": document["title"],
        "fileName": document["fileName"],
        "fileUrl": document["fileUrl"],
        "reportType": document["reportType"],
        "uploadedAt": document["uploadedAt"].isoformat() if hasattr(document["uploadedAt"], "isoformat") else str(document["uploadedAt"]),
    }
