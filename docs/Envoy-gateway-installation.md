# PickNOrder — Envoy Gateway Installation & Configuration Runbook

**Platform:** Kubernetes (Docker Desktop)
**Gateway:** Envoy Gateway
**Installation method:** Helm
**Version:** v1.10.0
**Configuration management:** Kubernetes Gateway API + Kustomize + Argo CD
**Repository:** `pickNorder`
**Branch:** `feat`

---

## 1. Purpose

This document describes how to install, configure, verify, and troubleshoot Envoy Gateway in the PickNOrder Kubernetes cluster.

Envoy Gateway provides a single entry point into the cluster for external API traffic. It routes HTTP requests to internal Kubernetes Services using Kubernetes Gateway API resources.

Our architecture keeps backend microservices internal using `ClusterIP` Services, while external traffic enters through Envoy Gateway.

## 2. Architecture

```text
                  Client
                    |
                    | HTTP :80
                    v
             Envoy Gateway Proxy
                    |
                    v
              PickNOrder Gateway
                    |
             Gateway API Routing
                    |
       +------------+------------+
       |                         |
       v                         v
 Products Service           Orders Service
   ClusterIP                 ClusterIP
       |                         |
       v                         v
   Products API              Orders API
```

### Responsibilities

| Component                | Responsibility                                                |
| ------------------------ | ------------------------------------------------------------- |
| Envoy Gateway Controller | Reconciles Gateway API resources and configures Envoy proxies |
| Envoy Proxy              | Handles incoming HTTP traffic and forwards requests           |
| GatewayClass             | Identifies the Gateway controller                             |
| Gateway                  | Defines listeners and the shared entry point                  |
| HTTPRoute                | Defines HTTP matching and backend routing                     |
| Kubernetes Service       | Provides stable internal connectivity to backend Pods         |
| Argo CD                  | Reconciles infrastructure and service configuration from Git  |

## 3. Prerequisites

Before installing Envoy Gateway, ensure the following are available:

- A running Kubernetes cluster
- `kubectl` configured for the intended cluster
- Helm installed
- Argo CD installed (for the GitOps management stage)
- Access to the PickNOrder Git repository

Verify the cluster context:

```bash
kubectl config current-context
kubectl get nodes
```

For our local environment, the cluster context is:

```text
docker-desktop
```

**Warning:** Always verify the current Kubernetes context before applying infrastructure manifests.

## 4. Install Envoy Gateway Controller

### 4.1 Installation details

We use the official Envoy Gateway Helm chart published through OCI.

| Setting           | Value                                     |
| ----------------- | ----------------------------------------- |
| Helm release name | `eg`                                      |
| Chart             | `gateway-helm`                            |
| Chart source      | `oci://docker.io/envoyproxy/gateway-helm` |
| Version           | `v1.10.0`                                 |
| Namespace         | `envoy-gateway-system`                    |

### 4.2 Install using Helm

```bash
helm install eg oci://docker.io/envoyproxy/gateway-helm \
  --version v1.10.0 \
  --namespace envoy-gateway-system \
  --create-namespace
```

This installs Envoy Gateway and the required CRDs, including Gateway API resources, unless CRD installation is separately configured.

### 4.3 Verify the controller

Check the controller Pods:

```bash
kubectl get pods -n envoy-gateway-system
```

Check the deployments:

```bash
kubectl get deployments -n envoy-gateway-system
```

Wait for the controller Deployment to become available:

```bash
kubectl wait \
  --timeout=5m \
  -n envoy-gateway-system \
  deployment/envoy-gateway \
  --for=condition=Available
```

Expected result: the Envoy Gateway controller Deployment becomes available.

### 4.4 Verify installed CRDs

```bash
kubectl get crd | grep gateway.networking.k8s.io
```

Check for Gateway API resources, including:

- `gatewayclasses.gateway.networking.k8s.io`
- `gateways.gateway.networking.k8s.io`
- `httproutes.gateway.networking.k8s.io`

## 5. Configure Gateway API Infrastructure

The controller installation does not automatically create our application Gateway configuration. We define these resources separately.

PickNOrder stores the Gateway infrastructure in:

```text
k8s/gateway/base/
├── namespace.yaml
├── gatewayclass.yaml
├── gateway.yaml
└── kustomization.yaml
```

### 5.1 Namespace

`namespace.yaml`

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: gateway
```

### 5.2 GatewayClass

`gatewayclass.yaml`

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: eg
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller
```

The GatewayClass tells Kubernetes which controller manages Gateways using this class.

### 5.3 Gateway

`gateway.yaml`

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: picknorder-gateway
  namespace: gateway
spec:
  gatewayClassName: eg
  listeners:
    - name: http
      protocol: HTTP
      port: 80
      allowedRoutes:
        namespaces:
          from: All
```

This creates our shared Gateway with an HTTP listener on port 80.

The `allowedRoutes` configuration permits HTTPRoutes from other namespaces to attach to the Gateway. This allows backend services to register their routes independently.

### 5.4 Kustomization

`kustomization.yaml`

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - namespace.yaml
  - gatewayclass.yaml
  - gateway.yaml
```

### 5.5 Apply manually (bootstrap or emergency setup)

```bash
kubectl apply -k k8s/gateway/base
```

Normally, after GitOps setup, this command should not be necessary for routine deployments.

## 6. Configure API Routing

Backend services are exposed through HTTPRoutes. The Gateway routes traffic to the internal Kubernetes Service.

Our API convention is **version-first URL structure**.

Examples:

```text
/api/v1/products
/api/v2/products
/api/v1/orders
/api/v2/orders
```

API version implementation is owned by each microservice. The Gateway routes requests to the correct service and does not implement API versioning.

### 6.1 Products HTTPRoute

Products Service namespace:

```text
products-development
```

Products Kubernetes Service:

```text
products-service:3001
```

Example HTTPRoute for version-first APIs:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: products-route
  namespace: products-development
spec:
  parentRefs:
    - name: picknorder-gateway
      namespace: gateway
      sectionName: http

  rules:
    - matches:
        - path:
            type: PathPrefix
            value: /api/v1/products
        - path:
            type: PathPrefix
            value: /api/v2/products

      backendRefs:
        - name: products-service
          port: 3001
```

The Gateway forwards the original path. No URL rewrite is performed.

### 6.2 Request flow

Example request:

```http
GET http://localhost/api/v1/products/123
```

Request flow:

1. The client sends a request to the Gateway.
2. Envoy Gateway receives the request.
3. The HTTPRoute matches `/api/v1/products`.
4. Envoy forwards the original request path.
5. The Products Service receives `/api/v1/products/123`.
6. The Products Service handles the versioned API endpoint.

The Gateway should not rewrite the API path to an unversioned internal endpoint.

## 7. Health Endpoints

Health endpoints are not API-versioned.

The Products Service currently exposes:

```text
/health/live
/health/ready
```

### Liveness

```http
GET /health/live
```

Indicates whether the application process is alive.

### Readiness

```http
GET /health/ready
```

Indicates whether the application is ready to serve traffic.

### Kubernetes probes

Kubernetes should use these endpoints directly against the Products Service Pods.

The probes do not need to go through Envoy Gateway.

Public health endpoints may be added later if external monitoring requires them. Internal liveness and readiness endpoints should not automatically be exposed publicly.

## 8. Verify Gateway Configuration

### 8.1 GatewayClass

```bash
kubectl get gatewayclass
```

Expected:

```text
NAME   CONTROLLER
eg     gateway.envoyproxy.io/gatewayclass-controller
```

### 8.2 Gateway

```bash
kubectl get gateway -n gateway
```

Inspect detailed conditions:

```bash
kubectl describe gateway picknorder-gateway -n gateway
```

Expected Gateway condition:

```text
Programmed=True
```

### 8.3 HTTPRoute

```bash
kubectl get httproute -n products-development
```

Inspect:

```bash
kubectl describe httproute products-route -n products-development
```

Expected conditions:

```text
Accepted=True
ResolvedRefs=True
```

- `Accepted=True`: the route is accepted by the Gateway controller.
- `ResolvedRefs=True`: referenced Gateway and backend Service resources have been resolved.

### 8.4 Envoy Proxy

```bash
kubectl get pods -A | grep envoy
```

Check services:

```bash
kubectl get svc -n envoy-gateway-system
```

In our Docker Desktop environment, the Gateway proxy Service is exposed through a LoadBalancer address of `localhost`.

## 9. Test Traffic

### 9.1 Test Products API through Gateway

```bash
curl -i http://localhost/api/v1/products
```

For a specific product:

```bash
curl -i http://localhost/api/v1/products/<PRODUCT_ID>
```

Replace `<PRODUCT_ID>` with an actual ID.

### 9.2 Interpret the response

| Result             | Meaning                                                              |
| ------------------ | -------------------------------------------------------------------- |
| Connection refused | Gateway listener or local connectivity issue                         |
| Gateway 404        | Request did not match an HTTPRoute                                   |
| Backend 404        | Request reached the backend, but the application route was not found |
| Backend 500        | Request reached the application, but application processing failed   |
| 200/201            | Request succeeded                                                    |

A backend-generated response such as:

```json
{
  "success": false,
  "error": {
    "code": "ROUTE_NOT_FOUND",
    "message": "Route GET /api/products not found"
  }
}
```

means the request reached the backend application. It does not indicate a Gateway failure.

## 10. GitOps Management with Argo CD

PickNOrder manages Gateway infrastructure through Argo CD.

### Repository layout

```text
k8s/
├── argocd/
│   ├── applications/
│   │   └── gateway-infrastructure.yaml
│   └── projects/
│       ├── backend.yaml
│       └── platform.yaml
│
├── gateway/
│   ├── base/
│   │   ├── namespace.yaml
│   │   ├── gatewayclass.yaml
│   │   ├── gateway.yaml
│   │   └── kustomization.yaml
│   └── routes/
│       └── products-development/
│           ├── httproute.yaml
│           └── kustomization.yaml
│
└── products-service/
    ├── base/
    └── overlays/
        ├── development/
        └── production/
```

### Gateway Infrastructure Application

Argo CD Application:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: gateway-infrastructure
  namespace: argocd
spec:
  project: platform

  source:
    repoURL: https://github.com/Nikhil-Mhatre/pickNorder.git
    targetRevision: feat
    path: k8s/gateway/base

  destination:
    server: https://kubernetes.default.svc
    namespace: gateway

  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

The Platform AppProject permits the Gateway infrastructure resource types and the destination namespace.

### GitOps ownership

| Resource                 | Argo CD Application                     |
| ------------------------ | --------------------------------------- |
| Envoy Gateway Controller | Planned: Envoy Gateway Helm Application |
| GatewayClass             | `gateway-infrastructure`                |
| Gateway                  | `gateway-infrastructure`                |
| Products HTTPRoute       | Products Service Application            |
| Orders HTTPRoute         | Orders Service Application (future)     |

The shared Gateway infrastructure is managed separately from backend microservices.

### ApplicationSet

The existing backend ApplicationSet generates Applications for directories matching:

```text
k8s/*-service
```

The Gateway is not a `*-service` directory and is a singleton infrastructure component. Therefore, it is managed by a standalone Argo CD Application rather than the backend ApplicationSet.

## 11. Future: GitOps Installation of Envoy Gateway Controller

Currently, the Envoy Gateway controller is installed manually with Helm.

The desired end state is:

```text
Fresh Kubernetes Cluster
        |
        v
Bootstrap Argo CD
        |
        v
Argo CD installs Envoy Gateway Helm Chart
        |
        v
Argo CD syncs Gateway Infrastructure
        |
        v
Argo CD deploys Microservices and HTTPRoutes
```

Once the Envoy Gateway Helm Application is GitOps-managed, a cluster reset should no longer require manually installing Envoy Gateway.

The remaining bootstrap dependency will be installing Argo CD itself, which can also be automated separately.

## 12. Troubleshooting

### Gateway not programmed

```bash
kubectl describe gateway picknorder-gateway -n gateway
```

Check:

- GatewayClass exists
- GatewayClass is accepted
- Envoy Gateway controller is running
- Listener configuration is valid
- Envoy proxy Pods are available

### HTTPRoute not accepted

```bash
kubectl describe httproute products-route -n products-development
```

Check:

- Parent Gateway reference
- Gateway namespace
- Listener section name
- Allowed route namespaces
- Path matches
- Route status conditions

### Backend reference not resolved

Check the Service:

```bash
kubectl get svc products-service -n products-development
```

Confirm:

- Service name matches the HTTPRoute backend
- Port matches the Service port
- Service exists in the same namespace as the HTTPRoute

### Envoy Pods are unhealthy

```bash
kubectl get pods -n envoy-gateway-system
kubectl logs deployment/envoy-gateway -n envoy-gateway-system
```

Inspect the Envoy Proxy data-plane Pods separately.

### Argo CD OutOfSync

```bash
kubectl get applications -n argocd
```

Inspect the Application:

```bash
kubectl describe application gateway-infrastructure -n argocd
```

Check:

- Git revision
- Repository accessibility
- Kustomize rendering
- Project permissions
- Resource drift

## 13. Cluster Reset Recovery

### Current recovery procedure

Until Envoy Gateway controller is GitOps-managed:

1. Recreate Kubernetes cluster.
2. Configure `kubectl` context.
3. Install Argo CD.
4. Manually install Envoy Gateway Helm chart v1.10.0.
5. Ensure the controller is available.
6. Apply or allow Argo CD to sync the Gateway infrastructure Application.
7. Allow Argo CD ApplicationSet to deploy backend microservices.
8. Validate Gateway and HTTPRoute status.
9. Test API requests through `localhost`.

### Target recovery procedure

After Envoy Gateway controller becomes GitOps-managed:

1. Recreate Kubernetes cluster.
2. Install/bootstrap Argo CD.
3. Argo CD installs Envoy Gateway Controller.
4. Argo CD deploys Gateway infrastructure.
5. Argo CD deploys microservices and their routes.
6. Validate the cluster and test API traffic.

Manual installation of Envoy Gateway should no longer be required.

## 14. Useful Commands Reference

```bash
# Kubernetes context
kubectl config current-context

# Gateway controller
kubectl get pods -n envoy-gateway-system
kubectl get deployments -n envoy-gateway-system
kubectl get svc -n envoy-gateway-system

# Gateway API resources
kubectl get gatewayclass
kubectl get gateway -n gateway
kubectl describe gateway picknorder-gateway -n gateway

# Routes
kubectl get httproute -A
kubectl describe httproute products-route -n products-development

# Argo CD
kubectl get applications -n argocd
kubectl get appproject -n argocd

# Test API
curl -i http://localhost/api/v1/products
```

## 15. Official References

- Envoy Gateway Helm installation: https://gateway.envoyproxy.io/docs/install/install-helm/
- Envoy Gateway Argo CD installation: https://gateway.envoyproxy.io/docs/install/install-argocd/
- Envoy Gateway Quickstart: https://gateway.envoyproxy.io/docs/tasks/quickstart/
- Envoy Gateway Installation documentation: https://gateway.envoyproxy.io/docs/install/

---

**End of Runbook**
