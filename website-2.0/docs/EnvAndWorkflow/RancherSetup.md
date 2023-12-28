---
sidebar_position: 4
title: Rancher Single Node Setup
---

## Setup VM (or Machine)

From console:

- Install Ubuntu 22.04.1 LTS (Jammy)
  - LVM Storage
  - OpenSSH
  - Install Minimal Server Packages
  - No Extra Packages

- Install && Setup Tailscale (VPN)

  ```sh
  curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/jammy.noarmor.gpg \
    | sudo tee /usr/share/keyrings/tailscale-archive-keyring.gpg >/dev/null
  curl -fsSL https://pkgs.tailscale.com/stable/ubuntu/jammy.tailscale-keyring.list \
    | sudo tee /etc/apt/sources.list.d/tailscale.list
  sudo apt-get update
  sudo apt-get install tailscale
  systemctl enable tailscaled
  systemctl start tailscaled
  sudo tailscale up
  tailscale ip -4
  ```
- VM Snapshot (tailscale is very slow to install)

From Remote SSH Terminal:

- Install Docker, Docker-Compose, Tmux, Curl, and Vim
  `sudo apt-get install docker.io docker-compose tmux curl vim`

- Setup Docker

  ```sh
  systemctl enable docker
  systemctl start docker
  sudo usermod -aG docker $(whoami)
  ```

- Setup 
  - Remote User SSH Key Configuration
  - pam_ssh_agent_auth
- Set secure randomly generated password

- VM Snapshot
- Reboot

- Pull Rancher: `docker pull rancher/rancher:latest`
- Run Rancher First Time:

  ```sh
  docker run -d --rm \
    -p 8080:80 \
    -p 8443:443 \
    -v $(pwd)/host/certs:/container/certs \
    -e SSL_CERT_DIR="/container/certs" \
    -v $(pwd)/var/log/rancher/auditlog:/var/log/auditlog \
    -e AUDIT_LEVEL=1 \
    -e CATTLE_TLS_MIN_VERSION="1.2" \
    -v $(pwd)/opt/rancher:/var/lib/rancher \
    --privileged \
    rancher/rancher:latest \
    --no-cacerts
  ```

