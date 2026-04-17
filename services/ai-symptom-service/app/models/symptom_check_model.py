from datetime import datetime, timezone


def build_symptom_check_document(
    patient_id: str,
    user_id: str,
    symptoms: list[str],
    summary: str,
    urgency_level: str,
    possible_conditions: list[str],
    recommendation: str,
    red_flags: list[str],
    disclaimer: str,
    age: int | None = None,
    sex: str | None = None,
    duration: str | None = None,
    severity: str | None = None,
    additional_notes: str | None = None,
    raw_model_output: str | None = None,
) -> dict:
    return {
        "patientId": patient_id,
        "userId": user_id,
        "submittedSymptoms": symptoms,
        "age": age,
        "sex": sex,
        "duration": duration,
        "severity": severity,
        "additionalNotes": additional_notes,
        "summary": summary,
        "urgencyLevel": urgency_level,
        "possibleConditions": possible_conditions,
        "recommendation": recommendation,
        "redFlags": red_flags,
        "disclaimer": disclaimer,
        "rawModelOutput": raw_model_output,
        "createdAt": datetime.now(timezone.utc),
    }


def serialize_symptom_check(document: dict) -> dict:
    return {
        "checkId": str(document["_id"]),
        "patientId": document["patientId"],
        "userId": document["userId"],
        "submittedSymptoms": document.get("submittedSymptoms", []),
        "summary": document["summary"],
        "urgencyLevel": document["urgencyLevel"],
        "possibleConditions": document.get("possibleConditions", []),
        "recommendation": document["recommendation"],
        "redFlags": document.get("redFlags", []),
        "disclaimer": document["disclaimer"],
        "createdAt": document["createdAt"].isoformat()
        if hasattr(document["createdAt"], "isoformat")
        else str(document["createdAt"]),
    }
