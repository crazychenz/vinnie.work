---
title: Pathway
draft: True
---

:::danger Incomplete

## Overview

**pathway** - a way that constitutes or serves as a path

`pathway` is an API that defines an easy way to manipulate the `$PATH` environment variable in a set of different environments. From what I can tell, there is no purpose built utility for this. Most internet searches pop up with examples of using fragile pipelines of other common POSIX utilities (e.g. `sed`, `tr`, `cut`). This is great if you rarely modify paths. In my situation I find myself modifying my `$PATH` for directing software to use an intended cross-compiler or purpose build toolchain. Having the ability to quickly `pop` and `push` a new `$PATH` is a big time saver. 

### Benefits / Features:

- Helps prevent me from fat fingering something that completely corrupts my path. For example I can very easily do something like: `export PATH=$PAT:/opt/myapp/bin` and then wipe the rest of my path! In many situations this isn't a big deal, but if you've got some long running shell sessions this can cause unnessary lost time.
- More clearly shows the intent of code when modifying a path in a shell script or viewing command in `history`. It can be less than useful to attempt to quickly parse out the intent of a `sed` command when reviewing a shell script behavior.
- UTF-8 built in. `LANG=*.UTF-8` can allow all manor of symbols that are not ASCII safe.
- Legacy mode built in. Locales are tricky to do right and in many cases all you need is ASCII support. `pathway` can limit its behaviors to ASCII only.

### Examples:

- Remove second path element in `$PATH` array: `export PATH=$(pathway remove 1)`.
- Insert path element `/opt/myapp/bin` as second element: `export PATH=$(pathway insert 1 /opt/myapp/bin)`

## Challenges

When working with an environment variable like `$PATH`, you **can not** write a binary that does some work and then modifies the parent's environment. At best, you can only modify the `$PATH` value and return the result to be handled by the parent in some meaningful way.

With this constraint a reality, `pathway` is designed as an API that can be implemented as a library for a number of different languages, shells, and shell scripts. My hope is that there can be some `bite` across the community if there is enough compatibility forward, backwards, upwards, and downwards.

### Compatibility _Goals_

Operating Systems:

- Linux 2.2, 2.4, 2.6, 3+.
- MacOS / FreeBSD / OpenBSD
- Windows

Runtime Environments:

- Python
- node
- Perl
- Java / Kotlin

Language Libraries:

- Python
- Javascript
- C89
- C++
- Go
- Perl

Shells (and Shell Scripts):

- busybox (and ash)
- dash
- bash
- zsh
- tcsh
- csh
- ksh

## History

Before the big bang (i.e. Unix), there was one of the first and more popular time-sharing operating systems Multics (Multiplexed Information and Computing Service). _Multics first introduced a hierarchical file system with directories (separated by ">") in the mid-1960s. Around 1970, Unix introduced the slash character ("/") as its directory separator._ -[Wikipedia / Path](https://en.wikipedia.org/wiki/Path_(computing))

In the beginning there was the [Thompson shell](https://en.wikipedia.org/wiki/Thompson_shell) (circa 1971). This is the Multics (precursor to Unix) shell that originally introduced input/output redirection, pipes.

_Multics originated the idea of a search path. The early Unix shell only looked for program names in /bin, but by Version 3 Unix the directory was too large and /usr/bin, and a search path, became part of the operating system.[1]Multics originated the idea of a search path. The early Unix shell only looked for program names in /bin, but by Version 3 Unix the directory was too large and /usr/bin, and a search path, became part of the operating system._ -[Wikipedia / PATH](https://en.wikipedia.org/wiki/PATH_(variable))

Next, the PWB Shell came onto the scene as a proper Unix shell. This shell introduced conditional logic (if/else/switch/while). 

_The PWB shell or Mashey shell, sh, was an upward-compatible version of the Thompson shell, augmented by John Mashey and others and distributed with the Programmer's Workbench UNIX, circa 1975–1977. It focused on making shell programming practical, especially in large shared computing centers. **It added shell variables (precursors of environment variables, including the search path mechanism that evolved into $PATH)**, user-executable shell scripts, and interrupt-handling. Control structures were extended from if/goto to if/then/else/endif, switch/breaksw/endsw, and while/end/break/continue. As shell programming became widespread, these external commands were incorporated into the shell itself for performance._ -[Wikipedia / Unix Shell](https://en.wikipedia.org/wiki/Unix_shell) 

_The $p variable was the ancestor of $PATH, which let users search for commands in their own choice of directories. Unlike most of the UNIX systems of the time, the original PWB/UNIX computer center was shared by multiple programming groups who could not change the contents of /bin or /usr/bin, but wanted to create their own sets of shared commands. In addition, the shell's command-searching was enhanced to allow shell procedures to be invoked like binary commands, i.e., if the shell found a non-binary file marked executable, it would fork another shell instance to read that file as a shell script. Thus people could type command arguments rather than sh pathname/command arguments. All this behavior was packaged as the function pexec, which was the ancestor of execvp, to allow any program to invoke commands in the same way as the shell._ -[Wikipedia / PWB Shell](https://en.wikipedia.org/wiki/PWB_shell)

With the lessons learned from PWB Shell and Thompson shell, Steven Bourne started to develop a new shell for [Unix version 7](https://en.wikipedia.org/wiki/Version_7_Unix).

_This Bourne shell was incompatible with the Thompson and PWB shells, but included equivalents of most of the PWB shell's features, but done from scratch, rather than incrementally, with much discussion among the various participants. In particular, environment variables and related machinery were designed by Stephen Bourne, John Mashey, and Dennis Ritchie as a general mechanism to replace the earlier, more limited features_ -[Wikipedia / PWB Shell](https://en.wikipedia.org/wiki/PWB_shell)

_On POSIX and Unix-like operating systems, the $PATH variable is specified as a list of one or more directory names separated by colon (:) characters. **Directories in the PATH-string are not meant to be escaped, making it impossible to have directories with : in their name.**_ -[Wikipedia / PATH](https://en.wikipedia.org/wiki/PATH_(variable))



## Resources

```text
PATH
    This variable shall represent the sequence of path prefixes that certain functions and utilities apply in searching for an executable file known only by a filename. The prefixes shall be separated by a colon ( ':' ). When a non-zero-length prefix is applied to this filename, a slash shall be inserted between the prefix and the filename. A zero-length prefix is a legacy feature that indicates the current working directory. It appears as two adjacent colons ( "::" ), as an initial colon preceding the rest of the list, or as a trailing colon following the rest of the list. A strictly conforming application shall use an actual pathname (such as .) to represent the current working directory in PATH . The list shall be searched from beginning to end, applying the filename to each prefix, until an executable file with the specified name and appropriate execution permissions is found. If the pathname being sought contains a slash, the search through the path prefixes shall not be performed. If the pathname begins with a slash, the specified path is resolved (see Pathname Resolution). If PATH is unset or is set to null, the path search is implementation-defined.
```
[The Open Group Base Specifications Issue 6 - IEEE Std 1003.1, 2004 Edition](https://pubs.opengroup.org/onlinepubs/000095399/basedefs/xbd_chap08.html#tag_08_03)

[Microsoft PATH Command](https://docs.microsoft.com/en-us/previous-versions/aa922003(v=msdn.10)?redirectedfrom=MSDN)

[Dash implementation of path parser](https://git.kernel.org/pub/scm/utils/dash/dash.git/tree/src/exec.c?h=v0.5.9.1&id=afe0e0152e4dc12d84be3c02d6d62b0456d68580#n173):

```c
/*
 * Do a path search.  The variable path (passed by reference) should be
 * set to the start of the path before the first call; padvance will update
 * this value as it proceeds.  Successive calls to padvance will return
 * the possible path expansions in sequence.  If an option (indicated by
 * a percent sign) appears in the path entry then the global variable
 * pathopt will be set to point to it; otherwise pathopt will be set to
 * NULL.
 */

const char *pathopt;

char *
padvance(const char **path, const char *name)
{
	const char *p;
	char *q;
	const char *start;
	size_t len;

	if (*path == NULL)
		return NULL;
	start = *path;
	for (p = start ; *p && *p != ':' && *p != '%' ; p++);
	len = p - start + strlen(name) + 2;	/* "2" is for '/' and '\0' */
	while (stackblocksize() < len)
		growstackblock();
	q = stackblock();
	if (p != start) {
		memcpy(q, start, p - start);
		q += p - start;
		*q++ = '/';
	}
	strcpy(q, name);
	pathopt = NULL;
	if (*p == '%') {
		pathopt = ++p;
		while (*p && *p != ':')  p++;
	}
	if (*p == ':')
		*path = p + 1;
	else
		*path = NULL;
	return stalloc(len);
}
```