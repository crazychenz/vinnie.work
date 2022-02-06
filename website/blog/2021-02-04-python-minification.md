---
slug: 2021-02-04-python-minification
title: "Python Minification"
#date: "2021-02-04T12:00:00.000Z"
description: |
  Python obfuscation and compression?
---

## Overview

When dealing with a lot of javascript, I noticed that there are a fair number of node_module packages that minify and obfuscate their packages. Minification makes sense for javascript you plan to deliver with a webpages and obfuscation makes sense to prevent scanners from easily being able to monkey patch, but I really don't know why this happens before the page is packaged up. In other words, IMHO, all javascript should exist in node_modules as some human readable peice of code (albiet TS/ES7 -> ES5), but human readable none-the-less.

<!--truncate-->

Regardless of the javascript ecosystem, minification and obfuscation isn't really common practice in the Python ecosystem so I took a couple hours to look into methods to accomplish this.

## Manual Minification

### The Naiive Approach

Naturally, the developer can always generate their own minization of code. For example, lets use the following fibonacci code:

```
def fib(term):
   if term <= 1:
       return (term)
   else:
       return (fib(term-1) + fib(term-2))

# Change this value to adjust the number of terms in the sequence.
number_of_terms = 10
for i in range(number_of_terms):
    print(fib(i))
```

Some obvious fixes would be to:

- Only use single byte labels.
- Only use single byte indentation.
- Remove superfluous newlines and spaces.

Manually minimized version may look like:

```
def f(t):
 if t<=1:
  return (t)
 else:
  return (f(t-1)+f(t-2))
n = 10
for i in range(n):
    print(f(i))
```

### What else can we do? Compression?

To compress this peice of code we can use the zlib modules. The thing to know about compression with zlib is that it'll create many unprintable characters. This means that what should be a single byte will become 4 bytes to account for the hex value (i.e `\x00` instead of the single byte it is in memory). We can mitigate this slightly by base64 encoding the binary. This allows us to recover some of that wasted space. Base64 also happens to make the string significantly more portable if control characters could be an issue.

Lets assume we want to compress and encode our code above. We would perform that action with something like:

```
import zlib, base64
print(base64.b64encode(zlib.compress("""
def f(t):
 if t<=1:
  return (t)
 else:
  return (f(t-1)+f(t-2))
n = 10
for i in range(n):
    print(f(i))
""")))
```

This would give us the result of:

```
eJxNjMEKgDAMQ+/9ihw3RHAexX2MYCsFqVLn/9vdzCXhkYR2FkhqeSGooK21RIJze90QnMDnw38W7bHkoducMxkqykRyORRq8M0OTtYPQ7ertZhoND85wR0k
```

That gobblyguuk is the code! Nice. Now all we need to do it write a small loader to make this blob of code execute:

Note: You can put line breaks into the base64 encoded string without breaking things.

```
import zlib, base64
exec(zlib.decompress(base64.b64decode("""eJxNjMEKgDAMQ+/9ihw3RHAexX2MYC
sFqVLn/9vdzCXhkYR2FkhqeSGooK21RIJze90QnMDnw38W7bHkoducMxkqykRyORRq8M0OT
tYPQ7ertZhoND85wR0k""")))
```

After running the code you should get:

```
0
1
1
2
3
5
8
13
21
34
```

## Automated Minification

While doing the minification manually can be fun to try to squeeze out every extra byte, its really a waste of time. If you want to minify python, its more appropriate to use one of the many libraries that'll do it for you. One such library is [pyminifier](https://liftoff.github.io/pyminifier/).

```
pip install pyminifier
```

Dump the original fib sequence in a file (`t.py`) and run the following:

```
pyminifier -O t.py
```

The result is minified (but not as much as our manual attempt):

```
def f(term):
C=range
 if term<=1:
  return(term)
 else:
  return(f(term-1)+f(term-2))
E=10
for i in C(E):
 print(f(i))
```

If you add `--gzip` to the command you get:

```
import zlib, base64
exec(zlib.decompress(base64.b64decode('eJxNjDEKgDAQBPt7xZYGEYxlMJX4EME7OdAoZ/y/ES3slmFmZxaMVWbbXKAh2pQWJqjgQX30gQDjfFl6JQKvJ//oGzfe1d/qnCOJviXZDQpNGCop5zhMUy6+FuEGdQEixw==')))
```

Look familiar? This is the exact same process we used above but now its down with the wave of a command.

## Conclusion

**I don't know of any reasonable use case for this.** It may keep un-experienced prying eyes away, but anybody who knows what they are doing can get to the code very easily. Perhaps if you added some type of encryption you could pass the code around with an out of band key exchange, but ultimately it would have been more simple to just encrypt a wheel or source python package.

Its also worth noting that if you had intended on saving space with the compression, the original code is ~108 bytes while the compressed and encoded version is ~183 bytes. Even without the `import` and `exec` overhead, the base64 encoded string along is ~120 bytes. My guess is that this process may scale better with a larger code sample, but if you intend to just compress and encode small bits of computational functions it'll actually be less space efficient.

```
¯\_(ツ)_/¯
```

## Comments

<iframe src="/comment-iframe.html" height="1024" width="100%" onLoad=""></iframe>
