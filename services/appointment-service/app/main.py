from fastapi import FastAPI

app = FastAPI(title="Appointment Service")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "appointment-service"}