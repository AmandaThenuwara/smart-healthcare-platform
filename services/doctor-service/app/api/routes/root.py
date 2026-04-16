from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def root():
    return {"message": "doctor service is running"}
