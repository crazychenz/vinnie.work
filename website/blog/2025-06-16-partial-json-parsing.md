---
slug: 2025-06-16-partial-json-parsing
title: "Partial JSON Parsing"
draft: false
---

## Overview

I had a need to parse only the beginning preview of a set of large JSON files (e.g. safetensors). I wanted the ability to parse this JSON, to:

1. Know that everything up to the cut off was valid JSON.
2. Be able to process the JSON for beautification or header processing.

Alas, most json libraries do want the whole JSON. After a bit of work, I was able to get it going with ijson.

<!-- truncate -->

## Partial Parsing

Initially I thought this was a pretty trivial task so I naturally attempted to delegate it to an LLM. Now, I'm very used to LLMs being horrible with the details, but I usually can coerce it into something worth a copy/paste and then debug the descrepencies due to its utter inability to be consistent or compliant. But with this particular task, I was having trouble getting close. Once I did get it close, it created some really crappy code that I couldn't see the intention or spirit of. Of course it didn't work. Note: This was via both ChatGPT and Claude.ai.

Ok, our little green LLM failed us, lets get this done:

```python
import ijson

def parse_partial(data):
  current = None
  stack = []
  key_reg = None

  try:
    for _, event, value in ijson.parse(data):
      if event == 'map_key':
        key_reg = value
      elif event == 'start_map':
        # Save current and start new object
        stack.append(current)
        if key_reg:
          # create key associated object
          current[key_reg] = {}
          current = current[key_reg]
          key_reg = None
        elif isinstance(current, list):
          # create object as list item
          current.append({})
          current = current[-1]
        else:
          # create initial json object
          current = {}
      elif event == 'start_array':
        stack.append(current)
        if key_reg:
          # create key associated list
          current[key_reg] = []
          current = current[key_reg]
          key_reg = None
        elif isinstance(current, list):
          # create list as list item
          current.append([])
          current = current[-1]
        else:
          # create initial json list
          current = []
      elif event in ('string', 'bool', 'number', 'null'):
        if key_reg:
          # create key/value pair in object
          current[key_reg] = value
          key_reg = None
        elif isinstance(current, list):
          # append value to list
          current.append(value)
      elif event == 'end_array':
        if len(stack) > 1:
          current = stack.pop()
      elif event == 'end_map':
        if len(stack) > 1:
          current = stack.pop()
  except ijson.common.IncompleteJSONError:
    pass

  if len(stack) >= 2:
    return stack[1]
  return current

# Tests
print(parse_partial(b'{"key":"value","another":["array", 2, 3],"bob":{"asdf":{"qwer":{"rtyu":{'))
print(parse_partial(b'[{"key":"value"}, 3, 4, [54, {"bob":{"asdf":{"qwer":{"rtyu":{'))
print(parse_partial(b'{"key":"value"}'))
```

The code uses a stack of references. Each time there is a new map/object or array/list, the current reference is pushed onto the stack and a new subreference is created, depending on the required object type. Once we start hitting the end_array and end_map events, we unwind the stack.

Because this is intended to handle the partial JSON case, we pass on any IncompleteJSONError exceptions. In the case of an incomplete exception, we only need to grab the 2nd element from the stack for our result. Otherwise, the result should be stored in the current reference. Note: None is always the first reference in the stack because I wanted to be able to handle a JSON array or object and I didn't want all the extra logic to handle the initialization of that. So instead we simple set the initial reference to None and lets the machine whirl.

I'm sure there are other tests that can be run on this, but this seems to be working rather well. My only conern is the memory overhead in python. My assumption is that when I create and push a reference onto the stack, it isn't doing any deep copys or anything (even though a print misleads you to believe there are a bunch of copies). I really don't care enough at the moment to verify, but it is a concern for larger or deeper datasets.

## Comments

<Comments />



