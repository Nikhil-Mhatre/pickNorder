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

## ArgoCD Default Password

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```
