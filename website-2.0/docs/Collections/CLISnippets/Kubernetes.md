# Kubernetes CLI Snippets

## Fetching A Pod Name

Deployment pod names are a pain in the butt. Use a metadata label to find the pod name and then use shell aliasing to re-use the pod naming command within other commands.

Given a pod with a `app=userdb` as a selector:

```sh
# Run alias once (load into .bashrc or equivalent for your shell).
alias pod_name="kubectl get pod -o jsonpath='{.items[0].metadata.name}' -l "

# Test the pod_name alias.
pod_name 'app=userdb'

# Use the pod_name alias to consistently run commands or interact.
kubectl exec -ti $(pod_name 'app=userdb') -- bash
```

Setup a `kapp_exec` function to exec into pods by app=_label_:

```sh
pod_name() { kubectl get pod -o jsonpath='{.items[0].metadata.name}' -l $1 ; }
kapp_exec() { label=$1 ; shift ; kubectl exec -ti $(pod_name "$label") -- $@ ; }
```