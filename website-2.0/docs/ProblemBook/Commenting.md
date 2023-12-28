docker pull angristan/isso

https://hub.docker.com/r/angristan/isso
https://github.com/angristan/docker-isso

docker run -d --rm --name isso \
  --network host \
  -v $(pwd)/database:/isso/database \
  -v $(pwd)/config:/isso/config \
  -e UID=$(id -u) \
  -e GID=$(id -g) \
  angristan/isso

# -v $(pwd)/isso:/usr/lib/python2.7/site-packages/isso

```python
@classmethod                 
    def verify(cls, comment):              
                                           
        if "captcha" not in comment or comment["captcha"] != int(4):
            return False, "Captcha failed." 
```


  
  -e STORE_BOLT_PATH \
  -e BACKUP_PATH \
  -e DEBUG=true \
  -e AUTH_GOOGLE_CID \
  -e AUTH_GOOGLE_CSEC \
  -e AUTH_GITHUB_CID \
  -e AUTH_GITHUB_CSEC \
  -e AUTH_FACEBOOK_CID \
  -e AUTH_FACEBOOK_CSEC \
  -e AUTH_DISQUS_CID \
  -e AUTH_DISQUS_CSEC \

https://remark42.com/docs/configuration/parameters/
-e AUTH_DEV=true \
-e AUTH_EMAIL_ENABLE=true \
-e ADMIN_SHARED_ID=anonymous_11f0f3c8d89b125f8caaec40c0b9b10b17231dfb \

docker run --rm -d --name remark42 \
  -e DEBUG=true \
  -e SECRET=gofish \
  -e ADMIN_PASSWD=gofish \
  -e REMARK_URL=http://164.90.208.14:8080 \
  -e SITE_ID=vinnie.work \
  -e SITE=vinnie.work \  
  -e AUTH_ANON=true \
  --network host \
  -v $(pwd)/remark42:/srv/var \
  umputun/remark42

  -e REMARK_URL=https://comments.vinnie.work/comments \
  -v /remark42:/srv/var \

Droplet:

```text
apt-get update
apt-get install docker.io net-tools

apt-get install python3-pip nginx
pip3 install certbot certbot-nginx docker-compose
certbot --nginx certonly
openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048

docker pull umputun/remark42
docker run --rm -d --name remark42 \
  -e DEBUG=true \
  -e SECRET=gofish \
  -e ADMIN_PASSWD=gofish \
  -e ADMIN_SHARED_ID=anonymous_11f0f3c8d89b125f8caaec40c0b9b10b17231 \
  -e REMARK_URL=http://comments.vinnie.work/comments \
  -e SITE_ID=vinnie.work \
  -e SITE=vinnie.work \
  -e AUTH_ANON=true \
  -p 8080:8080 \
  -v /tmp:/srv/var \
  umputun/remark42
```

https://gist.github.com/pedrouid/4abcc16c0218a46a577cfa8186cb845d
```text
# cat /etc/nginx/snippets/ssl-params.conf
ssl_protocols TLSv1.3 TLSv1.2 TLSv1.1 TLSv1;
ssl_prefer_server_ciphers on;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
ssl_ecdh_curve secp384r1; # Requires nginx >= 1.1.0
ssl_session_timeout  10m;
ssl_session_cache shared:SSL:10m;
ssl_session_tickets off; # Requires nginx >= 1.5.9
ssl_stapling on; # Requires nginx >= 1.3.7
ssl_stapling_verify on; # Requires nginx => 1.3.7
resolver 9.9.9.9 8.8.8.8 valid=300s;
resolver_timeout 5s;
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
add_header X-Frame-Options DENY;
add_header X-Content-Type-Options nosniff;
add_header X-XSS-Protection "1; mode=block";

# Paste this at the bottom of the file
ssl_dhparam /etc/ssl/certs/dhparam.pem;
```

```text
# cat /etc/nginx/sites-enabled/default
server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name comments.vinnie.work

  ssl_certificate /etc/letsencrypt/live/comments.vinnie.work/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/comments.vinnie.work/privkey.pem;

  include snippets/ssl-params.conf;

  location / {
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-NginX-Proxy true;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_pass http://localhost:8080/;
    proxy_ssl_session_reuse off;
    proxy_set_header Host $http_host;
    proxy_pass_header Server;
    proxy_cache_bypass $http_upgrade;
    proxy_redirect off;
  }
}
```


Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/comments.vinnie.work/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/comments.vinnie.work/privkey.pem
This certificate expires on 2022-05-06.
These files will be updated when the certificate renews.

NEXT STEPS:
- The certificate will need to be renewed before it expires. Certbot can automatically renew the certificate in the background, but you may need to take steps to enable that functionality. See https://certbot.org/renewal-setup for instructions.