from fastapi import FastAPI

app = FastAPI(title="AI Symptom Service")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-symptom-service"}