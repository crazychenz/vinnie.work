./start

http://IP:8081

Get admin password

```
/projects/stable/dockerfiles/services/nexus3$ docker ps
CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS               NAMES
a5be0799296e        sonatype/nexus3     "sh -c ${SONATYPE_DI…"   3 minutes ago       Up 3 minutes                            nexus3_nexus3_1
ab2e083fae4d        postgres            "docker-entrypoint.s…"   6 weeks ago         Up 9 minutes                            sayokdb
chenz@desktop-ubuntu-vm (main) 2021-05-29-18:05:46
/projects/stable/dockerfiles/services/nexus3$ docker exec -ti a5 cat /nexus-data/admin.password
b5fc2507-3aee-4656-b04a-493ce261c40fchenz@desktop-ubuntu-vm (main) 2021-05-29-18:06:18
/projects/stable/dockerfiles/services/nexus3$ docker exec -ti a5 cat /nexus-data/admin.password ; echo
b5fc2507-3aee-4656-b04a-493ce261c40f
```



Sign In

admin / b5fc2507-3aee-4656-b04a-493ce261c40f

Server Admin (gear in top bar)

Remove all nuget/maven repos.

Create `js` blob:

* Type: File

* Name: js

Create NPM repo:

* Type: npm (proxied)

* Name: npm

* Remote Storage: https://registry.npmjs.org

* Blob Store: js

* Accept

Create APT repo:

* Type: apt- (proxy)
* Name: ubuntu-20.04
* Distribution: focal
* Remote Storage: http://archive.ubuntu.com/ubuntu
* Blob Store: apt
* Save

Create PyPi repo:

* Type: py (proxy)
* Name: pypi-official
* Remote Storage: https://pypi.org
* Blob: py
* Save It

Create yarn repo:

* Type: yarn (proxy)
* Name: yarn
* Remote Storage: https://registry.yarnpkg.com
* Blob Store: js

In /nexus-data/etc/nexus.properties, set:

* `application-port=3081`

* `application-host=127.0.0.1`

