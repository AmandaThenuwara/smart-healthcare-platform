FROM python:3.11-slim

RUN apt-get update && apt-get install -y nginx supervisor && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy each requirements file with a unique name to avoid overwriting
COPY services/auth-service/requirements.txt ./req_auth.txt
COPY services/patient-service/requirements.txt ./req_patient.txt
COPY services/doctor-service/requirements.txt ./req_doctor.txt
COPY services/appointment-service/requirements.txt ./req_appointment.txt
COPY services/telemedicine-service/requirements.txt ./req_telemedicine.txt
COPY services/payment-service/requirements.txt ./req_payment.txt
COPY services/notification-service/requirements.txt ./req_notification.txt
COPY services/ai-symptom-service/requirements.txt ./req_ai.txt
COPY services/gateway/requirements.txt ./req_gateway.txt

# Install ALL dependencies
RUN pip install --no-cache-dir \
    -r req_auth.txt \
    -r req_patient.txt \
    -r req_doctor.txt \
    -r req_appointment.txt \
    -r req_telemedicine.txt \
    -r req_payment.txt \
    -r req_notification.txt \
    -r req_ai.txt \
    -r req_gateway.txt

# Copy the entire project
COPY . .

# Copy configurations
COPY nginx.conf /etc/nginx/sites-available/default
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
