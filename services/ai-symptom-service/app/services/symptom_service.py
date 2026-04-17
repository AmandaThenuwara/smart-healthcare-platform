import json
import re

from bson import ObjectId
from fastapi import HTTPException, status
from openai import OpenAI

from app.core.config import OPENAI_API_KEY, OPENAI_MODEL
from app.db.mongodb import get_symptom_checks_collection
from app.models.symptom_check_model import (
    build_symptom_check_document,
    serialize_symptom_check,
)

STANDARD_DISCLAIMER = (
    "This AI symptom checker is for informational support only and is not a "
    "medical diagnosis. If symptoms are severe, worsening, or urgent, seek a "
    "licensed medical professional or emergency care immediately."
)

SYSTEM_INSTRUCTIONS = """
You are a cautious healthcare triage assistant for a university healthcare project.
You must NOT provide a final medical diagnosis.
You must return JSON only with this exact shape:
{
  "summary": "short plain-language summary",
  "urgencyLevel": "LOW | MEDIUM | HIGH | EMERGENCY",
  "possibleConditions": ["condition 1", "condition 2", "condition 3"],
  "recommendation": "clear next-step recommendation",
  "redFlags": ["flag 1", "flag 2"]
}

Rules:
- Keep language simple and supportive.
- Never claim certainty.
- possibleConditions must be short and non-exhaustive.
- recommendation must prioritize patient safety.
- If symptoms suggest danger, set urgencyLevel to EMERGENCY.
- Return valid JSON only, with no markdown fence and no extra text.
""".strip()


def ensure_symptom_indexes():
    collection = get_symptom_checks_collection()
    collection.create_index("patientId")
    collection.create_index("userId")
    collection.create_index("createdAt")
    collection.create_index("urgencyLevel")


def _get_openai_client() -> OpenAI:
    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OPENAI_API_KEY is not configured for ai-symptom-service",
        )
    return OpenAI(api_key=OPENAI_API_KEY)


def _extract_json_object(text: str) -> dict:
    cleaned = text.strip()

    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if not match:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI response was not valid JSON",
            )
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="AI response JSON could not be parsed",
            ) from exc


def _normalize_result(data: dict) -> dict:
    urgency = str(data.get("urgencyLevel", "MEDIUM")).upper().strip()
    if urgency not in {"LOW", "MEDIUM", "HIGH", "EMERGENCY"}:
        urgency = "MEDIUM"

    possible_conditions = data.get("possibleConditions", [])
    if not isinstance(possible_conditions, list):
        possible_conditions = []

    red_flags = data.get("redFlags", [])
    if not isinstance(red_flags, list):
        red_flags = []

    summary = str(data.get("summary", "")).strip()
    recommendation = str(data.get("recommendation", "")).strip()

    if not summary:
        summary = "Symptoms were reviewed, but the summary could not be generated clearly."

    if not recommendation:
        recommendation = (
            "Please monitor symptoms and contact a licensed medical professional "
            "if they worsen or do not improve."
        )

    return {
        "summary": summary,
        "urgencyLevel": urgency,
        "possibleConditions": [str(item).strip() for item in possible_conditions if str(item).strip()],
        "recommendation": recommendation,
        "redFlags": [str(item).strip() for item in red_flags if str(item).strip()],
        "disclaimer": STANDARD_DISCLAIMER,
    }


def create_symptom_check(payload, patient_id: str, user_id: str):
    client = _get_openai_client()

    symptom_payload = {
        "symptoms": payload.symptoms,
        "age": payload.age,
        "sex": payload.sex,
        "duration": payload.duration,
        "severity": payload.severity,
        "additionalNotes": payload.additionalNotes,
    }

    try:
        response = client.responses.create(
            model=OPENAI_MODEL,
            instructions=SYSTEM_INSTRUCTIONS,
            input=f"Patient symptom input:\n{json.dumps(symptom_payload, ensure_ascii=False)}",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"OpenAI request failed: {str(exc)}",
        ) from exc

    raw_output = (response.output_text or "").strip()
    parsed = _extract_json_object(raw_output)
    normalized = _normalize_result(parsed)

    document = build_symptom_check_document(
        patient_id=patient_id,
        user_id=user_id,
        symptoms=payload.symptoms,
        summary=normalized["summary"],
        urgency_level=normalized["urgencyLevel"],
        possible_conditions=normalized["possibleConditions"],
        recommendation=normalized["recommendation"],
        red_flags=normalized["redFlags"],
        disclaimer=normalized["disclaimer"],
        age=payload.age,
        sex=payload.sex,
        duration=payload.duration,
        severity=payload.severity,
        additional_notes=payload.additionalNotes,
        raw_model_output=raw_output,
    )

    result = get_symptom_checks_collection().insert_one(document)
    created = get_symptom_checks_collection().find_one({"_id": result.inserted_id})
    return serialize_symptom_check(created)


def list_my_symptom_checks(user_id: str):
    cursor = get_symptom_checks_collection().find({"userId": user_id}).sort(
        [("createdAt", -1)]
    )
    return [serialize_symptom_check(document) for document in cursor]


def get_symptom_check_by_id(check_id: str):
    document = get_symptom_checks_collection().find_one({"_id": ObjectId(check_id)})
    if not document:
        raise HTTPException(status_code=404, detail="Symptom check not found")
    return serialize_symptom_check(document)
