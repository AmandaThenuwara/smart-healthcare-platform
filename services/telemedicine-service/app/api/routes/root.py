from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def root():
    return {"message": "telemedicine service is running"}
