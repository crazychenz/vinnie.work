---
title: "Yaml Includes, Overlays & Scalability ... oh my!"
date: "2020-11-05T12:00:00.000Z"
description: |
    Language agnostic conventions and python utilities for implementing
    extensible Yaml includes, overlays, and removals.
---

## Overview

As a long term developer, I've been exposed to quite a bit of different configuration and object serialization formats (e.g. LDIF, ASN.1, XML, JSON, YAML, etc). Over the years, I've become quite fond of YAML as my go to serialization and configuration format. This article attempts to skim some comparisons between YAML, JSON, and XML. Following that, I'll discuss some conventions that can be used to blend these three technologies to allow for things like using XPath/XQuery on JSON and breaking up YAML structures into multiple files that can be distributed globally.

## My Perspective On Data Serialization

As is always the case, you need to understand your use case before deciding what technology is a best fit. Above and beyond the use case, you also need to understand the community and level of support available for good business decisions about technology choice.

When choosing between data serialization formats, I like to know answers to questions resembling the following:

- What is the support for this format within the target system?
- Does *this* application need to query the serialized structure for a subset of information?
- Does the data in *this* serialization need to be read by users? (not counting developers troubleshooting code.)
- Does the cost of the storage actually matter?
- Does the performance of the parser actually matter?

Once you can answer these questions, you can pretty mush narrow down which 1 or 2 serialization data formats will be a good choice.

## Background

### The Rise and Fall of XML

When I was in college (circa 2003), the academic community seemed to be pushing that XML was the end-all-be-all of object serialization. XML was first standardized in 1997. It had human readability aspects and powerful management and query technologies behind it (i.e. XPath, XQuery). XSLT is an XML-based transform language that is turing complete (i.e. it can generate any output required of its XML input).

Over time, there have dark sides of XML also exposed. This includes:

- Overly redundant data (compared to other formats and due to SGML based syntax).
- Extreme flexibility that leads undisciplined users into trouble.
- Very complex mechanisms for usage that can raise the bar for novice entry.
- Security concerns with regards to the handling of more advanced features.

### A simple approach with JSON

JSON came onto the scene in the early 2000s as a data serialization format that focused on browser capabilities (i.e. Javascript). In my opinion, JSON was quite an easy shift for anyone familiar with popular associative array syntaxes like those found in Perl, Python, and Javascript. This familiarity and the fact that it rides the syntaxes found in one of the fastest growing languages (i.e. Javascript) may have been the reason it became as popular as it is today.

Although not as true today, as early as 2010, the range of different use cases for JSON were quite limited. There was no schema definition, there was no language agnostic method for queries of subset data and the format is very constrained and unforgiving with *missing* features like trailing commas and any kind of out-of-band comments.

### Finding Balance with YAML

For years now, unless I am dealing with a system that already has a precedence for a particular configuration serialization format, I always will start with YAML and work up or down from their. YAML is, mostly, a subset of JSON. In other words, %99.999 of the time, JSON can be parsed without change by a YAML parser. Additionally, YAML has a lot more features than JSON that allow it to target a larger set of use cases. Wikipedia states that "YAML targets many of the same communications applications as Extensible Markup Language (XML)".

Although YAML is clearly more capable (and often more human readable) than JSON, it often can fall far short of a lot of advanced XML capabilities (e.g. XML Schema, XQuery, XPath). Often this is OK if all you are looking for is a configuration format or simple data serialization format.

## YAML As Configuration

YAML is a machine parsable configuration format that is both powerful in its syntax, tolerant of JSON input, unicode safe, and very human (engineer) readable. But wait, if configuration data is intended to be used by end-users, it should be managed in the way that end users are familiar with managing other types of machine parsable configuration. What I am talking about is *includes*. XML has the ability to include other XML files into its files or streams. YAML, as of 1.2, has no language agnostic method for including other YAML files. There are tons of opinions and workarounds for this on the internet. A convention that I've been working with for years is to use the following syntax (with an enhanced parser). Given:

**other.yaml:**

```yaml
other_struct:
  attr: value2
```

**config.yaml:**

```yaml
---
some_struct:
  attr: value1

!include other.yaml

final_struct:
  attr: value3
```

The way this include works is that the parser will determine if the path is absolute or relative and then open that file for parsing. Once parsed, it drops the resulting data structure into that relative location of the parent structure. This can result in a structure that resembles the following when dumped from the YAML serialization:

```yaml
---
some_struct:
  attr: value1

other_struct:
  attr: value2

final_struct:
  attr: value3
```

In regards to relative paths, the path is deemed relative to the file in which its references. So a file being parsed from `/my/path/file.yaml` referencing `foo/bar/other.yaml` will read the `other.yaml` file from `/my/path/foo/bar/other.yaml`.

### Include Formats

The above mentioned `!include` syntax is fairly common practice and I've seen it used in a lot of python based systems. Its nice because similar to XML, it allows you to include other configurations from other files. **But what if you wanted to include other formats into your Yaml?** How cool would it be to have a YAML parser that allows the YAML to include other YAML files, XML data, JSON data, INI data, and so forth. This is what the parser enhancements I'm using allows. The syntax looks like the following:

```yaml
---
!include:xml other.xml

!include:yaml other.yaml

!include:raw other.bin
```

With YAML as the authoritative format, an `!include` without a format explicitly given is implicitly a `yaml`. The `!include:xml` uses a bunch of other special conventions to represent a good amount of XML in YAML, and the `!include:raw` is a verbatim replacement of any file's contents directly into the YAML structure. These formats can be coded up and dynamically registered into the parser as long as they can be themselves broken down into associative array structures that are provided by the parsing language.

**Note:** Often is the case that what we want is a configuration file that is one-way. What I mean by this is that humans develop a configuration that is read by the application and not the other way around. If applications are going to create configuration, the above mechanism (as-is) isn't as useful because when the machine reads the !includes, it flattens them into a single structure and doesn't save the original formats or content for mutation. Point is, know this is a lossy process that can't regenerate itself after parsing.

### Include Schemes

The idea behind a scheme is to allow an `!include` to include files not just from a locally mounted drive, but also via other locations. Schemes I've used in the past include files (the implicit default), URLs, zip files, tar files, python environments, and so forth. The syntax looks something like:

```yaml
---
!include-file other.yaml

!include-url https://domain.name/path/to/other.yaml

!include-pyenv package.name:path/to/other.yaml
```

This can be combined with the formats to resemble something like:

```yaml
!include-file:bin other.bin

!include-url:xml https://domain.name/path/to/other.yaml

!include-pyenv:yaml package.name:path/to/other.yaml
```

Assuming your parser has the ability to parse objects or files from another format, you can integrate schemes to enable retrieving this data into the parsed data for easy use by an application.

## YAML As Distributed Configuration

### Recursive Merging

A major draw back of using `!include` with YAML is that when including subsequent data structures of the same name, you end up clobbering the previously defined structure. For example, assuming you substituted the content of the `!include` files into a flat YAML, you may find yourself with two associative arrays (named 'dict'):

```yaml
---
dict:
  attr: value
  list: [ item1, item2 ]

dict:
  attr: other_value
```

When parsed and dumped by re-serialization, you'll find that you've completely clobbered the original `dict`:

```yaml
---
dict:
  attr: other_value
```

YAML has a `!!merge` command that can be used to merge a single mapping of values. (In other words, this is not recursive.) Given a set of defaults and then a set of overrides, we can represent the above use case as the following:

```yaml
---
dict: &default
  attr: value
  list: [ item1, item2 ]

dict:
  << : *default
  attr: other_value
```

This is parsed into a single merged `dict` structure that when dumped looks like:

```yaml
---
dict:
  attr: other_value
  list:
  - item1
  - item2
```

This is *OK*, but what if you want to do a recursive merge? Using an enhancement in the parser, I can perform what is defined as a `!recursive_merge` that allows deep recursive merging of YAML files from within the YAML syntax. This recursive merging requires no anchors or references. An explicit design decision is that it also aims to be non-clobbering for arrays and associative arrays so it aims to only add data to a configuration. The only clobbering that occurs is on scalar values that match a given key. Let me show you ...

A simple merge of two `dict` structures (without anchors or references):

```yaml
---
dict:
  attr: value
  list: [ item1, item2 ]

!recursive_merge :
  dict:
    attr: other_value
    list: [ newitem3, newitem4 ]
```

In addition to being able to use the `!recursive_merge` command, there is a short hand expression `<<<` that can be used:

```yaml
---
dict:
  attr: value
  list: [ item1, item2 ]

<<<:
  dict:
    attr: other_value
    list: [ newitem3, newitem4 ]
```

In the above recursive merge, we are asking to have the `dict.attr` scalar overridden and the `dict.list` extended. Both of the previous merges result in:

```yaml
---
dict:
  attr: other_value
  list:
  - item1
  - item2
  - newitem3
  - newitem4
```

Because this is a recursive merge of maps as well, you can merge keys value pairs into the middle of a structure:

```yaml
---
dict:
  first:
    attr1: value1
  middle:
    middle_first:
      deep:
        attr2: value2
    level: value3
  final:
    list: [ item1, item2 ]

<<<:
  dict:
    middle: { middle_first: { another_deep: value here } }
    final: { list: [ newitem3 ] }
```

Above, we're merging `another_deep: value here` into `dict.middle.middle_first` and adding an item to the final list. The result of the above merge looks like:

```yaml
---
dict:
   final:
      list:
      - item1
      - item2
      - newitem3
   first:
      attr1: value1
   middle:
      level: value3
      middle_first:
         another_deep: value here
         deep:
            attr2: value2
```

### Distributed Configuration

So now that we understand recursive merging a little more, lets discuss how we can apply `!include`s and `!recursive_merge`s to enable distributed configurations.

Lets suppose you are working on an application that has multiple teams or components, each with their own set of configurations. Those teams should have the ability to manager their own default configuration options but allow a user to override any given configuration value. This can be accomplished with something like the following:

```yaml
---
<<<: !include team1-baseline-config.yaml

<<<: !include team2-baseline-config.yaml

<<<: !include team3-baseline-config.yaml

config:
  team1_config:
    setting1: user_override
  team3_config:
    setting4: user_override
```

These above configuration allows a user to optionally include baseline configurations for the teams they want to include configurations for and then override on the settings they need to override.

Taking this one step further, perhaps you have different variants of products that reuse configuration across teams. Because includes are recursive as well as merging, you can combine sets of team configurations into various *variant* configurations to create single baseline configurations.

**mobile-baseline-config.yaml:**

```yaml
<<<: !include team1-baseline-config.yaml
<<<: !include team2-baseline-config.yaml
<<<: !include team3-baseline-config.yaml
```

**user-config.yaml:**

```yaml
---
<<<: !include mobile-baseline-config.yaml

config:
  team1_config:
    setting1: user_override
  team3_config:
    setting4: user_override
```

## Conclusion

In conclusion, YAML is a great data serialization format that isn't as constrained as JSON, but not quite as powerful as XML. But, by extending the YAML parser capabilities to provide `!include` and `!recursive_merge` capabilities, we can make YAML scale very well, putting it a league above JSON and a bit closer to XML.

In a later article, I plan to write about transliteration of YAML to XML to enable the use of XPath, XQuery, XSLT, and XML Schema with YAML (and even JSON) data.

## References / Notes

[Yq](https://mikefarah.gitbook.io/yq/)

[!!merge](https://yaml.org/type/merge.html)

[Wikipedia YAML](https://en.wikipedia.org/wiki/YAML)

[Why Constraints Are Good For Innovation](https://hbr.org/2019/11/why-constraints-are-good-for-innovation)

[Explaining XML](https://hbr.org/2000/07/explaining-xml)

[Advantages And Disadvantages of XML](https://beginnersbook.com/2018/10/advantages-and-disadvantages-of-xml/)

[XML is Toast](https://www.cio.com/article/3082084/xml-is-toast-long-live-json.html#:~:text=XML%20has%20been%20rapidly%20falling,1997%20and%20grew%20from%20there)

[ruamel.yaml Source](https://sourceforge.net/p/ruamel-yaml/code/ci/default/tree/)

[PyYaml Docs](https://yaml.readthedocs.io/en/latest/index.html)

[ruamel origin](https://stackoverflow.com/questions/64680719/where-does-the-label-ruamel-come-from-in-regards-to-ruamel-pypi-packages/64682335#64682335)

[PyYaml Basic Use](https://yaml.readthedocs.io/en/latest/basicuse.html)
