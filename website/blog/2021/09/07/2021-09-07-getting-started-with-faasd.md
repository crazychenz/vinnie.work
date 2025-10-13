---
slug: 2021-09-07-getting-started-with-faasd
title: 'Getting Started With faasd'
draft: false
---

As an application developer, I wanted to get more of an appreciation (and independence) of functions as a service (faas) (i.e. serverless). There is a product called OpenFaaS that is a framework for setting up your own serverless provider. This is akin to setting up your own AWS Lambda, Azure Functions, or Firebase Functions. The trouble is that I felt I had already wasted enough time fiddling with Kubernetes and other related technologies that frankly were too much for my needs.

But out of nowhere I ran into `faasd`. `faasd` is a light weight version of OpenFaaS services that allows me to throw up functions on a VM or even a RaspberryPi. Of course I dived right in, thinking this would be as simple as a download, install, run kind of operation. Oh how I was wrong. Even with its light weighty-ness, it requires a pretty vast knowledge of systems and networking to get going correctly. Additionally, this is a very immature product that doesn't have the friendly and polished UX that I was hoping for. None the less, its what we've got and I was determined to get it going.

<!--truncate-->

## System Overview

There are two primary systems that need to be setup. In the following article I intend to jump back and forth between these systems through the various phases of setup; OS Setup, Certificate Generation/Distribution, Service Setup, Service Usage. The two systems can be aarch64/arm64 or x86_64/amd64. I've chosen to use x86_64 as my development host where I will build my functions for deployment and an arm64 Raspberry Pi 4 to host my deployed functions.

TODO: Show picture.

## OS Setup

### The Development Host OS

The development host is where we'll develop our function code, build the OCI images that make up the function deployment, publish the images to a local docker registry, and deploy the functions from. For context, in all of my examples I'm using Ubuntu 20.04 on the development host. The development host can be a virtual machine or a real host. I am using a VirtualBox virtual machine with bridged network adapters for my setup.

Once you've got the VM and OS installed, you'll need to at a minimum, have internet, and install the following packages:

- Git
- Docker
- OpenSSL (at least version 1.1.1)

The network identity for our development host will hence be the IPv4 address 10.20.30.40.

### The Function Host OS

My function host is a Raspberry Pi 4. It has 8GB of RAM and I'm running [RaspiOS Lite 64bit](https://downloads.raspberrypi.org/raspios_lite_arm64/images/raspios_lite_arm64-2021-05-28/) on it. Its important that you don't use the standard RaspiOS because it has an `armhf` user space architecture that is incompatible with the `faasd` scripts and binaries that we'll be running.

Because of how new the arm64 repositories are for the Raspberry Pi are at the time of this writing, its a good idea to do the typical update/upgrade.

```
sudo apt-get -y update ; sudo apt-get -y upgrade
```

In addition to the typical getting things working, I recommend creating a new account, adding it to sudo, and removing the `pi` account. The `pi` account is just asking to get hacked if you ever expose your device to the internet. Some other recommendations (generally outside the scope of this article) include:

- Install iptables or ufw and lock down network access.
- Forbid all openssh root logins.
- Allow only openssh key logins. (i.e. no password logins).

After the initial operating system setup, ensure that there is no docker installed. This is because docker's `containerd` implementation conflicts with the `containerd` that `faasd` will be using. I'm not just repeating some literature, I tried it and it didn't work. While there may be some `containerd` plugins and configurations that'll get it going, I've yet to find the way to thread that needle.

Things you do want to install are:

- Git
- Curl
- An OpenSSH Server

The network identity for our function host will hence be the IPv4 address 10.20.30.41.

## Certificate Generation

### The Development Host Certificates

You'll want to generate some certificates that we'll be using everywhere. Generate these certificates on the development host with an OpenSSL that is newer than v1.1.1. The following is a script you can use to generate a `certs` folder that'll contain all the files you need. Note: The IP specified in the script needs to match the actual IP of the development host that you intend `faasd` to connect to. This IP is tied to the certificates that we intend to use and if there is a mismatch, you'll be constantly bombarded with an annoying `mismatched certificate` error or `no IP SANs` error.

The script source:

```bash
#!/bin/bash

: ${REGISTRY_ADDR:=10.20.30.40}

if [ ! -e certs ]; then
  # Note: Rename or remove certs folder to re-run cert generation.
  mkdir -p certs

  openssl genrsa -out certs/ca.key 4096
  openssl req -x509 -new -nodes -subj "/O=CA/CN=cert" -key certs/ca.key -sha256 -days 65535 -out certs/ca.crt
  openssl genrsa -out certs/site.key 2048
  openssl req -new -sha256 -key certs/site.key -out certs/site.csr \
      -subj "/O=MyOrg/CN=site"
  openssl req -in certs/site.csr -noout -text

  openssl x509 -req -in certs/site.csr -out certs/site.crt \
      -CA certs/ca.crt -CAkey certs/ca.key -CAcreateserial \
      -extfile <(printf "subjectAltName=IP:$REGISTRY_ADDR") \
      -days 65535 -sha256
  openssl x509 -in certs/site.crt -text -noout
fi
```

The ca.crt certificate is going to be distributed the most because its the certificate that is used to verify the legitimacy of the docker registry site certificate. The first place we'll install the certificate is in the docker client's configuration. Assuming we'll be hosting the docker registry on TCP port 5443:

```sh
sudo mkdir -p /etc/docker/certs.d/10.20.30.40:5443/
sudo cp certs/ca.crt /etc/docker/certs.d/10.20.30.40:5443/ca.crt
```

Additionally, for good measure, we'll want to install the `ca.crt` into the system CA Certificate Bundle:

```sh
sudo cp certs/ca.crt /etc/ssl/certs/faas-system-root-ca.crt
sudo update-ca-certificates
# Note: You may need to restart any relevant services after this (or just reboot).
```

Later, we'll need to install the `ca.crt` into a docker container, so don't lose track of your `certs` folder's location.

### The Function Host Certificates

Once the certificates are setup, you'll want to copy `certs/ca.crt` file to the function host. I generally do this with an OpenSSH `scp` command:

```sh
scp certs/ca.crt user@10.20.30.41:/home/user/faas-system-root-ca.crt
```

From the function host, you'll now want to install the certificate into the system's CA Certificate Bundle:

```sh
sudo cp /home/user/faas-system-root-ca.crt /etc/ssl/certs/
sudo update-ca-certificates
# This reboot may be optional here, but is required if there is an existing
# containerd service installed in the system when update-ca-certificates is run.
sudo reboot
```

## Service Setup

### The Development Host Tools

#### faas-cli

The first and most obvious thing to install on the host is the OpenFaaS `faas-cli`. This is as simple as running the following:

```sh
curl -sLfS https://cli.openfaas.com | sudo sh
```

#### buildx

Next, we want to install the [`buildx` extension](https://github.com/docker/buildx/releases/tag/v0.6.3) into the docker client. This is accomplished with:

```sh
wget https://github.com/docker/buildx/releases/download/v0.6.3/buildx-v0.6.3.linux-amd64
mkdir -p ~/.docker/cli-plugins
mv buildx-v0.6.3.linux-amd64 ~/.docker/cli-plugins/docker-buildx
chmod a+x ~/.docker/cli-plugins/docker-buildx
```

You can checkout [Docker Buildx](https://docs.docker.com/buildx/working-with-buildx/) documentation for more information.

#### buildkitd

After `buildx` is installed, we need to manually inject our `ca.crt` into its complimentary docker container `moby/buildkit:buildx-stable-1`. First we need to pull and create the container:

```sh
docker pull moby/buildkit:buildx-stable-1
docker run -d moby/buildkit:buildx-stable-1
docker ps | grep buildkitd
```

Once the buildkitd container is up and running, we'll inject the process with our certificate by running:

```sh
CONTAINER=$(docker ps | grep moby/buildkit | cut -d ' ' -f1) && \
  docker cp certs/ca.crt $CONTAINER:/etc/ssl/certs/faas-system-root-ca.crt && \
  docker exec $CONTAINER update-ca-certificates && \
  docker restart $CONTAINER
```

Note: This is a **very** ugly hack that can be made much more robust. But as long as the docker container stays up, it works for now.

#### Private Docker Registry

Finally, we need to setup our private docker registry where we'll host all of our function images. `faasd` by default wants to use docker hub, so that can be a much easier route. I don't want to pay for docker hub (or expose my apps), so I host my own registry on my development host. When we setup the registry, we must ensure that we have TLS enabled or `faasd` will refuse to do anything useful. This is where our `site.crt` and `site.key` files come in. They can be invoked with something like the following command:

```sh
docker run --rm \
  --name registry \
  -v $(pwd)/certs:/certs \
  -e REGISTRY_HTTP_ADDR=0.0.0.0:443 \
  -e REGISTRY_HTTP_TLS_CERTIFICATE=/certs/site.crt \
  -e REGISTRY_HTTP_TLS_KEY=/certs/site.key \
  -p 5443:443 \
  registry:2
```

For more longer lived services, I recommend using `-d --restart=always` instead of `--rm`.

This setup can be tested by pulling `hello-world` from docker hub and then pushing the same image into our newly hosted registry:

```sh
docker pull hello-world
docker tag hello-world 10.20.30.40:5443/hello-world
docker push 10.20.30.40:5443/hello-world
```

Once that is working, the docker bit is done. (But keep the registry running!)

### The Function Host Tools

On the Raspberry Pi, most everything is automated by some scripts in the `faasd` repository. Start by cloning the repo with (Note: I am currently using commit 57322c49476ec04aa176fb9bd76670ddec3c7c5c.):

```sh
git clone https://github.com/openfaas/faasd
```

Before we run the install script, there may be a bug in regards to the 1.5.4 version of containerd that the install script attempts to download and install. The file is actually named with version 1.3.5.

Change the line that says:

```sh
curl -sSL https://github.com/alexellis/containerd-arm/releases/download/v1.5.4/containerd-1.5.4-linux-arm64.tar.gz | $SUDO tar -xvz --strip-components=1 -C /usr/local/bin/
```

Replace the line with the following:

```sh
curl -sSL https://github.com/alexellis/containerd-arm/releases/download/v1.5.4/containerd-1.3.5-linux-arm64.tar.gz | $SUDO tar -xvz --strip-components=1 -C /usr/local/bin/
```

Once that's fixed, you can simply run the install command to install faasd, containerd, and some other relevant tools:

```sh
./hack/install.sh
```

Assuming that went well, the system should now be setup. I usually look for open ports with `netstat -tna` to verify success. The ports you are looking for are 8080, 8081 (a bunch), and 9090.

You can verify the service's authentication by logging in with the following:

```sh
sudo cat /var/lib/faasd/secrets/basic-auth-password | faas-cli login --username admin --password-stdin --gateway http://10.20.30.41:8080
```

## Create OpenFaaS Function

### New Function On Development Host

To create a new nodejs based function, run a command similar to the following:

```sh
faas-cli new myfunction --lang node --gateway http://10.20.30.41:8080
```

That'll create a few files, including a `handler.js` file. In that file, you can create dummy code with something like:

```javascript
'use strict';

module.exports = async (event, context) => {
  const result = {};
  return result;
};
```

Once that is save, we have our function code. Now we need to update the function deployment configuration. This is found in a YAML file that should match the name of the function. Something like `myfunction.yml`. In there we'll setup some host specific stuff:

```yaml
version: 1.0
provider:
  name: openfaas
  gateway: http://10.20.30.41:8080
functions:
  testfunc:
    lang: node12
    handler: ./myfunction
    image: 10.20.30.40:5443/myfunction:latest
```

Note: The _gateway_ is the function host and the _image_ refers to the development host IP that is also references in our `site.crt` (or the host of the docker registry). If any of these values change, the certificates need to be regenerated and distributed as appropriate. (A pain to be sure.)

Once all that is setup, we are ready to build and deploy. In a homogenous architecture setup, we could just do discrete build, push, and deploy steps; but since we're doing cross architectural builds, we have to use publish. The following will build the function for the platforms specified and push them into our docker registry (as specified in the YAML configuration file):

```sh
faas-cli publish --platforms linux/arm64 -f myfunction.yml
faas-cli deploy -f testfunc.yml
```

Note: If you're getting an error that is something like `exec user process caused "exec format error"`, it's likely that you are attempting to run an `x86` container on `arm64`. In this case, double check your platforms values. (e.g. arm64 and amd64 look very similar.)

If everything went off without an error, you can login to the OpenFaaS service by going to http://10.20.30.40:8080 and then test the function in the browser.

## References

- [Raspberry Pi OS for arm64 finally released!](https://www.reddit.com/r/raspberry_pi/comments/gs6omd/raspberry_pi_os_for_arm64_finally_released/)
- [Using private Docker registries](https://ericstoekl.github.io/faas/operations/managing-images/)
- [Deploy a registry server](https://docs.docker.com/registry/deploying/)
- [faasd - lightweight Serverless for your Raspberry Pi](https://blog.alexellis.io/faasd-for-lightweight-serverless/)
- [Unmask a Masked Service in Systemd](https://blog.ruanbekker.com/blog/2017/12/09/unmask-a-masked-service-in-systemd/)
- [Github openfaas/faasd](https://github.com/openfaas/faasd)
- [Getting "x509: certificate signed by unknown authority" by microk8s](https://stackoverflow.com/questions/62930043/getting-x509-certificate-signed-by-unknown-authority-by-microk8s)
- [OpenFaaS - Create Functions](https://docs.openfaas.com/cli/templates/#nodejs-12-node12-of-watchdog-template)
- [Creating Docker multi-arch images for ARM64 from Windows](https://andrewlock.net/creating-multi-arch-docker-images-for-arm64-from-windows/)
- [Docker Buildx](https://docs.docker.com/buildx/working-with-buildx/)
- [Github docker/buildx Releases](https://github.com/docker/buildx/releases/tag/v0.6.3)
- [What is Buildkit?](https://earthly.dev/blog/what-is-buildkit-and-what-can-i-do-with-it/)
- [Github moby/buildkit Dockerfile](https://github.com/moby/buildkit/blob/master/Dockerfile)
- [Github moby/buildkit](https://github.com/moby/buildkit)
- [A private CA buildkit workaround](https://github.com/docker/buildx/issues/80#issuecomment-533844117)

## Comments

<Comments />

