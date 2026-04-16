from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def root():
    return {"message": "ai symptom service is running"}
