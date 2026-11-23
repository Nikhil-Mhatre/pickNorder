# EC2 Single-Node Kubernetes with Docker, kubeadm, and Argo CD

## Goal and architecture

Set up an Ubuntu EC2 host as a single-node Kubernetes learning cluster, install Docker for image build/push, configure containerd as Kubernetes' runtime, connect local `kubectl`, and install Argo CD.

> This is a learning/dev cluster, not high availability or production isolation. One EC2 instance is a single point of failure.

```text
Local workstation
  ├─ SSH (administration / tunnel)
  ├─ kubectl ────────────────┐
  └─ Docker build + push      │
                             v
AWS EC2 Ubuntu (one node)
  ├─ Docker Engine (build/tag/push)
  ├─ containerd (Kubernetes CRI runtime)
  ├─ kubeadm + kubelet + kubectl
  ├─ Kubernetes control plane and workloads
  ├─ Flannel pod network
  └─ Argo CD → watches Git → reconciles Kubernetes
```

## 1. Launch the EC2 instance

In AWS Console → EC2 → Launch instance:

- **Name:** `picknorder-k8s-dev`
- **AMI:** Ubuntu Server 24.04 LTS, 64-bit
- **CPU architecture:** x86_64/amd64 (unless you deliberately choose ARM and verify image support)
- **Size:** at least 2 vCPU and 4 GB RAM; 8 GB RAM is more practical for Argo CD plus microservices
- **Disk:** start with 30 GB gp3, increase as images/logs accumulate
- **SSH key pair:** create/download and keep private
- **Public IP:** enable if connecting over the internet; consider AWS Systems Manager Session Manager for safer access

Kubernetes upstream lists 2 CPU and 2 GB RAM as baseline control-plane requirements. That is not a comfortable size for hosting application pods too.

## 2. Configure the Security Group

Keep inbound rules restrictive. Replace `YOUR_PUBLIC_IP` with your current public IP.

| Port        | Protocol | Source                                                         | Use               |
| ----------- | -------- | -------------------------------------------------------------- | ----------------- |
| 22          | TCP      | `YOUR_PUBLIC_IP/32`                                            | SSH               |
| 6443        | TCP      | `YOUR_PUBLIC_IP/32` only, if direct kubectl API access is used | Kubernetes API    |
| 30000–32767 | TCP      | Do not open broadly; add a specific NodePort only when needed  | Optional NodePort |

Avoid exposing Kubernetes internal ports (etcd 2379–2380, kubelet 10250, control-plane 10257/10259) to the internet. If using an SSH tunnel/private connectivity, you can avoid a public inbound 6443 rule. Do not use `0.0.0.0/0` for SSH, Kubernetes API, or Argo CD UI.

## 3. SSH and update the server

From your local terminal:

```bash
chmod 400 /path/to/key.pem
ssh -i /path/to/key.pem ubuntu@EC2_PUBLIC_IP
```

Update and reboot:

```bash
sudo apt update
sudo apt upgrade -y
sudo reboot
```

Reconnect once the instance is back online.

## 4. Prepare Linux networking for Kubernetes

Set hostname:

```bash
sudo hostnamectl set-hostname picknorder-k8s-dev
```

Load kernel modules:

```bash
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF
sudo modprobe overlay
sudo modprobe br_netfilter
```

Set sysctl parameters:

```bash
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
EOF
sudo sysctl --system
```

Disable swap for kubelet's default behavior:

```bash
sudo swapoff -a
```

For persistence, inspect `/etc/fstab` and comment out the swap entry if one exists. Do not remove unrelated entries.

Check:

```bash
free -h
lsmod | grep -E 'overlay|br_netfilter'
sysctl net.ipv4.ip_forward
```

## 5. Install Docker Engine

Docker is for building/tagging/pushing images. Kubernetes uses containerd's CRI runtime below; Docker Engine by itself is not a CRI runtime for kubeadm.

Add Docker's official Ubuntu repository:

```bash
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

Start Docker and test it:

```bash
sudo systemctl enable --now docker
sudo systemctl status docker --no-pager
sudo docker run hello-world
```

Optional: run Docker commands without `sudo` (Docker group membership effectively grants root-level access):

```bash
sudo usermod -aG docker ubuntu
```

Log out and SSH back in for group changes to take effect.

## 6. Configure containerd (Kubernetes runtime)

Docker's package installs containerd. Configure its CRI runtime settings:

```bash
sudo mkdir -p /etc/containerd
sudo containerd config default | sudo tee /etc/containerd/config.toml
sudo nano /etc/containerd/config.toml
```

In the generated config, find the runc options for the default runtime and set:

```toml
SystemdCgroup = true
```

The exact nesting varies by containerd version—edit the generated file's existing setting, not a random partial config. Restart and verify:

```bash
sudo systemctl restart containerd
sudo systemctl enable containerd
sudo systemctl status containerd --no-pager
sudo ls -l /var/run/containerd/containerd.sock
```

## 7. Install kubeadm, kubelet, and kubectl

This example uses the Kubernetes **v1.35** package repository. Check the current supported versions and pick a minor version; keep kubeadm/kubelet/kubectl aligned. If selecting another minor, change `v1.35` in both repository URLs.

```bash
sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl gpg
sudo mkdir -p -m 755 /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.35/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
sudo chmod 644 /etc/apt/keyrings/kubernetes-apt-keyring.gpg

echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.35/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
sudo systemctl enable --now kubelet
```

Verify:

```bash
kubeadm version
kubectl version --client
kubelet --version
```

## 8. Initialize the cluster

Find EC2's private IP:

```bash
ip -4 addr show
```

Use that private IP in place of `EC2_PRIVATE_IP`:

```bash
sudo kubeadm init \
  --apiserver-advertise-address=EC2_PRIVATE_IP \
  --pod-network-cidr=10.244.0.0/16 \
  --cri-socket=unix:///var/run/containerd/containerd.sock
```

Save the successful output. The join command is useful if you later add nodes.

Configure kubectl for the Ubuntu user:

```bash
mkdir -p "$HOME/.kube"
sudo cp -i /etc/kubernetes/admin.conf "$HOME/.kube/config"
sudo chown "$(id -u):$(id -g)" "$HOME/.kube/config"
```

Check initial status:

```bash
kubectl get nodes -o wide
kubectl get pods -n kube-system
```

The node may remain `NotReady` until the CNI is installed.

## 9. Install Flannel CNI

This cluster was initialized with pod CIDR `10.244.0.0/16`, which matches the Flannel manifest's default network.

```bash
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
```

Watch system pods:

```bash
kubectl get pods -n kube-system -w
```

Then verify:

```bash
kubectl get nodes
kubectl get pods -A
```

The node should become `Ready` once the network plugin is working.

## 10. Allow pods to run on the single node

kubeadm normally taints the control-plane node to prevent workloads from scheduling there. For this single-node lab, remove the taint:

```bash
kubectl taint nodes --all node-role.kubernetes.io/control-plane-
```

Verify node status and taints:

```bash
kubectl get nodes
kubectl describe node
```

This is suitable for a lab. Production clusters usually keep control-plane nodes dedicated.

## 11. Test Kubernetes

Create a temporary namespace and nginx deployment:

```bash
kubectl create namespace test
kubectl create deployment nginx --image=nginx -n test
kubectl rollout status deployment/nginx -n test
kubectl get pods -n test -o wide
```

Expose it internally:

```bash
kubectl expose deployment nginx --name nginx --port=80 --target-port=80 -n test
kubectl get svc -n test
```

Test from a temporary pod:

```bash
kubectl run curl-test --rm -it --restart=Never --image=curlimages/curl -n test -- curl -I http://nginx
```

Clean up:

```bash
kubectl delete namespace test
```

## 12. Connect local workstation to EC2 Kubernetes

**Safer initial approach:** use SSH access and restrict Kubernetes API exposure to your IP. For remote kubectl, kubeconfig must contain a reachable API server endpoint and the API server certificate must validate that endpoint. Do not disable TLS verification.

### Direct API access option

1. Add Security Group TCP `6443` inbound from your workstation public IP (`/32` only).
2. Copy the kubeconfig from EC2 to your workstation. It contains privileged credentials—protect it and never commit it.

From local PowerShell/Git Bash (replace paths/IP):

```bash
scp -i /path/to/key.pem ubuntu@EC2_PUBLIC_IP:/home/ubuntu/.kube/config ./ec2-kubeconfig
```

The kubeconfig's `server:` value normally references the control-plane address. For remote use, it must be changed to the reachable address **only if** the API server certificate has that address in its Subject Alternative Names (SANs). If it does not, TLS validation fails. Do not solve this by disabling TLS validation; use a certificate with the proper SAN, a private endpoint, or an SSH/VPN/SSM-based access design.

Set kubeconfig in local terminal:

**PowerShell**

```powershell
$env:KUBECONFIG = "$PWD\ec2-kubeconfig"
```

**Linux/macOS/Git Bash**

```bash
export KUBECONFIG="$PWD/ec2-kubeconfig"
```

Verify:

```bash
kubectl get nodes -o wide
kubectl get pods -A
```

Unset the variable when done, or use a separate kubeconfig context carefully.

## 13. Local application access using port-forward

When a service is deployed but you do not want to expose it with an Ingress or NodePort, port-forward from your local machine:

```bash
kubectl -n product-development port-forward svc/product-service 3001:3001
```

Then locally open `http://localhost:3001`. This assumes product-service is deployed in that namespace and its Service port is 3001.

## 14. Image workflow with remote cluster

Example from your workstation:

```bash
docker build -f Dockerfile.prod -t YOUR_DOCKERHUB_USERNAME/product-service:1.0.0 .
docker push YOUR_DOCKERHUB_USERNAME/product-service:1.0.0
```

Then update the Helm values image tag in Git and push the commit. Kubernetes pulls the image from the registry. Private repositories require image pull credentials configured in the target namespace. Never commit registry credentials.

## 15. Install Argo CD

Create namespace:

```bash
kubectl create namespace argocd
```

Install the standard Argo CD manifests:

```bash
kubectl apply -n argocd --server-side --force-conflicts -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Wait for pods:

```bash
kubectl get pods -n argocd -w
```

Check deployments and services:

```bash
kubectl get deployments -n argocd
kubectl get services -n argocd
```

### Access UI through SSH tunnel (recommended)

On EC2, run a port-forward bound to localhost:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Keep it running. From your local workstation, open another terminal and tunnel that local EC2 port-forward:

```bash
ssh -i /path/to/key.pem -N -L 8080:127.0.0.1:8080 ubuntu@EC2_PUBLIC_IP
```

Browse to:

```text
https://localhost:8080
```

A certificate warning is expected for the default self-signed certificate in this lab setup. Avoid exposing the Argo CD UI directly to the internet.

### Get initial admin password (on EC2)

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```

Login:

- URL: `https://localhost:8080`
- User: `admin`
- Password: command output

Change the initial password after login. For anything beyond a personal lab, configure proper users/SSO and access controls.

## 16. Connect Argo CD to Git

Argo CD needs read access to the repo where your Helm chart and Application manifest live.

- Public repo: add the repository URL.
- Private repo: configure credentials (deploy key or token) inside Argo CD; never put credentials in Git.

An Argo CD Application specifies the Git URL, branch/tag/commit, chart path, values file, destination namespace, and sync policy. Argo CD monitors Git—not Docker Hub. Pushing an image is not itself a deployment event; updating the image tag in Git is.

## 17. Troubleshooting quick reference

| Symptom                | Check                                                                  |
| ---------------------- | ---------------------------------------------------------------------- |
| Node `NotReady`        | `kubectl get pods -n kube-system`; verify Flannel and CIDR             |
| Pods `Pending`         | `kubectl describe pod POD -n NS`; resources, taints, scheduling        |
| `CrashLoopBackOff`     | `kubectl logs POD -n NS --previous`; app config/logs                   |
| `ImagePullBackOff`     | `kubectl describe pod POD -n NS`; image/tag and registry access        |
| kubectl cannot connect | kubeconfig endpoint, Security Group, API reachability, certificate SAN |
| Argo CD pods not ready | `kubectl describe pod -n argocd`; resource pressure and logs           |

Useful commands:

```bash
kubectl get nodes
kubectl get pods -A
kubectl describe pod POD_NAME -n NAMESPACE
kubectl logs POD_NAME -n NAMESPACE --previous
sudo journalctl -u kubelet -n 100 --no-pager
```

## 18. Destructive reset / cleanup

Deleting the Argo CD namespace removes Argo CD:

```bash
kubectl delete namespace argocd
```

Resetting kubeadm destroys cluster state and is destructive. Only do this when intentionally rebuilding:

```bash
sudo kubeadm reset -f
```

Do not reset a cluster containing workloads/data you want to preserve. Additional CNI cleanup may be needed before rebuilding.

## 19. Suggested next steps

After infrastructure setup is verified:

1. Connect local `kubectl` to the EC2 cluster.
2. Create `product-development` and `product-production` namespaces.
3. Add the product-service Git repo to Argo CD.
4. Create the development Argo CD Application first.
5. Validate Helm rendering and Argo sync.
6. Deploy product-service to development.
7. Promote the tested image tag to production by updating Git values.

## 20. Access the Kubernetes Cluster from Your Local Machine Using SSH Tunneling

### 20.1 Why SSH Tunneling Is Required

The Kubernetes API server runs on the EC2 instance's private IP address, listening on port `6443`.

The local machine cannot directly access the EC2 private IP because it is inside the AWS VPC network. Instead of exposing Kubernetes API port `6443` publicly, we use SSH tunneling to securely forward traffic from the local machine to the EC2 instance.

The connection flow is:

```text
Local Windows Machine
       |
       | kubectl
       v
127.0.0.1:6443
       |
       | SSH Tunnel (encrypted)
       v
EC2 Public IP: 98.86.221.153
       |
       v
EC2 Private IP: 172.31.39.10:6443
       |
       v
Kubernetes API Server
```

SSH tunneling allows us to access the Kubernetes API server without exposing port `6443` to the public internet.

---

### 20.2 Copy the Kubernetes Configuration to Your Local Machine

The Kubernetes configuration file (`kubeconfig`) is located on the EC2 instance at:

```bash
/home/ubuntu/.kube/config
```

From your local Git Bash terminal, copy it to your project directory.

```bash
scp -i picknorder-k8s-dev.pem ubuntu@98.86.221.153:/home/ubuntu/.kube/config ./ec2-kubeconfig
```

This copies the Kubernetes configuration file locally.

---

### 20.3 Configure the Local Kubeconfig

Open the downloaded file:

```bash
notepad ec2-kubeconfig
```

Find the cluster configuration. By default, the Kubernetes API server endpoint will point to the EC2 private IP:

```yaml
server: https://172.31.39.10:6443
```

Change it to the local loopback address:

```yaml
server: https://127.0.0.1:6443
```

Add the `tls-server-name` field under the same `cluster` section:

```yaml
tls-server-name: 172.31.39.10
```

The cluster section should look similar to this:

```yaml
clusters:
  - cluster:
      certificate-authority-data: <existing-ca-data>
      server: https://127.0.0.1:6443
      tls-server-name: 172.31.39.10
    name: kubernetes
```

Do not modify or remove the existing certificate authority data.

The `tls-server-name` ensures that Kubernetes TLS certificate validation uses the EC2 private IP instead of the local loopback address.

Save the file.

---

### 20.4 Start the SSH Tunnel

Open Git Bash in your project directory and execute:

```bash
ssh -i picknorder-k8s-dev.pem -N -L 6443:172.31.39.10:6443 ubuntu@98.86.221.153
```

Explanation:

- `-i` specifies the SSH private key.
- `-N` tells SSH not to execute a remote command or open a shell.
- `-L` enables local port forwarding.
- `6443` is the port on your local machine.
- `172.31.39.10:6443` is the Kubernetes API server on the EC2 instance.
- `98.86.221.153` is the EC2 public IP address.

The terminal will appear to be doing nothing and will remain open. This is expected. The SSH tunnel is running in the foreground.

**Keep this terminal open while using kubectl.**

---

### 20.5 Configure kubectl to Use the Local Kubeconfig

Open a second Git Bash terminal in the same project directory.

Set the `KUBECONFIG` environment variable:

```bash
export KUBECONFIG="$PWD/ec2-kubeconfig"
```

This tells kubectl to use the copied and modified kubeconfig file instead of the default configuration.

The environment variable must be set in every new terminal session where you want to use this configuration.

---

### 20.6 Verify the Connection

Execute:

```bash
kubectl get nodes -o wide
```

Expected output should show the EC2 Kubernetes node.

You can also check all pods across namespaces:

```bash
kubectl get pods -A
```

If these commands return cluster information, the SSH tunnel and kubeconfig configuration are working.

---

### 20.7 Security Group Configuration

The EC2 security group should allow:

| Protocol | Port | Source                 | Purpose                      |
| -------- | ---: | ---------------------- | ---------------------------- |
| TCP      |   22 | Your public IP address | SSH connection and tunneling |

You do **not** need to expose TCP port `6443` to the public internet for this setup.

Keep the Kubernetes API server private and access it through the SSH tunnel.

---

### 20.8 Troubleshooting

#### Connection timeout to 172.31.39.10

If kubectl attempts to connect directly to:

```text
https://172.31.39.10:6443
```

the kubeconfig was not updated correctly, or kubectl is using a different configuration file.

Check:

```bash
echo $KUBECONFIG
```

Ensure it points to:

```text
ec2-kubeconfig
```

And verify that the server entry is:

```yaml
server: https://127.0.0.1:6443
```

#### SSH tunnel appears stuck

The following command:

```bash
ssh -i picknorder-k8s-dev.pem -N -L 6443:172.31.39.10:6443 ubuntu@98.86.221.153
```

does not open a shell or print normal output. It is expected to remain running while the tunnel is active.

Open a second terminal to execute kubectl commands.

#### Connection refused on 127.0.0.1:6443

Possible causes:

- The SSH tunnel is not running.
- The SSH tunnel was terminated.
- Local port `6443` is already being used.
- The Kubernetes API server is not running on the EC2 instance.

Check that the SSH tunnel terminal is still open and connected.

On the EC2 instance, check the API server:

```bash
sudo crictl ps | grep kube-apiserver
```

#### TLS certificate error

Verify that the kubeconfig includes:

```yaml
tls-server-name: 172.31.39.10
```

Do not disable TLS certificate verification to bypass the error.

On the EC2 instance, inspect the API server certificate:

```bash
sudo openssl x509 -in /etc/kubernetes/pki/apiserver.crt -noout -text | grep -A2 "Subject Alternative Name"
```

Confirm that the certificate contains the EC2 private IP address.

---

### 20.9 Final Connection Workflow

Whenever you want to access your EC2 Kubernetes cluster from your local machine:

**Terminal 1 — Start SSH tunnel**

```bash
ssh -i picknorder-k8s-dev.pem -N -L 6443:172.31.39.10:6443 ubuntu@98.86.221.153
```

Keep this terminal running.

**Terminal 2 — Configure kubectl**

```bash
export KUBECONFIG="$PWD/ec2-kubeconfig"
```

**Run Kubernetes commands**

```bash
kubectl get nodes
kubectl get pods -A
kubectl get services -A
kubectl get namespaces
```

When finished, stop the SSH tunnel using:

```text
Ctrl + C
```

This terminates the tunnel but does not stop or affect the Kubernetes cluster running on EC2.

## Official references

- Kubernetes kubeadm installation: https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/
- Create kubeadm cluster: https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/
- Docker Engine on Ubuntu: https://docs.docker.com/engine/install/ubuntu/
- containerd docs: https://github.com/containerd/containerd/blob/main/docs/getting-started.md
- Flannel: https://github.com/flannel-io/flannel
- Argo CD Getting Started: https://argo-cd.readthedocs.io/en/stable/getting_started/

---

**Security reminder:** This is a lab cluster. Restrict SSH/API access to your IP, protect private keys and kubeconfig, keep TLS validation enabled, and do not expose Argo CD or NodePorts broadly.
