---
slug: 2021-11-04-why-so-hard-buildkit-to-local-registry
title: 'Why So Hard?: BuildKit to Local Repository.'
draft: false
---

Went to go build an old dockerfile to look at the state of some files in an installation. I was suddenly getting all kinds of errors ... turns out my machine automatically updated docker where BuildKit is now the default. You can go look up BuildKit and all the wizbang gizmos it comes with. I just wanted to be able to build my legacy `Dockerfile`s the way I always had and now I can't?! **You had one job Docker!**

<!--truncate-->

## BuildKit Outputs

When building with BuildKit, there is no longer an assumption that you want to build an image and import it to the local registry. This was deemed to slow for many use cases. Therefore now buildkit, without being instructed what to do with a build will just keep the finished build in memory as a cached image.

_That all sounds good, how do I make it do what it used to?_ If you take a look in the [bowels of the docker documentation](https://docs.docker.com/engine/reference/commandline/buildx_build/), there is a non-descriptive one liner that mentions:

> Shorthand for `--output=type=docker`. Will automatically load the single-platform build result to `docker images`.

This line is referring to the `--load` option. Now, whenever you want to build a new _local_ image in the local docker registry, you have to add the `--load` option (or use the `--output type=docker` argument).

Example:

```sh
cat Dockerfile | docker build -t myimage ${*} --load -f - .
```

## Improved Security

BuildKit has applied many lessons learned, they haven't just made everything faster, they've also paid close attention to the security of their system. As a result, `--network=host` during a build has been deemed insecure. Therefore, to build with `--network=host` you can to create a buildkit instance. I have no idea what goodness comes with these build contexts, but for now I know to use `--network=host`, you need to do something like:

```sh
docker buildx create --name myimage-builder --buildkitd-flags '--allow-insecure-entitlement network.host'
cat Dockerfile | docker build -t myimage ${*} --load --use myimage-builder -f - .
```

## Conclusion

I applaud docker and its progress, but this lack of legacy user experience is quite aggravating. I was hoping that the docker CLI would remain stable for many years. Alas, like many other products I now have to remain aware of the differences between the docker CLI conventions for the sake of my users.
