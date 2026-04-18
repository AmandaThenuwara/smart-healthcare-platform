#!/bin/bash
# =====================================================================
#  deploy.sh – Helper script to apply all K8s manifests in order
#
#  Usage:
#    chmod +x deploy.sh
#    ./deploy.sh
# =====================================================================

set -e

echo "🚀 Deploying Smart Healthcare Platform to Kubernetes..."

echo "→ Creating namespace..."
kubectl apply -f k8s/namespace.yaml

echo "→ Applying ConfigMap..."
kubectl apply -f k8s/configmap.yaml

echo "→ Applying Secrets..."
kubectl apply -f k8s/secrets.yaml

echo "→ Deploying services..."
kubectl apply -f k8s/auth-service.yaml
kubectl apply -f k8s/patient-service.yaml
kubectl apply -f k8s/doctor-service.yaml
kubectl apply -f k8s/services.yaml

echo "→ Applying Ingress..."
kubectl apply -f k8s/ingress.yaml

echo "→ Waiting for deployments to roll out..."
kubectl rollout status deployment/auth-service -n healthcare --timeout=90s
kubectl rollout status deployment/patient-service -n healthcare --timeout=90s
kubectl rollout status deployment/doctor-service -n healthcare --timeout=90s
kubectl rollout status deployment/appointment-service -n healthcare --timeout=90s
kubectl rollout status deployment/telemedicine-service -n healthcare --timeout=90s
kubectl rollout status deployment/payment-service -n healthcare --timeout=90s
kubectl rollout status deployment/notification-service -n healthcare --timeout=90s
kubectl rollout status deployment/ai-symptom-service -n healthcare --timeout=90s

echo ""
echo "✅ All services deployed successfully!"
echo ""
kubectl get pods -n healthcare
