from fastapi import FastAPI

app = FastAPI(title="Payment Service")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "payment-service"}