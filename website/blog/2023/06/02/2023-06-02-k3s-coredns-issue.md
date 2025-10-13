---
slug: 2023-06-02-k3s-coredns-issue
title: 'K3S CoreDNS Issue'
draft: false
---

## Overview

Recently resolved a long standing issue with my `k3s` implementation that was causing many DNS issues within my setup whenever the system restarted (usually due to automatically nightly patching). It was all due to the way that `k3s` _cleverly_ injects "host names" into the K8s controller node's `coredns` service. This could be nice if it wasn't a namespace conflict where it was injecting `k8s` and `k8s.vinnie.work`.

<!-- truncate -->

## Background

My current (single node) `k3s` implementation runs within a VM that is running a version of Alpine OS. When I originally setup the OS, I absent mindedly plugged in the FQDN (`k8s.vinnie.work`) as the hostname. This in turn also caused the k3s node name to become the FQDN. Some things were working OK, but others were experiencing some odd behavior. I realized that this was due to the DNS configuration. For example, `k8s` would resolve to `k8s.mshome.net` as well as `k8s.vinnie.work` would resolve to `k8s.vinnie.work.mshome.net`, but there was no way for me to get to `k8s.vinnie.work`. Bah!

## Troubleshooting (Over Several Sessions)

At this point I fixed the hostname issue and restarted my `k3s` implementation to accept the changes. This fixed everything for k8s DNS lookups, but anything that was directly going to `k8s.vinnie.work` was still not working. After some troubleshooting I took a peek at `kubectl edit configmap coredns -n kube-system -o yaml`.

Turns out, this configmap has a `NodeHosts` file that defines some statically assigned IP addresses. These addresses are formatted similar to the `/etc/hosts` file. When I noticed that one of the IPs in the configmap were no longer valid, I simply updated/saved the configmap and restarted the system for everything to take effect.

To my surprise, k3s was dynamically adding the values into the configmap everytime the system started. But it was using an IP that didn't exist and one I could find no reference to anywhere. I even scoured the `/var/lib/rancher/k3s/server/db/state.db` SQLite3 database file directly. Using queries like:

- `select name from kine where instr(value, '172.29.21.88') > 0 and name not like '%argo%';`
- `sqlite3 state.db 'select hex(value) from kine where name="/registry/configmaps/kube-system/coredns";' | xxd -r -p`

Within the state database, there were references to the *bad* IP, but nothing was actually active!

After many hours of looking for references to the IP, checking online forms, and asking ChatGPT for help, I finally decided to take a look at the `k3s` source. The code that is doing the automatic injection of the `NodeHosts` entries is updateCoreDNSConfigMap() @ [`pkg/node/controller.go`](https://github.com/k3s-io/k3s/blob/fa0dc5900a3b0e0e1314451674c72492b7f77382/pkg/node/controller.go#L75)

The signature for this function was:

```go
func (h *handler) updateCoreDNSConfigMap(nodeName, nodeAddress string, removed bool) error {}
```

I noticed the **node**Name and **node**Address parameters and realized I was probably missing a key aspect of the k3s NodeHosts creation. **It was injecting the _names_ of the nodes!** Duh! To verify, a quick `kubectl get nodes` showed that I had two nodes:

```
$ kubectl get nodes
NAME              STATUS     ROLES                  AGE   VERSION
k8s.vinnie.work   NotReady   control-plane,master   40d   vX.XX.X+k3s1
k8s               Ready      control-plane,master   18d   vX.XX.X+k3s1
```

Apparently, at some point in my troubleshooting a new node was created and I never removed the old node. K3s was simply adding in the old IP and old node name into CoreDNS as an entry. Once I deleted this old "NotReady" node, k3s (thankfully) stopped injecting the entry into my CoreDNS configmap's NodeHosts entry.

In hindsight, the meaning of the literal filename `NodeHosts` is now kind of obvious.

## Other Interesting Take Aways

**Manually Adjusting DNS Settings Live**

Before getting to the actual solution I needed the system to actually work so I was required to manually update the coredns configmap after each restart and manually "rollout restart" the core DNS:

- `kubectl edit configmap coredns -n kube-system -o yaml`
- `kubectl -n kube-system rollout restart deploy coredns`

This would intern leave a bunch of pods in a `Terminating` state indefinitely. Due to the non-production nature of my cluster, I used the following to clean up the Pods:

- `kubectl delete pod --grace-period=0 --force -n argocd <pod name>`

**Investigating K3s SQLite State**

Some misc SQLite commands used:

```
sqlite /var/lib/rancher/k3s/server/db/state.db
.tables
pragma table_info(kine);
select distinct name from kine;
select name from kine where instr(value, '172.29.21.88') > 0;
```

Note: When selecting data from the `kine` table, you'll often find that the `value` BLOB field will not display in the `sqlite` client as anything other than the string `k8s`. I believe this is due to null bytes in the BLOB. To work around this, I displayed the value as hex and then used `xxd` to decode the hex back to utf-8 on the command line. The following is an example of this with the coredns configmap.

- `$ sqlite3 state.db 'select hex(value) from kine where name="/registry/configmaps/kube-system/coredns";' | xxd -r -p`

Interestingly, when you modify the configmap from `kubectl`, it'll keep a log of all previous changes that you can see in the sqlite database. For example, if you stored a password in a configmap and then removed it for security purposes, it would likely still exist in plain sight in the `state.db` file. I'm curious if this is the same behavior for a Secret, but I haven't investigated this idea yet.

## Comments

<Comments />
