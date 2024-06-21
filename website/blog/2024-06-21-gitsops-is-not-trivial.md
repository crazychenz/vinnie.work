---
slug: 2024-06-21-gitsops-is-not-trivial
title: "GitOps Is _Not_ Trivial"
draft: false
---

## Overview

Recently I've been working on revamping my home lab setup with some more dedicated hardware and I've been replacing a lot of custom scripts and processes with more or less industry standard workflows (e.g. Runners, K8s, Flux).

In doing this, I've really learned that it is not trivial to setup a complete tech stack for GitOps/DevOps at home. Many tools, like Flux, with provide documentation or demos on setting up their system for only the simplest cases, and those cases will usually involve some cloud service like Github or Dockerhub to handle a bunch of the configuration.

<!-- truncate -->

The topic that we're referring to is "vendor debt". Law Insider defines "vendor debt" as money owed to a company for good or services already provided. I'm not talking about that. I'm referring to the replacement cost or implementation cost of those goods and services if they suddenly dried up from existing vendors. If Github suddenly decided to charge for every clone of your code base, you might find yourself having to implement your own source code revision control service. Do you have an idea of the level of effort to make that happen?

Maybe "technical vendor debt" is the term I'm after?

If you're like me and you do not want to depend on upstream vendor services (but don't mind depending on all of the open source code available on the net), you may find yourself developing a DevOps workflow for your various projects. While fundamentally this could be seen as a trivial set of git hooks and scripts with SSH access ... the reality is that you'll likely work your way into wiring up more common frameworks like Git Actions, Kubernetes, and FluxCD to: 

1. Prevent from reinventing what's already been done.
2. Provide yourself an environment that can be picked up by other users of the same framework.

Below, I've listed an outline of things that I see as being required to properly setup a simple (Docusaurus) blog project so that when I commit, its automatically deployed to a local K8s cluster. Note that my intention is not to specify how to do this, but to visualize what needs to be done. We want to understand the various moving parts and the level of effort involved. (That said, if you want to know how to accomplish a lot of this, I have documented that as well.)

## Assumptions

A couple assumptions:

- A machine can be a VM or a bare metal device.
- A dedicated machine with its own dedicated memory to support building code and docker images.
- A dedicated machine with its own dedicated memory to support deployment and serving applications.
- I'll be using DigitalOcean DNS
- I'll be using Let's Encrypt ACME certificates.

Note: Setting up a CA with Caddy and a DNS with dnsmasq is relatively easy. But configuring DNS and CA's across all intranet infrastructure is too much unless you have Ansible or Puppet fully integrated into all systems. (I do not.)

## The Outline

Disclaimer: The below items are written from memory and not tested. While I've attempted to make it as linear as possible, there may be steps that are optimally moved around. That said, as you work your way through the various items, its always going to change as you test what things are working and what things you may have fat fingered. In summary, this list is not precise, but rather accurate enough to express the complexity involved with setting up a _simple_ modern blog site with full and production quality CI/CD principles and practices.

### Setup Build System Machine

Summary: The build system machine is responsible for building container images. We deliberately keep it separate from the k3s machine because it runs with root permissions and can easily consume resources.

- Install machine operating system.
- Create the user that will be capable of doing the CI/CD tasks (e.g. `cicd`).
- Install a VPN (e.g. tailscale) for global access to LAN.
- Install `docker-ce`, _Docker Compose v2_, `sudo`, `vim`, `curl`, `git`.
- Install and configure `anacron`/`cronie`.
- Add cronjob to prune unused container images.

### Setup K3s System Machine

Summary: The K3s system machine is a kubernetes cluster node that serves deployed applications. While we'd like to GitOps all the things, this does not include critical services like Gitea.

- Install machine operating system. (This could be a bare metal machine or a VM.)
- Create the user that will be capable of doing the CI/CD tasks (e.g. `cicd`).
- Configure OpenSSH to listen on port 2222 (to prevent confliction with Gitea).
- From the `cicd` unix account, create SSH keys.
- Copy SSH keys to build system's `cicd` account.
- Install a VPN (e.g. tailscale) for global access to LAN.
- Install `k3s`, `k9s`, `curl`, `sudo`, and `vim`.
- Configure `k3s` to listen to the VPN address.
- Download and add `flux` to PATH.
- Optionally add `cicd` to `sudo` group.

### Setup DNS and CA

Summary: With the guilty knowledge of the dependencies for this whole process, I already know that I'll need 4 distinct hostnames to accomplish the configuration we're aiming for.

- Point domain nameserver `vinnie.work` from GoDaddy to DigitalOcean
- Create DigitalOcean API key that permits `certbot` to renew certificate unattended.
- Add `-K3s-VPN-IP- git.vinnie.work` entry to DigitalOcean DNS.
- Add `-K3s-VPN-IP- blog.vinnie.work` entry to DigitalOcean DNS.
- Add `-Build-VPN-IP- build.vinnie.work` entry to DigitalOcean DNS.
- Add `-K3s-VPN-IP- flux.vinnie.work` entry to DigitalOcean DNS.

### Setup Gitea

- Create and apply kustomization of Gitea deployment for k3s server.
  - This will start the Gitea deployment with initial configuration.
  - Create monthly cronjob to renew certificate for `git.vinnie.work`.
  - Create initial certificate for `git.vinnie.work` with certbot.
  - The Gitea service should be listening on port 80 with a ClusterIP.
  - The Gitea service should be listening on port 22 with a LoadBalancer IP.
- Create and apply kustomization of Caddy.
  - Configure caddy with the `git.vinnie.work` certificate and a reverse proxy to the Gitea deployment associated service.
  - The Caddy service should be listening on port 443 with a LoadBalancer IP.
  - Deployment Name: `proxy-deployment`
  - Namespace: `work-vinnie-proxy-ns`
- Open `git.vinnie.work` in a browser and setup the Gitea service (w/ defaults).
- Do the initial account sign-up on Gitea to create the administrator account.
- With the administrator account, create a CI/CD account (e.g. `cicd`).
- Copy the public SSH key from the `cicd` unix account into the `cicd` Gitea account SSH keys.
- Fetch the **action runner registration** key from site administration in Gitea.
- Create an organization `vinnie.work` in Gitea.
  - Create a (mono) project `everything` in Gitea organization `vinnie.work`.
    - Note: I'm a fan of small projects in contrast to mono-projects, but there is no reason to over complicate this procedure with that bias.
  - Enable Actions for the `everything` project.
  - Create a `cicd` group in the `everything` project with the ability to commit and write packages.
  - Add `cicd` as a member of the `cicd` group.
- Logout of admin and login to `cicd`.
- Add `cicd` unix account public SSH key to `cicd` SSH keys in Gitea

### From Builder

- Login as `cicd`
- SCP a copy of `/etc/rancher/k3s/k3s.yaml` to builder for kubectl access.
- Set the `cicd` profile so KUBECONFIG is set to `k3s.yaml` file.
- Modify `k3s.yaml` to point at correct IP or hostname.
- Install k3s-`kubectl` and `k9s` from GitHub to builder.

- git clone git@git.vinnie.work:vinnie.work/everything.git && cd everything

- Construct Certbot Container Project:
  - Create docker-compose to build and run `certbot` in a container.
    - Tagged as: `git.vinnie.work/vinnie.work/certbot`
  - Git Add/Commit/Push Updates upstream
  - Build & Push the container image to `git.vinnie.work`

- Initialize a Docusaurus project (as our blog)
  - Construct docker-compose.yaml to build image.
    - Tagged as: `git.vinnie.work/vinnie.work/blog`
  - Git Add/Commit/Push Updates upstream
  - Build & Push container image to `git.vinnie.work`
  - Create and apply kustomization of Docusaurus deployment for k3s server.
    - Service name: `blog-service`
    - Namespace: `work-vinnie-blog-ns`
  - Git Add/Commit/Push Updates upstream
  - Point `blog.vinnie.work` endpoint in Caddy at `http://blog-service.work-vinnie-blog-ns.svc.cluster.local`
  - Git Add/Commit/Push Updates upstream
  - `kubectl -n work-vinnie-proxy-ns rollout restart deploy proxy-deployment`

### From k3s

- Login as `cicd`
- Do flux prechecks
- Bootstrap flux (w/ Image Automation Plugins)
  - Use the `vinnie.work/everything` project with a `flux-config` path.
  - Use `flux-system` namespace.
- Use kubectl or k9s to wait for flux to be completely up and _Running_.
- Create and apply kustomization for flux integration for `blog.vinnie.work`.
  - Register `vinnie.work/everything` GitRepository.
  - Register `vinnie.work` ImageRespository.
  - Register ImagePolicy `^deploy-(?P<ts>.*)-[a-fA-F0-9]+` (Determines how to select latest image)
  - Register ImageUpdateAutomation (w/ updates kustomization manifests based on ImagePolicy)
  - Register Kustomization (re-deploys updates to compiled kustomization manifests)
  - Add ImageUpdateAutomation annotations to Yaml manifests.
  - Register Receiver (web hook to trigger flux reconciliation)
  - Register Secret (for Receiver)
  - Git Add/Commit/Push Updates upstream
  - Point `flux.vinnie.work` endpoint in Caddy at `http://webhook-receiver.flux-system.svc.cluster.local`
  - Git Add/Commit/Push Updates upstream
  - `kubectl -n work-vinnie-proxy-ns rollout restart deploy proxy-deployment`

### From builder

- Mirror several action repositories from Github to local Gitea instance (make them public!):
  - `https://github.com/actions/checkout.git -> git.vinnie.work/actions/checkout.git`
  - `https://github.com/docker/login-action.git -> git.vinnie.work/docker/login-action.git`
  - `https://github.com/docker/build-push-action.git -> git.vinnie.work/docker/build-push-action.git`

- Construct gitea_runner container project
  - Create docker-compose to build and run `gitea_runner` in a container.
    - Tagged as: `git.vinnie.work/vinnie.work/nodejs_runner`
    - Persist runner registrations in storage volume.
    - Restart: unless-stopped
  - Include `docker-ce`, _Docker Compose v2_, and other required software (e.g. nodejs).
  - Git Add/Commit/Push Updates upstream
  - Build & Push the container image to `git.vinnie.work`

- Start `git.vinnie.work/vinnie.work/nodejs_runner` and register it with the Gitea Actions Registration key.

- Within Docusaurus/blog.vinnie.work project:
  - Create `.gitea` action/workflow folder.
  - Create the actions script to clone, build, push, and call flux webhook.
    - This is usually contained within a build/do/cicd script in the project folder.
  - Git Add/Commit/Push Updates upstream

- Make documentation changes to Docusaurus project.
- Git Add/Commit/Push Updates upstream
- Check updates were applied. (Note: This can take 10s of minutes the first time.)

- *Yay*, All done! **Wasn't that simple?** (It was only, roughly, 105 steps.)

![side eye meme](./2024-06-21-gitsops-is-not-trivial/sideeye.webp)

## What You'll See In Practice

Often I see over trivialized environments that lean heavily on Github, Dockerhub, and/or other cloud services. It may resemble something like:

- Create a Github project (from scratch or with a template)
- Copy and paste some yaml or install some helm template.
- Viola, you have CI/CD. _Pffft!_ Good luck.

This is perfectly normal for getting a project quickly off the ground, but in the spirit of making deliberate decisions, as an engineer or developer, I want to know what the replacement cost is if those services: go away, change price models, change policies, or any other number of decisions businesses have every right to make on a whim. If you want to remain properly prepared for eventualities, know the actual dependency debt you are incurring.

## Comments

<Comments />


