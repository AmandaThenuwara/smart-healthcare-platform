FROM python:3.11-slim

WORKDIR /app

# Install dependencies for ALL services
COPY services/auth-service/requirements.txt ./auth-req.txt
COPY services/patient-service/requirements.txt ./patient-req.txt
COPY services/doctor-service/requirements.txt ./doctor-req.txt
COPY services/appointment-service/requirements.txt ./appointment-req.txt
COPY services/telemedicine-service/requirements.txt ./tele-req.txt
COPY services/payment-service/requirements.txt ./payment-req.txt
COPY services/notification-service/requirements.txt ./notify-req.txt
COPY services/ai-symptom-service/requirements.txt ./ai-req.txt
COPY services/gateway/requirements.txt ./gateway-req.txt

RUN pip install --no-cache-dir \
    -r auth-req.txt \
    -r patient-req.txt \
    -r doctor-req.txt \
    -r appointment-req.txt \
    -r tele-req.txt \
    -r payment-req.txt \
    -r notify-req.txt \
    -r ai-req.txt \
    -r gateway-req.txt

# Copy everything
COPY . .

# Railway automatically provides the $PORT variable. 
# We run the monolith on that port.
CMD uvicorn main_monolith:app --host 0.0.0.0 --port $PORT
