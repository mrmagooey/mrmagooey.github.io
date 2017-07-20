---
layout: post-no-feature
title: "Speeding up Container Builds"
description: "Squid Proxy FTW"
category: articles
tags: [docker, containers]
---

I have noticed that that apt calls are very slow in my containers, and so a minor change in an `apt-get` call can result in a container build that takes (metaphorically) forever. Docker already comes with a layer system where each command in a Dockerfile is turned into an immutable 'layer', which can then be reused in later builds to speed up the build process. However, I find that I'm fairly regularly changing Dockerfiles in a manner that invalidates the layer cache, and so I'm always having to wait for slow `apt` calls.

Since apt runs on http, and most of its packages are fairly stable (e.g. are not changing much by the day), we can cache apt requests and responses using a caching http proxy. This means that we can intercept apt http calls using our proxy and respond using the cached package lists and packages. Practically this means that an apt call that previously might have taken a minute to retrieve information from the remote package repository can now retrieve it in seconds from local memory.

[Squid](http://www.squid-cache.org/) is a pretty well known http caching proxy server, which I can say with confidence because it's the only one I know about. I've made a [container out of it](https://github.com/mrmagooey/aggressive-squid-cache) with some pretty aggressive caching options in its configuration. To use this squid container, we first create a custom docker network. This custom network provides us with a bit of isolation from other containers (i.e. other containers cannot reach this squid proxy), and since Docker 1.10 custom networks have had [embedded DNS servers](https://docs.docker.com/engine/userguide/networking/configure-dns/) it also provides us with discoverability via container name. To create the custom network:

    docker network create build-net
    
Then we create our squid cache in this custom network:

    docker run -d --rm --network build-net --name "squid" mrmagooey/aggressive-squid-cache

Then for every container build that we want a http cache for, tell docker to build it in the custom network and set the `http_proxy` environment variable to our squid container name and port (default 3128):

    docker build --network build-net --build-arg http_proxy=http://squid:3128 .

The first build that we route through this proxy will be the same speed as the cache is filled, but every subsequent build will pull all apt information out of this caching proxy and so apt should feel comparatively instantaneous. The table below has some completely unscientific benchmarks taken using this container.

| Benchmark   | Without cache (s) | With cache (s) | Speedup      |
|-------------|-------------------|----------------|--------------|
| apt-update  |               250 |              7 | ~35x faster  |
| apt-install |              1000 |            120 | ~8.3x faster |
| yum-update  |                15 |             10 | ~1.5x faster |
| yum-install |                36 |             30 | ~1.2x faster |
| npm-install |                54 |             49 | ~1.1x faster |
{: .table}

#### The Good

1. Your builds are faster.
1. It doesn't affect the final container image; neither the `http_proxy` environment variable or `--network` flag persist.
1. You don't need to change anything in your Dockerfile.
1. It's easy to refresh the cache contents by killing and restarting its container.
1. It's easy to choose which container builds use the proxy by selectively passing the `--network` and `--build-arg` options.

#### The Bad

1. The cache is set up to be a bad netizen, by ignoring all http conventions (e.g. expires, no-cache).
1. The cache is very aggressive, anything it has cached it will hold onto forever.
1. There is the potential for weird things to happen, if the two previous items conspire to give your container a http response that it wasn't expecting (I have once seen yum get confused).

I currently use this cache system for development/testing, but for production builds I build normally without cache. 

As far as I can tell, all other package management systems (smartly) run over https as they do not have the pre-shared key that apt has. This means that this solution will not improve things like `go get`, `npm`, or `pip`, as these all run over https. If you can force these systems to run over http then you will probably see some improvement in build times, at the cost of security. An example for [forcing npm to run over http](https://github.com/mrmagooey/aggressive-squid-cache/blob/master/benchmarks/npm-install-benchmark) is in the benchmarks folder for this container.
