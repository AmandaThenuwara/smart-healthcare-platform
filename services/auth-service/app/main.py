from fastapi import FastAPI

app = FastAPI(title="Auth Service")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "auth-service"}