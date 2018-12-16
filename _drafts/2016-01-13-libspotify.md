---
layout: post-no-feature
title: "Using libspotify"
description: "Playing music through Extempore using libspotify"
category: articles
tags: [extempore spotify]
---

I'm going to play some music from Spotify's catalogue through extempore (on OSX), specifically replicating the 'jukebox' example program that Spotify distributes with its api code.

First I download the [libspotify framework from Spotify](https://developer.spotify.com/technologies/libspotify/), and get an api key. 

The framework we get contains two important files; the dynamic library `libspotify` and the header file `api.h` describing the functions within the dynamic library. They're a bit squirreled away in the Versions folder, but shouldn't be hard to find. For ease of use I copy these to the folder that I'll be mostly working in.

First we load the dynamic library up in Extempore.

{% highlight scheme %}

    (bind-dylib spotify "libspotify")

{% endhighlight %}

We cannot directly load the header file into Extempore, so we need to make our own bindings from `api.h` for any functions we need. The first thing we need is the session infrastructure, which authenticates us with Spotify and lets us play Britney Spears to our hearts content. 

In `api.h` the sp_session struct is defined as:

{% highlight c %}

    typedef struct sp_session sp_session; ///< Representation of a session

{% endhighlight %}

This struct is only properly defined in the dylib (which we cannot see the plaintext equivalent of), and a result we only ever need to pass around pointers to this magical data structure, and libspotify will know know what it is. Jukebox.c uses it as:

{% highlight c %}

    static sp_session *g_sess;

{% endhighlight %}

and we turn this into Extempore code as:

{% highlight scheme %}

    (bind-val g_sess i8*)

{% endhighlight %}

There is a enum in api.h which defines the various error codes that could be produced, and this is 

{% highlight c %}

	sp_error err;
    
{% endhighlight %}



