CMake - Meta-build for different build environments and platforms.
SCons - Build system with real language.
Make - Grand Ol' Build system that is EVERYWHERE.
Ninja - Build system (not for humans)
Premake - Meta-build system
Autotools - Meta-build system

I want to build a tool from many platforms to be used on many platforms.

I want to build a tool from many platforms to be used on a single platform.

I want to build a tool from a single platform for many platforms.

I want to build a tool from a single platform for a single platform.



1. How many roles are expected to use the tool?

Users comes first and this is where we break between build systems that are configurable vs less-configurable systems.

Usable is defined as a system that has been designed for user input without the modification of any source files (build system or otherwise). Additionally, a usable system is also one with mature and searchable documentation (i.e. has an accessible search engine presence on the internet).

Usable systems include:

- Autotools
- Scons
- CMake
- Make

Less Usable systems include:

- Ninja
- Custom (anything custom with less mature documentation of search engine presence.)

2. Where will the code be built from and what are the targets?

Different build systems are better suited for different sets of build from targets and built for targets.

Scons is for maximum flexibility (minus simplicity). It has a real language.

Autotools is for maximum portability *of build system*.

CMake is for maximum portability of *of build intent*.

Make is ok for quick and simple projects. Doesn't scale well with human crafted.

Ninja scales but is bad for human crafted.


Build N/1 | Target N/1 | Roles N/1

000 bNtNrN - Autotools / Scons / CMake
001 bNtNr1 - Autotools / Scons / CMake
010 bNt1rN - Autotools / Scons / CMake
011 bNt1r1 - CMake
100 b1tNrN - Autotools / Scons / CMake
101 b1tNr1
110 b1t1rN
111 b1t1r1 - Make

