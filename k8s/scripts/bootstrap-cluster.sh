#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# --------------------------------------------------
# Versions
# --------------------------------------------------

ENVOY_GATEWAY_VERSION="v1.10.0"

ENVOY_GATEWAY_NAMESPACE="envoy-gateway-system"
ENVOY_GATEWAY_RELEASE="eg"
ENVOY_GATEWAY_CHART="oci://docker.io/envoyproxy/gateway-helm"

echo "======================================"
echo " pickNorder Kubernetes Bootstrap"
echo "======================================"

# --------------------------------------------------
# 1. Install Argo CD
# --------------------------------------------------

echo "[1/4] Installing Argo CD..."

kubectl create namespace argocd \
  --dry-run=client -o yaml | kubectl apply -f -

# Add your existing Argo CD Helm installation here.
# Keep this section aligned with your current Argo CD installation.
kubectl apply -n argocd --server-side --force-conflicts -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml


# --------------------------------------------------
# 2. Wait for Argo CD
# --------------------------------------------------

echo "[2/4] Waiting for Argo CD to become ready..."

kubectl wait \
  --namespace argocd \
  --for=condition=Available \
  deployment \
  --all \
  --timeout=300s

# --------------------------------------------------
# 3. Install Envoy Gateway
# --------------------------------------------------

echo "[3/4] Installing Envoy Gateway..."

helm upgrade --install "$ENVOY_GATEWAY_RELEASE" \
  "$ENVOY_GATEWAY_CHART" \
  --version "$ENVOY_GATEWAY_VERSION" \
  --namespace "$ENVOY_GATEWAY_NAMESPACE" \
  --create-namespace \
  --wait \
  --timeout 5m

echo "Waiting for Envoy Gateway deployment..."

kubectl wait \
  --namespace "$ENVOY_GATEWAY_NAMESPACE" \
  --for=condition=Available \
  deployment/envoy-gateway \
  --timeout=300s

# --------------------------------------------------
# 4. Bootstrap Argo CD GitOps
# --------------------------------------------------

echo "[4/4] Applying Argo CD root application..."

kubectl apply \
  -f "$ROOT_DIR/bootstrap/root-application.yaml"

# --------------------------------------------------
# Done
# --------------------------------------------------

echo "======================================"
echo " Bootstrap completed successfully"
echo "======================================"
