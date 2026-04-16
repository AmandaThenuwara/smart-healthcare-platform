from fastapi import FastAPI

app = FastAPI(title="Notification Service")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "notification-service"}