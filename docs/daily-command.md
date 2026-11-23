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
