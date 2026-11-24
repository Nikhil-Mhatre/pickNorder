```bash
kubectl create secret generic products-service-secrets \
  --from-env-file=k8s/.env.dev \
  --namespace=products-development \
  --dry-run=client -o yaml | kubectl apply -f -
```

```bash
kubectl create secret generic products-service-secrets \
  --from-env-file=k8s/.env \
  --namespace=products-production \
  --dry-run=client -o yaml | kubectl apply -f -
```

## Envoy GATEWAY Installation

```bash
helm install eg oci://docker.io/envoyproxy/gateway-helm \
  --version v1.10.0 \
  --namespace envoy-gateway-system \
  --create-namespace

# After installation, wait for the controller:
kubectl wait \
  --namespace envoy-gateway-system \
  deployment/envoy-gateway \
  --for=condition=Available \
  --timeout=300s

# verify
kubectl get pods -n envoy-gateway-system
kubectl get crds | grep gateway.networking.k8s.io
```
