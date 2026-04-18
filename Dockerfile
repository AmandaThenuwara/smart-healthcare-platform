FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy all requirements files and install them
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

# Copy all services
COPY services/ ./services/

# Copy configurations
COPY nginx.conf /etc/nginx/sites-available/default
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Create uploads directory
RUN mkdir -p /app/services/patient-service/uploads

# Nginx listens on 80. Railway will map this to the external world.
EXPOSE 80

# Start supervisord
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
