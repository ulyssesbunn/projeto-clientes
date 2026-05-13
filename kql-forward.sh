#!/bin/bash
pkill -f "port-forward svc/kql-simulator" 2>/dev/null
sleep 1
kubectl port-forward svc/kql-simulator 8091:80 -n kql-dev &
sleep 3
echo "✅ KQL port-forward ativo em localhost:8091"
