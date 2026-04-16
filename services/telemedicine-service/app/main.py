from fastapi import FastAPI

app = FastAPI(title="Telemedicine Service")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "telemedicine-service"}