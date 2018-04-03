---
layout: post-no-feature
title: "Deploying Openstack"
description: "What a nightmare"
category: articles
tags: [openstack]
---

As of 2018, Openstack is a complete nightmare to deploy, troubleshoot, or use.

## Deployment: FML

* On casual inspection there appears to be great documentation for Openstack. Then the documentation for Openstack Pike starts randomly referring to Openstack Occata (or Mikata, I forget). The installation docs start clashing with the usage docs (the different networking setup between the installation and usage scenarios). The verify steps in installation don't actually verify anything. The url scheme for the documentation is broken (returning 404's) if you try to change Openstack version for a given document. The QA site is filled with useless nonsense.
* The Openstack Pike installation instructions for Ubuntu 17.10 run through how to set up the network interfaces using ifupdown. However, Ubuntu 17.10 doesn't use ifupdown, it uses netplan and this means that the end user is forced to experiment with netplan to get it to approximate ifupdown behaviour. So, I guess no one has actually used the installation instructions that they've written, because Pike is the official version of Openstack for 17.10.
* Probably more of a Ubuntu complaint, but when I downloaded the 17.10 server image it was described as "Openstack Ready" or something similar. I never worked out what this meant, because nothing was pre-installed, and there didn't appear to be any actual integration/installation of Openstack. Yay for advertising.
* The installation instructions are like 100 manual steps for the basic installation. If you mess any of these up, there are no error messages that point out any missing config, just impenetrable Python tracebacks (see next). 

## There is no Admin

There is only developer.

* In Openstack if an error occurs, you don't get an error message, you get a Python traceback, and this is for both the command line interface and for the web interface. This means that it is impossible to understand the source of a problem or what its solution is... unless (I guess) you are an Openstack developer. I can't stress how time consuming this total lack of helpful error messages is for troubleshooting.
* Because Openstack has a decentralised/microservices approach, the component that experiences an error is not necessarily the source of the problem. So even if you somehow manage to debug an error using the traceback, you still won't know what caused the error because that is in another component.
* The logs are totally useless, and there are a lot of logs to check across the controller and the servers. Instances that fail on start don't leave any clue behind as to what the problem is. You can have services that the web interface reports as being down, but the logs don't seem to report anything out of the ordinary. 
* I had a server whose hardware clock was set incorrectly, and when that machine rebooted obviously the operating system clock was then also set incorrectly. This results in cinder refusing to work because it believed it was out of sync with the rest of the Openstack system. Fair enough, except that this is never communicated, anywhere, in any way. If it were not for the Openstack QA website, and a helpful commenter, I would never have solved this problem.

## Windows VM's are a second-rate citizen

Windows images are a pain, because everything Windows is only supported by third parties.

* If you want to create a custom Windows image, you need to download the filesystem drivers from Red Hat. Or the Fedora website I guess. But not from Openstack.org.
* If you want the image to actually boot, you need cloud-init to be installed, which is available from an Italian company, who I guess has an interest in Openstack. None of which inspires confidence in the longevity of the Openstack ecosystem system.

## Usage=difficult

* When uploading to Glance (the image management system) using the "horizon" web interface, the option to upload an OVA image container is offered. However, if you read the documentation, Openstack "does not currently have support for OVF packages", so god knows what the web interface is doing because if you try to upload an OVA...
* I would get errors where the web interface would awkwardly render a webpage in-place of an error message, i.e. there were html tags in the error response. Not really something you would expect to see in version 17 of some software that is 7 years old.
* Following the official instructions, I could never get a homegrown image to work and the lack of proper logs meant that I have no idea why that was. Ignorance really is bliss.

## Summary

It really feels like the open source version of Openstack is only available to reassure FOSS-minded CTO's that their vendor driven Openstack distribution really is "Open Source", because nothing in the vanilla Openstack seems like anyone bar the foolish has tried to install it in anger. From comments gathered on the web it seems like the vendor distributions do actually work, but I wouldn't wish the opensource version on anyone.



