FROM python:3.11-slim

RUN apt-get update && apt-get install -y nginx supervisor && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy all requirements first for caching
COPY services/*/requirements.txt ./
RUN for f in *.txt; do pip install --no-cache-dir -r "$f"; done

# Copy the entire project
COPY . .

# Copy configurations
COPY nginx.conf /etc/nginx/sites-available/default
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Railway uses port 80 (standard for Nginx)
EXPOSE 80

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
