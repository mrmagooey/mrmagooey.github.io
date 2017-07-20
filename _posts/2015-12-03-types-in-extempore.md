---
layout: post-no-feature
title: "Types in Extempore"
description: "A brief overview of types in Extempore"
category: articles
tags: [extempore]
---

Beyond the primitives (e.g. integers, floats), [Extempore](https://extemporelang.github.io) also has aggregate types:

- Tuples  `<>`
- Arrays  `||`
- Vectors  `//`

Tuples are great for grouping a bunch of dissimilar things, arrays are great for grouping a bunch of similar things, and vectors are like arrays but a bit less flexible. Tuples and arrays will constitute the bulk of composite types usage.

In using composite types, you could do something like:

{% highlight scheme %}

(bind-func test
  (lambda ()
    (let ((my_composite:<i32,|8,i32|,i8*>* (zalloc)))
      my_composite)))

{% endhighlight %}

Where the type is awkwardly defined in the `let` form of the function, making it difficult to continue using the type across other functions (where you would need to keep writing in the type signature in order to use it). 

To make types easier to re-use across different parts of your code, the `bind-type` expression allows you to define your type in one location.

{% highlight scheme %}
;;         the name     the definition
(bind-type my_composite <i32,|2,i32|,i8*>)

{% endhighlight %}

We now have a `my_composite` type, consisting of a tuple with three elements; a 32 bit  integer, an array that has space for 2, 32 bit integers, and a pointer to an i8.

Let's say that our `my_composite` type is used for accounting at the hypothetical Acme Company. We will say that the first item stores the number of widgets we have ever sold, the second is a list of the red and blue widgets sold, and the third stores the name of our company "Acme Co.". 

The first thing we want to do is to be able to print the contents of our `my_composite` datastructure, so that we can debug things and remind ourselves what the company name is. In order to conveniently print `my_composite` we need to implement a print function.

{% highlight scheme %}

(bind-func print_my_composite:[void,my_composite*]*
  (lambda (my_comp)
    (printf "widgets sold:%d, red widgets:%d, blue widgets:%d, company name:%s" 
            (tref my_comp 0)
            (aref (tref-ptr my_comp 1) 0)
            (aref (tref-ptr my_comp 1) 1)
            (tref my_comp 2))
    void))

(bind-poly print print_my_composite)

{% endhighlight %}

This code has a few things going on.

- We declare the functions type signature after the function name `:[void,my_composite*]*`.
- We call the standard c function `printf`.
- We pass printf the various items within our `my_composite` data type.
- Finally we call `bind-poly` to overload the print function with our custom print function.

If we now create a version of `my_composite`, we should be able to print it.

{% highlight scheme %}

(bind-func test-print
  (lambda ()
    (let ((mc:my_composite* (zalloc)))
      (tset! mc 0 1001)
      (aset! (tref-ptr mc 1) 0 501)
      (aset! (tref-ptr mc 1) 1 500)
      (tset! mc 2 "Acme Co.")
      (println mc)
      void
      )))

{% endhighlight %}

Note that in both functions we are passing a pointer to the array functions `aref` and `aset!`.

Again this function does a few things:

- We are reserving some memory the same size as our `my-composite` type using `zalloc`, and setting the symbol `mc` to point to that memory.
- We are sequentially are `set!`ing some values into our `my-composite` data structure.
- We are printing the mc symbol using `println`, which thanks to the `bind-poly` call earlier knows how to print our `my_composite` type (`println` is just `print` with a newline!).

If we now run `test-print` we can see our type being printed by Extempore like it ain't no thing:

{% highlight scheme %}

(test-print)
; widgets sold:1001, red widgets:501, blue widgets:500, company name:Acme Co.

{% endhighlight %}

Hopefully this gives some insight into Extempore's type system, writing it certainly did.
