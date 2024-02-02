```sh
gitacp() {
  if [ "$1" == "-m" ]; then
    shift ; message=$1 ; shift
  fi
  [ $# -gt 0 ] && git add $@
  git commit -m "${message}" && git push
}
```