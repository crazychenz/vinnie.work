---
slug: 2021-04-20-multiline-bash-argument
title: "Why So Hard?: Multi-line bash argument."
#date: "2021-04-20T12:00:00.000Z"
description: |
  When attempting to logically perform bash variable expansion in an expression similar to `'$VAR'` I found myself stumped for longer than I expected attempting to work around this limitation. This is my pitfalls and solutions to this problem.
---

## Overview

In many situations, when writing statements or commands, I want to orient the command so that it presents well vertically. While we write statements and commands for readability we nearly always have to consider the horizontal constraints before the vertical constraints. The only time I hit a vertical constraint is really with run on functions or inline documentation.

<!--truncate-->

Recently I was capturing a number of curl commands that I was using for testing some rest endpoints. While I know I could probably just STDIN/file-load the data, I really wanted a way to express the whole command in documentation such that it could be copy/pasted into a bash command and just work. _No file downloads._

This seemingly simple task had me stumped for about an hour before I came to the following solution:

```sh
DATA=""
DATATYPE="Content-Type: application/json"
for ELEMENT in \
  "'"\
  '{"suite":"token", "case": "refreshToken", "params": ['\
  '"nrJc8JdCt8WTbilkX2v1/KiQXxu+G4UaSrBKnALJhtjDz0DD5MECTYN'\
  'mK2lYG3mprw4UgHVDuBhlJTe3kxgM98W6rOrm5gq/hMqxXc6FPtnNCQp'\
  'H8F7eQ5+JpkpVWMWbjDsxy0xrh3tyc1NFRycMwerkd+4H3nnPi5lYSyL'\
  'iLmzzILyEZzVlglBxnsAzywp8kxJ4ZOJZ/1OlwqR/bieOBMax6+3pLVL'\
  'fp8qW9grZcldL+0Bbv1Nk5gF49+zhxQlnomUp84m/ufONR/YiDmPCIm7'\
  'Bb5K++lhptl6eOJD4mqT9a7Zq8+DigHwKq15G9zcKqF0qGYr/4WA06Ef'\
  '6FvH1IYvJMvWI0oQADUtKHIYhyenlcUS/WVynGM8KR7gtw2MPNmTYYEs'\
  'SLl9DVxJL599UuU3MGHdVA6U5MKkcReO5R+kT0D+JMOAdpCQZvKkCY82'\
  'hftAI5bkZveCtOZupaba4V1OYPVHRJ"]}'\
  "'"; do
  DATA+="${ELEMENT}"
done
eval "$(echo curl -H \"$DATATYPE\" http://localhost:7071/api/functest -d $DATA)"
```

## The Problem

Usually when breaking up a bash command you simply add a continuation slash `\` as the last character in a line. This was not sufficient with the above command because the JSON string was a single argument. My REST calls are typically small in nature so this wasn't really an issue until I shoved a token into a request.

Combined with the length of the command, I also had an issue where I wanted to express the JSON data with double quotes (without escaping every quote!) Although you can use single quotes to solve the immediate issue, the single quotes are immediately evaluated and any dereference of a variable will contain the interpretable spaces and special characters.

## The Solution

From here I was thinking, "I'll just split up the token and concatenate each of the pieces into an environment variable. In python and C these are automatically concatenated, but in bash we must manually concat the string literals via a loop or `echo`. Turns out that since I was attempting to break up a contiguous set of characters that couldn't have spaces added I needed to real string
concatenation. (_Note: The spaces come from the indent I added to the snippet for readability._) Therefore I used a `for` loop that joined each of the string pieces.

To maintain single quotes around our concatenated string, we prefix and suffix the string split with a set of `"'"`s. Finally, we simply echo this string into the `DATA` variable.

Naturally I'm thinking, great! Lets run it!

```sh
$ curl -H "Content-Type: application/json" http://localhost:7071/api/functest -d $DATA
Invalid request.curl: (6) Could not resolve host: "case"
curl: (6) Could not resolve host: "refreshToken",
curl: (6) Could not resolve host: "params"
curl: (3) bad range specification in URL position 2:
```

Bah! It's still striping the single quotes from the string that is dereferenced from \$DATA. Turns out the key to all of this is to use the `eval` keyword. I can verify that the command looks the way I want with an echo:

```sh
echo curl -H \"Content-Type: application/json\" http://localhost:7071/api/functest -d $DATA
```

Then all I need to do is feed the output of that into an eval so it runs the command _as-is_:

```sh
eval $(echo curl -H \"Content-Type: application/json\" http://localhost:7071/api/functest -d $DATA)
```

And then boom, it works.

## Conclusion

While in most situations a STDIN or file load would likely be more appropriate, you can use this method for all-in-one documentation or presentation snippets.

The big takeaway here is that if you find yourself in a situation where you want to do something like `'$VAR'`, try `eval` as a way to get something that works. More generically:

```sh
LITERAL_VAR="literal value"
eval $(echo "'"${LITERAL_VAR}"'")
```

_Caution: This technique is not impervious to command injection so don't consider it safe for end user input. (i.e. only use it for canned commands)._
