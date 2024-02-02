From console:

- Install alpine-virt-3.17.0-x86_64 in VM (4GB-mem,64GB-disk)
  - setup-alpine (w/ OpenSSH)
  - **_ REBOOT _**
- Install curl, iproute2
- Install K3s
  - curl -sfL https://get.k3s.io | sh -

paas.vinnie.work

From console:

- Install alpine-virt-3.17.0-x86_64 in VM (4GB-mem,64GB-disk)
  - setup-alpine (w/ OpenSSH)
  - **_ REBOOT _**
- Uncomment all repos in /etc/apk/repositories (except testing)
  - apk add -U sudo iproute2
  - Add wheel group to /etc/sudoers
  - sed -i '/^wheel:/ s/$/,chenz/' /etc/group
  - May need to manually set user password (as root) here as well.

Install infrastructure utils

- apk add -U tailscale docker openrc docker-compose bash tmux curl

Setup Tailscale

- rc-update add tailscale
- /etc/init.d/tailscale start
- tailscale up
- Login via another device.
- You can optionally setup HTTPS now if you want.

Setup Docker

- rc-update add docker
- \*\* Add user to docker group
- service docker start

Install Coolify

- wget -q https://get.coollabs.io/coolify/install.sh -O install.sh
- Modify file to use `service docker restart ; sleep 2` instead of `systemctl`.
- sudo bash ./install.sh

---

cd ~/coolify/install

sudo docker run -tid --env-file $COOLIFY_CONF_FOUND -v /var/run/docker.sock:/var/run/docker.sock -v coolify-db-sqlite coollabsio/coolify:$VERSION /bin/sh -c "env | grep COOLIFY > .env && docker compose up -d --force-recreate" > /dev/null

---

Install nginx

- rc-update add nginx
- Add `need tailscale` to /etc/runlevels/default/nginx
- Have nginx sleep for 2 seconds to give tailscale time to get IP
  Install LetsEncrypt
- sudo apk add certbot py3-pip
- sudo su -> pip3 install certbot-dns-digitalocean
- Get Token from DigitalOcean / API and put it in certbot-creds.ini
- certbot certonly --dns-digitalocean --dns-digitalocean-credentials ~/certbot-creds.ini -d words.vinnie.work --agree-tos -m vinnie@vinnie.work -n
- Create monthly cron:
  #!/bin/sh
  certbot certonly --dns-digitalocean --dns-digitalocean-credentials /root/certbot-creds.ini -d words.vinnie.work --agree-tos -m vinnie@vinnie.work -n
  chmod 640 /etc/letsencrypt/live/words.vinnie.work/privkey.pem
  chown root:nginx /etc/letsencrypt/live/words.vinnie.work/\*
  /etc/init.d/nginx restart

https://www.openfaas.com/
https://tsuru.io/
https://caprover.com/docs/get-started.html
https://www.baeldung.com/ops/docker-push-image-self-hosted-registry
[registry host]:[registry port]/[repository name]:[tag name]
localhost:5000/my-fancy-app:1.0.0

http://100.92.172.79:6875/books/my-first-book/page/second-page
admin@admin.com
password

docker run --rm -it -w /app/www --entrypoint rake lscr.io/linuxserver/mastodon secret
SECRET_KEY_BASE=88c665c7b292aec89e34be804c515b7d61b39450657d5ab8e3bc7606c7c817907355fd3c4caf3a0ad5d9d07d14d5b19c8423b507f199e8071c87e7bc77d5d008
OTP_SECRET=b4f6c0ca62f1cbf55cc5817d4244497b224f84c6f48bb13ca467f41624b8d50362f4cc52ebf8e8762ae0e52a89f381fd447e8ea3d83205c2c4733ad767907768

docker run --rm -it -w /app/www --entrypoint rake lscr.io/linuxserver/mastodon mastodon:webpush:generate_vapid_key
VAPID_PRIVATE_KEY=fnf7Y7RfM2FzHjuH2tsEPAgdRm0-yJtzkApLzgGgTqk=
VAPID_PUBLIC_KEY=BEV7UYdqEI5ORWFtWeszS4l2lSaVkJNDu4joa\_\_BGudGWvcKGW-hYnEFW1I4zXlpwNdim1PLdj5lgzcqvC_mXw0=

rc-update add tailscale default
