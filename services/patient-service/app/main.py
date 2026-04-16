from fastapi import FastAPI

app = FastAPI(title="Patient Service")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "patient-service"}