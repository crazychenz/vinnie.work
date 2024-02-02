---
sidebar_position: 10
title: Downloading Urls
---

## Curl

While curl is the best tool for performing HTTP requests, it can't perform any HTML processing. Therefore it isn't suitable for downloading a page and its assets independently.

In a shell script you could opt to hack something together like:

```sh
ASSETS=$(curl -s https://www.vinnie.work/ |
  grep href |
  sed 's/.*href="//' |
  sed 's/".*//' |
  grep '^[a-zA-Z].*')

for file in $ASSETS; do
  curl -s -O https://www.vinnie.work/$file
done
```

**Note:** The above is not recursive and isn't smart enough to distinguish between local URL and remote URL.

## Wget

Wget has some minor HTML processing capability. Its no browser, but it has the ability to download `href`'s that are found in `img` and `link` tags.

The easiest way to download a single URL (with assets mirrored) with wget visibility:

```sh
wget --no-certificate-check -mEp https://www.vinnie.work/
```

For more functionality, I advise knowing about:

- `--convert-links` - Make links suitable for local viewing. I don't use this because I typically want everything verbatim for proper _forensic_ troubleshooting.
- `--span-hosts` - This allows wget to hop from host to host.
- `--domains` - This limits the hoping to prevent it from running away to some untrusted site.

`man wget` for more information.

## Resources

- [Github Gist: Download an entire website with wget, along with assets.](https://gist.github.com/mikecrittenden/fe02c59fed1aeebd0a9697cf7e9f5c0c)
