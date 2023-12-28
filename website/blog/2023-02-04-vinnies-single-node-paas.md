---
slug: 2023-02-04-vinnies-single-node-paas
title: Vinnie's Single Node PaaS
draft: false
---

## Blurb

So my Docker image and container collection has grow over the past years and I see no sign of it stopping. From adding random services for integrations to multi container services for development, staging, and deployment, to throw away containers, to scheduled task automation .... its time that I start to consider setting up my own Platform as a Service (PaaS).

<!-- truncate -->

## Platform As A Service

My primary goal is to get my services/containers into a more managed and stable state. With the right setup I believe I'm no where close to maximizing my ability to grow my container usage. My requirements are different than a lot of the documentation goes through:

- I have a single (x86) hardware system with normal residential resources (48-64GB Mem, a few TB of disk).
- I use a single TLS termination gateway (nginx) because I don't have the time or interest in running a FreeIPA or other Identity Management System. Managing certificates in some overly complex system buys me nothing at this point.

## Base Operating System

I'm setting up my PaaS as a _non-user_ system that I should rarely login to for any reason. All access should be via `kubectl` or web front-ends. For this reason, I'm going with the Alpine Linux distribution because of its light usage of memory and disk. My initial VM setup is 4GB memory and 32 GB disk (using LVM). I've downloaded alpine-virt-3.17 because of its specialization in installation as a Virtual Machine Guest.

From console:

- Boot alpine-virt-3.17.0-x86_64 in VM (4GB-mem,64GB-disk)
  - Login with the password-less `root` account.
  - As root, run `setup-alpine` (Idealy w/ OpenSSH)
  - **_ REBOOT _**
- Install curl, iproute2, sudo, openrc, bash
  - `apk -U add curl iproute2 sudo openrc bash`
  - `sed -i '/^wheel:/ s/$/,user/' /etc/group`
- Install any VPN packages. (I use Tailscale to VPN into my home network.)
  - `apk add -U tailscale` (may need to uncomment community repo in `/etc/apk/repositories`)
  - `rc-update add tailscale default`
  - `/etc/init.d/tailscale start`
  - `tailscale up`
  - Login via another device's web browser.

## Hostname Setup

For my single node PaaS, I intend to have all services behind a single IP address. I therefore have setup a simple `*.paas.vinnie.work` rule in my DNS provider that will forward all subdomains to my Kubernetes (VPN) IP.

If you don't want to post your address to a public DNS server, you can always set the host name in the `/etc/hosts` or `C:\Windows\system32\drivers\etc\hosts` file of the workstation you are working from.

## Rancher and K3S

Even though Rancher's Docker container didn't work for me, I've still kept up hope that one day I would run Rancher because I did see the value in it if I could get Ingress to work as intended. Therefore, I decided to use K3S as my Kubernetes Engine. Supposedly its K8S API certified by some group of people and therefore should be compatible with cloud services or other certified engines if I ever decided to migrate. Great!

One of the beautiful things about K3S is that it is a single binary. If you've followed along with my blog here, you'll know that I have an unhealthy obsession with statically built binaries. This also makes installation quite simple for tinkering. You literally can download the binary from [GitHub](https://github.com/k3s-io/k3s) and run `k3s server` to have a Kubernetes cluster/node/api running on your system.

For a clean install, the [K3S documentation](https://docs.k3s.io/) recommends that you go the curl/sh route with something like (as root):

```sh
curl -sfL https://get.k3s.io | sh -
```

Once that downloads the `k3s` static binary from GitHub and initializes the environment, you are technically done. You have a single Node PaaS kubernetes setup ready to go.

The initial install should include a `traefik` IngressClass so you can setup a Deployment, Service, and Ingress to get fully route-able access to your service. So now on to making the things happen!

## Single Node PaaS

As previously mentioned, `kubectl api-resources` and `kubectl explain` are your friends when attempting to discover or understand various yaml options. Below is an example Yaml configuration that include the Deployment, Service, and Ingress resources. The intention is to forward all requests from `http://myapp.paas.vinnie.work/myapp` to the test `nginx` container via the myapp Service and myapp Pod.

<details>

<summary>The myapp Yaml</summary>

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-deployment
  labels:
    app: myapp-deployment
spec:
  replicas: 1
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: nginx
          image: nginx:latest
          ports:
            - containerPort: 80
---
apiVersion: v1
kind: Service
metadata:
  name: myapp-svc
  namespace: default
  labels:
    app: myapp-svc
spec:
  type: ClusterIP
  selector:
    app: myapp
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: 80
---
# Note: This is a Middleware required to do URL rewriting with Traefik
# Note: To learn more, see the Traefik Ingress Documentation online.
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: strip-prefix
  # No namespace defined
spec:
  stripPrefixRegex:
    regex:
      - ^/[^/]+
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-traefik
  namespace: default
  annotations:
    ingress.kubernetes.io/ssl-redirect: 'false'
    traefik.ingress.kubernetes.io/router.middlewares: default-strip-prefix@kubernetescrd
spec:
  ingressClassName: traefik
  rules:
    - host: myapp.paas.vinnie.work
      http:
        paths:
          - pathType: Prefix
            path: /myapp
            backend:
              service:
                name: myapp-svc
                port:
                  number: 80
```

</details><br />

Copy all of this yaml into a `myapp.yaml` and then _apply_ it with `kubectl`:

```sh
kubectl apply -f myapp.yaml
```

Presuming everything went according to plan and you've allowed port 80 to get through your local firewalls, you should now be able to open URL `http://myapp.paas.vinnie.work/myapp` with a web browser from your workstation and see the "Welcome to Nginx!" web page.

From here, you should now have a simple baseline to work from where you can start to replace or add aspects to the system like ConfigMaps, Secrets, and PersistentVolumeClaims. If you are feeling even more adventurous, you can start to setup your first StatefulSet (in contrast to a Deployment) to experiment with its behaviors. Hint: Watch how it names the pods compared to Deployment replicas.

If you want to tinker with the actual Yaml that is loaded into Kubernetes, there are several ways to change it:

- You can always re-run the `kubectl apply` command you ran before and as long as the resources have the same names, Kubernetes will detect the changes you've made between the new file and what was previously loaded.

- You can use the `kubectl edit <resource-type> <resource-name>` to modify the resource on the fly, in the terminal, with what ever editor you have set in EDITOR. (I typically use `vim`). Once you save and quit the editor, Kubernetes detects and applies the changes to the system. Example:

```sh
kubectl edit deployment myapp-deployment
```

## `kubectl`

Ok, so we now can deploy a service via Yaml, what else can we do with `kubectl`. There is a long list of things that you can do with `kubectl` in the [K8S kubectl Cheatsheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/). Here are some that I've specifically found useful:

Show all pods, deployments, services, and so forth in all namespaces:

```sh
kubectl get all -A
```

Show all ingress routing rules for all namespaces:

```sh
kubectl get ingress -A
```

Create a deployment without a Yaml definition:

```sh
kubectl create deploy <deploy name> --image <container image>
kubectl create deploy nginx --image nginx
```

Create a service without a Yaml definition:

```sh
kubectl expose deploy <deploy name> --port <port>
kubectl expose deploy nginx --port 80
```

Create a HostPort to access A service or pod via localhost or another bind address:

```sh
kubectl port-forward TYPE/NAME \
    [--address <[localhost][,ipv4]>] \
    [<host-port-N>:<inner-port-N> ...]
kubectl port-forward --address localhost pod/nginx \
    8080:80 8443:443
```

Construct a Pod/Container without a Yaml definition:

```sh
kubectl run NAME [options][--env=] [--port=] \
    --image=<image> -- [COMMAND] [args...] [options]
kubectl run mysql-client -it --rm --restart=Never \
    --image=mysql -- mysql -h mysql -ppassword
```

Create a literal secret:

```sh
kubectl create secret generic db-user-pass \
    --from-literal=username=admin \
    --from-literal=password='S!B\*d$zDsb='
```

Create a secret from file paths:

```sh
kubectl create secret generic db-user-pass \
    --from-file=username=./username.txt \
    --from-file=password=./password.txt
```

View secret values in terminal:

```sh
kubectl get secret db-user-pass \
    -o jsonpath='{.data.password}' | base64 --decode
```

## Resources

- [K8S Cheatsheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)

## Comments

<Comments />
