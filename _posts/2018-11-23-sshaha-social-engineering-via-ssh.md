---
layout: post-no-feature
title: "SSHaha: social engineering via SSH"
description: "A Proof-of-Concept for deception in the shell"
category: articles
tags: [cybersecurity, social engineering]
---

## Introduction

[SSHaha is a malicious proof-of-concept SSH server](https://github.com/mrmagooey/sshaha) that attempts to deceive a connecting user in order to gain that user's secrets. It has one strategy for getting the user's secrets; tricking the user into believing that they are still providing commands to their local machine whilst in fact being connected to the remote machine.

SSHaha has two main methods for tricking the user: pretending the SSH connection was never successfully made, and pretending the connection has ended. The first method is the simplest; the server merely starts sending familiar authentication prompts to the user and hopes the user will not recognise a connection has already been made. The second method is more complicated, and requires some emulation of the user's home shell environment. Chained together, this attack is potentially a good method of pulling several secrets out of the user.

## SSHaha in Action

When connecting to an SSHaha instance, what the victim sees is an unsuccessful connection attempt combined with their local machine being weird (nb sometimes the below svg animations seem to get 'stuck' and reloading the page is the solution):

<img src="{{site.baseurl}}/images/sshaha/victim-vision.svg">

What is actually happening is that the connection was successful, and everything after the user confirming "yes" to connect was SSHaha emulating first a SSH authentication routine, then pretending to reject the connection and finally emulating a terminal session. Whilst all of this is happening, SSHaha is logging the user's keystrokes and recording any secrets that they enter. The SSH session only actually finishes after the user has finished providing SSHaha with sudo credentials (at the end of the animation), before then any SIGINT signals are ignored.

The below terminal animation is what the malicious server will be recording whilst the user is connected to SSHaha.

<img src="{{site.baseurl}}/images/sshaha/sshaha-vision.svg">

## Discussion

This attack will push an unwary user to potentially give up at least two passwords, if not more in trying to work out why none of their passwords are being accepted. The first deception is pretending that no connection was ever made, and that the SSH server is still demanding a password for authentication. Once all connection attempts have failed, SSHaha pretends that the connection has been dropped and kicks the user back to what it guesses will most accurately emulate the user's shell environment.

I have cheated here because I only need to emulate my own terminal environment, but these can vary wildly across users based on what their preferences are. However, there are also a number of widely used defaults and the attacker might safely emulate one of these defaults in presenting a shell environment to the user. It is not outside the realm of possibility that an attacker manages to learn that a user or organisation has a particular OS and hardware choice, and so can guess accurately the prompt will look something like:

    username@ubuntu-thinkpad-480 /tmp/ $ 

This local environment then pretends there is some issue with the permissions for the user, forcing them to eventually try to escalate permissions using sudo. Once SSHaha has allowed a few sudo attempts it becomes unresponsive. Finally for the user, that block of grey text is SSHaha setting the terminal colors to be black font on black background, hiding the final legitimate ssh disconnection text.

In summary, this attack exploits a couple of key assumptions made by the user:

1. That SSH can only be used for starting remote shell sessions (e.g. bash, zsh);
1. That an SSH connection can only be completed with the correct authentication secret, either a password or identity key file;
1. That a Control-C or Control-D key combination will kill a program and return the user to their shell; and
1. That a remote machine has limited control over the user's local shell appearance.

Those that are quite familiar with SSH and terminals will recognise the above to be untrue. For the first point, SSH is merely a transport protocol, and literally any program can have its interface provided across the network via an SSH connection. Shells just happen to be the most useful programs connected to the network, and hence this accounts for 99% of usage. Secure Copy (SCP) is the perfect example of this.

Secondly, because an SSH server is generally returning a local shell, it has traditionally made sense that access to this shell is controlled via some sort of authentication mechanism (again, passwords or keys). However, this is a decision that the server makes, and it can otherwise accept any SSH connection regardless of what key or password it is, or is not, presented with. This means a user can provide a key to a remote server, and the server will appear to accept this key because a connection will be successfully made. However, in reality it doesn't care what key it is shown, or if one is shown at all.

Thirdly, a program can choose what it does with the SIGINT signal or EOF character, and your client SSH program chooses to send them to the server. Again, because the primary usage of SSH has been for remote shells, it has made sense and been very useful to send these characters over the connection. However, it does mean that the remote server then decides what it wants to do with these inputs, and not the local client machine.

Finally, through usage of the ANSI terminal control codes, a remote server can change how any further text (until the terminal is reset) will be shown to the user. This means that if, for example, a remote program changes the background color to black, and the text color to black, all further output will be invisible to the end user.

## Impact and Mitigations

The impact is that this attack will extract secrets out of an unwary user. However, getting the attack to happen requires a significant number of pre-conditions:

* Getting the SSHaha server to a server that the user will connect to;
* The user ignoring the SSH client complaining that it can't verify the identity of SSHaha;
* If the user normally uses a keyfile, then the server demanding one will raise suspicion; and
* The odd behaviour of their local shell, including: refusing to run any command, potentially being in the wrong directory, odd sudo behaviour,and  wrong prompt.

A wary user is unlikely to be taken in by this attack, and once the attack is complete is likely to realise that something strange has occurred. 

## Further Work

There are more deceptions available to run in this kind of attack:

* Pretend the users local keyring (e.g. gnome-keyring ) containing their SSH key is still locked, and provide prompt for this keyring;
* Pretend the user's keyfile is locked; or
* Rather than rejecting the users password, appear to accept the connection and pretend to be an unresponsive remote connection.

A newer example of this kind of deception is part of the [new SCP vulnerability (CVE-2019-6110)](https://sintonen.fi/advisories/scp-client-multiple-vulnerabilities.txt), where stderr is manipulated by the malicious SCP server to hide files being transferred.

[Cowrie](https://github.com/cowrie/cowrie) is also a good reference for an SSH server being deceptive.

