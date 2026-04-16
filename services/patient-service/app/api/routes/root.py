from fastapi import APIRouter

router = APIRouter()

@router.get("/")
def root():
    return {"message": "patient service is running"}
