from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def root():
    return {"message": "appointment service is running"}
