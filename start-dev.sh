#!/bin/bash
cd ~/projeto-clientes
BUILD_NUMBER=$(docker images --format "{{.Tag}}" projeto-clientes-frontend | sort -rn | head -1)
echo "🚀 Subindo ambiente DEV com BUILD_NUMBER=$BUILD_NUMBER..."
BUILD_NUMBER=$BUILD_NUMBER docker-compose up -d
echo "⏳ Aguardando KQL Simulator no K8s..."
sleep 5
kubectl port-forward svc/kql-simulator 8091:80 -n kql-dev &
echo "✅ Ambiente DEV completo!"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8000/docs"
echo "   Jenkins:   http://localhost:9090"
echo "   KQL:       http://localhost:8091"
echo "   Grafana:   http://localhost:3001"
