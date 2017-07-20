---
layout: post-no-feature
title: "Reducing Container Size"
description: "A few tips"
category: articles
tags: [docker, containers]
---

Size of container images is a temptingly easy metric to measure, but it also has significant ramifications for both the developer of the container and the end-users of it. A smaller container will be downloaded faster, and consume less resources on the host both whilst running as a container and whilst being stored as an image. For example, if your container is run on 1000 different hosts, every megabyte you shave off the container image is 1GB that didn't need to be sent over a network, or stored somewhere.

The following are some tips for reducing the size of containers.

### /usr/share

If you use ubuntu as the base for your containers, every container you have built has also included:

* */usr/share/man* man pages you will never read. 5.8MB
* */usr/share/docs* docs you you will never read. 3.6MB
* */usr/locale/* locales that you will probably never need. 8.9MB

Totalling 18.3MB of information that your container can probably do without. Given that the whole image is 119MB (ubuntu:16.04), removing these three directories is ~15% space saving on that image, without losing much of value. The locale removal is probably the diciest change, but I haven't had any issues so far.

To have these changes made to your container, add the following somewhere (e.g. a RUN command or shell script):

{% highlight bash %}

# disable apt installing locales other than en
echo "path-exclude=/usr/share/locale/*" >> /etc/dpkg/dpkg.cfg.d/01_nodoc
echo "path-include=/usr/share/locale/en" >> /etc/dpkg/dpkg.cfg.d/01_nodoc

# overwrite the supported locales with just us english
mkdir -p /var/lib/locales/supported.d/
echo "en_US.UTF-8 UTF-8" > /var/lib/locales/supported.d/en

# Drop all manuals
echo "path-exclude=/usr/share/man/*" >> /etc/dpkg/dpkg.cfg.d/01_nodoc

# Drop all docs, except copyright
echo "path-exclude=/usr/share/doc/*" >> /etc/dpkg/dpkg.cfg.d/01_nodoc
echo "path-include=/usr/share/doc/*/copyright" >> /etc/dpkg/dpkg.cfg.d/01_nodoc
echo "path-exclude=/usr/share/lintian/*" >> /etc/dpkg/dpkg.cfg.d/01_nodoc
echo "path-exclude=/usr/share/linda/*" >> /etc/dpkg/dpkg.cfg.d/01_nodoc

# delete everything, apt will re-install based on the dpkg rules we have above
rm -rf /usr/share/doc
rm -rf /usr/share/man
rm -rf /usr/share/locale 

{% endhighlight %}

You will see apt packages complaining about not having things in /usr/share but they seem to install just fine.

A bunch of these are taken from [the ubuntu wiki](https://wiki.ubuntu.com/ReducingDiskFootprint).

### Apt-get

Many packages have "recommended" dependencies, without which they work fine, but don't have as much functionality. Telling apt not to install these recommended dependencies ensures that your container isn't filled with well meaning but purposeless packages.

So instead of just doing:

    apt-get install -y <packages>
    
Change your command to be:

    apt-get install -y --no-install-recommmends <packages>

You can also safely save some space by removing the package list information from your container when you are finished installing packages (and any temp files).

    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

This will delete all the information retrieved by `apt-get update`.

### DIY Base Container

Building your own container base from scratch is now much easier than what it once, and so you can make do without using something like https://github.com/phusion/baseimage-docker (from which I'm taking a bunch of these tikps), which will generally mean a smaller image.

#### Init Process

Docker now has an init system [tini](https://github.com/krallin/tini) that it will inject into your container if you ask it nicely (add the `--init` flag to `docker run`), taking care of the Zombie Process Problem™. You can also build your container with this init process baked in , so that your end user can never forget to run init. This will ensure correct handling of signals and reaping zombies, whilst only weighing in at 20kB. However, tini is not responsible for starting/restarting processes for which you need a service supervision.

#### Service supervision

If you want to run multiple processes in your container, you generally will want something to ensure that these processes start, and are restarted if they die, i.e. service supervision.

Part of the `runit` system is `runsvdir` daemon, which when pointed at a directory containing run scripts, will watch and run these scripts, restarting them if they die. Using `runsvdir` is the approach that `baseimage-docker` takes.

However, if your container is only expected to ever have a single running process, then a service supervision system is totally unnecessary.

### Misc tips

1. Don't build your application in the same container that will eventually run it. Build separately, then copy the binary to the container. For compiled applications, this will ensure that your final container doesn't have build artifacts, compilers, libraries that it doesn't necessarily need.
1. If you can avoid using languages that require an interpreter/vm/runtime to execute then you can save a bunch of space in your container. Just installing python generally adds 30MB to a system, and that is before any user code and dependencies are added.
1. If you have a compiled application that you bundle with a container image, run [Ultimate Packer for eXecutables (UPX)] (https://github.com/upx/upx) across the binary to compress it before adding it to the image.

