import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Add all service directories to the path so we can import them
current_dir = os.path.dirname(os.path.abspath(__file__))
services_dir = os.path.join(current_dir, "services")
for service in os.listdir(services_dir):
    service_path = os.path.join(services_dir, service)
    if os.path.isdir(service_path):
        sys.path.append(service_path)

# Import all routers
# Note: We import the specific routers to avoid collisions
from services.auth_service.app.api.routes.auth import router as auth_router
from services.patient_service.app.api.routes.patient import router as patient_router
from services.doctor_service.app.api.routes.doctor import router as doctor_router
from services.doctor_service.app.api.routes.availability import router as avail_router
from services.appointment_service.app.api.routes.appointment import router as appt_router
from services.telemedicine_service.app.api.routes.session import router as tele_router
from services.payment_service.app.api.routes.payment import router as pay_router
from services.notification_service.app.api.routes.notifications import router as notify_router
from services.ai_symptom_service.app.api.routes.symptom import router as ai_router

app = FastAPI(title="Smart Healthcare Monolith")

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers with their correct prefixes
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(patient_router, prefix="/api/v1/patients", tags=["patients"])
app.include_router(doctor_router, prefix="/api/v1/doctors", tags=["doctors"])
app.include_router(avail_router, prefix="/api/v1/availability", tags=["availability"])
app.include_router(appt_router, prefix="/api/v1/appointments", tags=["appointments"])
app.include_router(tele_router, prefix="/api/v1/sessions", tags=["telemedicine"])
app.include_router(pay_router, prefix="/api/v1/payments", tags=["payments"])
app.include_router(notify_router, prefix="/api/v1/notifications", tags=["notifications"])
app.include_router(ai_router, prefix="/api/v1/symptoms", tags=["ai"])

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "mode": "monolith"}

@app.get("/")
def root():
    return {"message": "LifePulse Monolith API is running"}
