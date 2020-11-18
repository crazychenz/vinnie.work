---
title: "Bare Metal CMake Development: Multiple Toolchains and Containers"
date: "2020-11-17T12:00:00.000Z"
description: |
  An evaluation of CMake's capabilities as a build system for embedded systems development.
---

## Overview

In my previous article on [Build Systems for Embedded Development: From 30000 feet.](/20201114-build-systems), I had concluded that CMake was going to be where any initial efforts would take place. There are a few things that I want to accomplish to prove to myself that CMake can get the job done:

- Build bare metal binary for several different targets:
  - buildroot cross-compiler toolchain.
  - LLVM host defaults.
  - LLVM cross-compiler.
- Build all targets in a single run.
- Build all of the targets using containers (w/ docker).

## Building Bare Metal Binary

Building bare metal binary involves an assembler, compiler, linker, and an elf reader, so this is a great way to really explore many of the configurations around toolchain setup of a build system like CMake.

### Project Directory Structure

First things first, having some ground rules for how the project folder will be setup goes miles. This can be tough if you don't know what needs to be organized, but there are plenty of examples on the internet and you can always organically evolve your needs as the project requires. My project directory structure looks like the following:

```
  work
  |
  |---- cmake
  |     |
  |     |---- toolchains
  |           |
  |           |---- <ToolchainTuple.cmake>
  |
  |---- components
  |     |
  |     |---- <ComponentName>
  |
  |---- utils
  |
  |---- export
  |     |
  |     |---- <ToolchainTuple>
  |           |
  |           |---- <ComponentName>
  |
  |---- CMakeLists.txt
```

- **work** - This is the top level of the project. It contains the top level CMakeLists.txt that drives everything else. We'll assume that we're in this directory when running any commands in this article.
- **cmake** - Home for all the `*.cmake` script files. This includes reusable cmake functions and `Find*.cmake` files.
- **cmake/toolchains** - Location of the various toolchain configurations.
- **components** - A top level folder for holding all of the code that actually gets delivered and executed on a user's platform. Code in this folder should be considered critical, well tested, and impactful to the user.
- **utils** - A top level folder for utilities that are used by the developers and build system but will not be part of the released end-user binary distribution.
- **export** - The output directory from the builds. No developer input should ever be saved in export. Its entirely generated output. Within this directory, we're aiming to output the various component/utils builds under a folder that represents the toolchain they were built by.

### The Trivial Sanity Check

Now that we have a project directory structure setup, lets create a HelloWorld component to be built.

**work/components/HelloWorld/src/main.c**:

```
#include <stdio.h>
int main() { printf("Hello World.\n"); return 0; }
```

**work/CMakeLists.txt**:

```
# CMake Version Declaration Always First
cmake_minimum_required(VERSION 3.14)

# Project Name Required
project(HelloWorld LANGUAGES C)

# Blindly grab all the things.
file(GLOB sources components/HelloWorld/src/*.c)

# Create a target that generates an executable (ELF/EXE) from discovered sources.
add_executable(HelloWorld ${sources})
```

To build this, simply run the following:

```
cmake -B export -S .
make -C export
```

### Building With Non-Default Toolchain

CMake has a ton of different variables that you can set in its environment to control its behavior. In most cases, these variables start with `CMAKE_`. This prevents namespace collision when we develop our own variable names.

The first variable to know when developing a toolchain configuration is `CMAKE_TOOLCHAIN_FILE`. This variable points to the file that will hold all of the toolchain configuration. It can't actually be set from a CMakeLists.txt like many other variables, but instead from the `cmake` command line arguments. Having it defined on the command line allows it to be parsed and made active very early in the cmake initialization process.

As a trivial example, you can create an empty `host.cmake` toolchain configuration file and reference it like the following:

```
touch cmake/toolchains/host.cmake
cmake -DCMAKE_TOOLCHAIN_FILE=cmake/toolchains/host.cmake -B export -S .
make -C export
```

In a more real world toolchain configuration, there a bunch of other variables that we need to set. As we proceed, keep in mind that in a typical make environment, the following variables are not unlike having to set CC, CXX, CFLAGS, CXXFLAGS, LD, LDFLAGS and so forth. A _non-exhaustive_ set of toolchain variables that you may find relevant include:

- [CMAKE_SYSTEM_NAME](https://cmake.org/cmake/help/v3.14/variable/CMAKE_SYSTEM_NAME.html) - Set to `Generic` for bare metal. If left alone, CMake is configured for host builds. Other values indicate the target Operating System.
- [CMAKE_SYSTEM_PROCESSOR](https://cmake.org/cmake/help/v3.14/variable/CMAKE_SYSTEM_PROCESSOR.html) - Set this to the processor architecture of the target. (e.g. `aarch64`)
- CMAKE_ASM_FLAGS - Global flags to apply to an assembler. (i.e. ASFLAGS)
- CMAKE_C_FLAGS - Global flags to apply to a C compiler. (i.e. CCFLAGS)
- CMAKE_EXE_LINKER_FLAGS - Global flags to apply to the linker. (i.e. LDFLAGS)
- CMAKE_ASM_FLAGS_DEBUG - Assembler flags to apply when CMAKE_BUILD_TYPE is `Debug`
- CMAKE_C_FLAGS_DEBUG - C Compiler flags to apply when CMAKE_BUILD_TYPE is `Debug`
- CMAKE_EXE_LINKER_FLAGS_DEBUG - Linker flags to apply when CMAKE_BUILD_TYPE is `Debug`
- CMAKE_ASM_FLAGS_RELEASE - Assembler flags to apply when CMAKE_BUILD_TYPE is `Release`
- CMAKE_C_FLAGS_RELEASE - C Compiler flags to apply when CMAKE_BUILD_TYPE is `Release`
- CMAKE_EXE_LINKER_FLAGS_RELEASE - Linker flags to apply when CMAKE_BUILD_TYPE is `Release`
- CMAKE_LINKER - The binary path and prefix of the linker executable. (i.e. LD)
- CMAKE_ASM_COMPILER - The binary path and prefix of the assembler executable. (i.e. AS)
- CMAKE_C_COMPILER - The binary path and prefix of the C compiler executable. (i.e. CC)
- CMAKE_OBJCOPY - The binary path and prefix of the objcopy executable. (i.e. OBJCOPY)

There are others, but these will get us started. Assuming the following:

- Toolchain `bin` Path is in \$PATH
- Toolchain prefix is `aarch64-buildroot-linux-uclibc-`

Here is what a minimal toolchain cmake script may look like:

**cmake/toolchains/aarch64-buildroot-linux-uclibc-gnu.cmake**:

```
list(APPEND CMAKE_MODULE_PATH ${CMAKE_CURRENT_LIST_DIR})

# We use "Generic" so cmake can expect to build for `none` platform.
set(CMAKE_SYSTEM_NAME Generic)
# Our buildroot toolchain is for `aarch64`
set(CMAKE_SYSTEM_PROCESSOR aarch64)

# Toolchain Prefix
set(TC_PREFIX aarch64-buildroot-linux-uclibc-)

# TC_PATH can be changed on command line.
if(NOT DEFINED TC_PATH)
    set(TC_PATH "")
    message(STATUS "No -DTC_PATH specified, assuming in system path.")
endif()

# Some mininal cross-platform convienence.
if(WIN32)
    set(TC_EXT ".exe" )
else()
    set(TC_EXT "" )
endif()

# Shun all C before C99
set(CMAKE_C_FLAGS "-std=gnu99" CACHE INTERNAL "C Compiler options")
set(CMAKE_EXE_LINKER_FLAGS "-Wl,-Map=${CMAKE_PROJECT_NAME}.map" CACHE INTERNAL "Linker options")

# Debug flags
set(CMAKE_ASM_FLAGS_DEBUG "" CACHE INTERNAL "ASM Compiler options for debug build type")
set(CMAKE_C_FLAGS_DEBUG "-Og -g" CACHE INTERNAL "C Compiler options for debug build type")
set(CMAKE_EXE_LINKER_FLAGS_DEBUG "" CACHE INTERNAL "Linker options for debug build type")

# Release flags
set(CMAKE_ASM_FLAGS_RELEASE "" CACHE INTERNAL "ASM Compiler options for release build type")
set(CMAKE_C_FLAGS_RELEASE "-Os -flto" CACHE INTERNAL "C Compiler options for release build type")
set(CMAKE_EXE_LINKER_FLAGS_RELEASE "" CACHE INTERNAL "Linker options for release build type")

# Binaries
set(CMAKE_LINKER ${TC_PATH}${TC_PREFIX}ld${TC_EXT} CACHE INTERNAL "Linker Binary")
set(CMAKE_ASM_COMPILER ${TC_PATH}${TC_PREFIX}as${TC_EXT} CACHE INTERNAL "ASM Compiler")
set(CMAKE_C_COMPILER ${TC_PATH}${TC_PREFIX}gcc${TC_EXT} CACHE INTERNAL "C Compiler")
set(CMAKE_OBJCOPY ${TC_PATH}${TC_PREFIX}objcopy${TC_EXT} CACHE INTERNAL "Objcopy Binary")

# TODO: Explain this.
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)
```

Now we can build our HelloWorld app for aarch64 processors:

```
cmake -DCMAKE_TOOLCHAIN_FILE=cmake/toolchains/aarch64-buildroot-linux-uclibc-gnu.cmake -B export -S .
make -C export
```

### Breaking Up CMakeLists.txt

So far we've been doing all of our project build definitions from a single CMakeLists.txt. We need to break these up into CMakeLists.txt for each component. To show this in action, we're going to create a second `CMakeLists.txt` for HelloWorld and a second component that include assembly code called `Minimal` with its own `CMakeLists.txt` file.

**CMakeLists.txt**:

```
cmake_minimum_required(VERSION 3.14)

project(bare_metal_dev LANGUAGES C ASM)

add_subdirectory(components/HelloWorld)
add_subdirectory(components/Minimal)
```

**components/HelloWorld/CMakeLists.txt**:

```
cmake_minimum_required(VERSION 3.14)

project(HelloWorld LANGUAGES C)

file(GLOB sources src/*.c)
add_executable(HelloWorld ${sources})
```

**components/Minimal/src/startup.s**:

```
.section .text
ldr w2, =0xDEADBEEF
b .
```

**components/Minimal/CMakeLists.txt**:

```
cmake_minimum_required(VERSION 3.14)
project(Minimal LANGUAGES C ASM)

# If build with Makefiles, make output verbose.
set(CMAKE_VERBOSE_MAKEFILE ON)

# Ninja monkey patch. Should be fixed in cmake 3.18
# Defaults to "-MD -MT <OBJECT> -MF <DEPFILE>" ('as' no likey).
set(CMAKE_DEPFILE_FLAGS_ASM "")

# Create minimal ELF binary from sources.
add_executable(minimal.elf src/coerce.c src/startup.s)

# The compiler must make no assumptions about the build.
set_target_properties(minimal.elf PROPERTIES
    LINK_FLAGS "-nostdlib -nostartfiles -ffreestanding -e 0")

# Generates the binary with objcopy.
add_custom_command(
    OUTPUT minimal.bin
    DEPENDS minimal.elf
    COMMENT "objcopy -O binary minimal.elf minimal.bin"
    COMMAND ${CMAKE_OBJCOPY} ARGS -O binary minimal.elf minimal.bin
)
# Bind above objcopy custom command with `minimal_bin` target.
add_custom_target(minimal_bin ALL DEPENDS minimal.bin)
```

Create an empty C file:

```
touch components/Minimal/src/coerce.c
```

Ok, so compared to the HelloWorld example, there is a lot more going on here. I'll try to explain everything new.

Notice the project() call above references `LANGUAGES C ASM`. This means that we're telling CMake to expect to have to use the C compiler and an assembler.

The CMAKE_VERBOSE_MAKEFILE variable is only relevant when building Makefiles. It allows us to see the actual commands being run by CMake and `make` when running. This is very useful when attempting to figure out the behavior of these different variables and the functions of CMake.

The CMAKE_DEPFILE_FLAGS_ASM is a monkey patch to fix an issue when building with Ninja files. This is a non-obvious fix that I found when scrolling github issues after I originally couldn't get Ninja builds working. Just use this line unless you are using CMake 1.18 or greater.

`add_executable()` is simply the function that instructs CMake to create the `minimal.elf` binary from the given sources. CMake in the instance is smart enough to pass the `*.s` files to an assembler and the `*.c` files to a C compiler. Something worth noting here is that the `coerce.c` file is empty. It only exists because if we don't use this file, CMake will assume that we don't want to link the `startup.s` into a proper ELF. This is really only an edge case and we'll almost always have real C code, in which case we don't need the `coerce.c` file. (i.e. Its only there to _coerce_ CMake to behave the way we expect.)

`set_target_properties()` is surgically inserting flags to tell the build to not make any assumptions about what OS the binary is built for. Instead, the compiler and linker should build a free standing "bare metal" binary.

The `add_custom_command()` and `add_custom_target()` go together. The first is how we can define a sort of "make recipe" in CMake. The latter is how we bind that recipe to a real make target. If we didn't bind the command to a target, we can't enforce the dependencies as well and the binary is treated as a second class citizen. In summary, `add_custom_target()` binds a target to commands defined in `add_custom_command()`.

Simple, no?

Now if you run the following, CMake will generate the Makefiles for both HelloWorld and Minimal. The `make` call will then build both in a single go for the given toolchain.

```
cmake -DCMAKE_TOOLCHAIN_FILE=cmake/toolchains/aarch64-buildroot-linux-uclibc-gnu.cmake -B export -S .
make -C export
```

### Building With Multiple Toolchains

CMake doesn't officially support building for multiple toolchains. Many other build systems don't either. This is where you'd typically start using make or shell scripts to drive a bunch of different CMake runs. There is another CMake solution that is often used though. Its call [ExternalProject](https://cmake.org/cmake/help/v3.14/module/ExternalProject.html). This is a utility that provides the ability to dynamically download, update, build, test, and install external projects. What this does for us is allow our top level `CMakeLists.txt` drive the building of our components or potentially any sub-projects on a per toolchain basis.

To accomplist this while maintaining a simple and readable top-level `CMakeLists.txt` file, I've developed a cmake script that contains a function that'll do the heavy lifting for us.

**cmake/AddMultiTargetComponent.cmake**:

```
include(ExternalProject)

function(add_multi_target_component srcRelPrefix project toolchainTuple generator)
    set(projectToolchainTuple ${project}-${toolchainTuple})
    set(toolchainFile ${CMAKE_SOURCE_DIR}/cmake/toolchains/${toolchainTuple}.cmake)
    set(outputDir ${CMAKE_BINARY_DIR}/${toolchainTuple}/${project})
    if(${generator} STREQUAL "Ninja")
        set(buildBin ninja)
    else()
        set(buildBin make)
    endif()
    ExternalProject_Add(${projectToolchainTuple}
        PREFIX ${outputDir}
        SOURCE_DIR ${CMAKE_SOURCE_DIR}/${srcRelPrefix}/${project}
        BINARY_DIR ${outputDir}
        # CONFIGURE_COMMAND ""
        CMAKE_GENERATOR ${generator}
        CMAKE_ARGS -DCMAKE_TOOLCHAIN_FILE=${toolchainFile} -B ${outputDir}
        BUILD_COMMAND ${buildBin}
        INSTALL_COMMAND ""
    )
endfunction()
```

The function `add_multi_target_component()` takes 4 arguments:

- srcRelPrefix - A relative path (from the CMAKE_SOURCE_DIR) to the component, utility, or sub_project.
- project - The name of the component, utility, or sub_project. By convention, this is the name of the folder.
- toolchainTuple - The primary name of the toolchain file. (i.e. `cmake/toolchain/${toolchainTuple}.cmake`)
- generator - Either `"Unix Makefiles"` or `"Ninja"`.

This means we can now build HelloWorld for `host`, and both HelloWorld and Minimal for `aarch64`:

**CMakeLists.txt**:

```
cmake_minimum_required(VERSION 3.14)

project(bare_metal_dev LANGUAGES C)

# If used, this needs to be enabled after project()
# set(CMAKE_VERBOSE_MAKEFILE ON)

set(CMAKE_MODULE_PATH "${PROJECT_SOURCE_DIR}/cmake" ${CMAKE_MODULE_PATH})
include(AddMultiTargetComponent)

add_multi_target_component(components HelloWorld aarch64-buildroot-linux-uclibc-gnu Ninja)
add_multi_target_component(components Minimal aarch64-buildroot-linux-uclibc-gnu Ninja)
add_multi_target_component(components HelloWorld host Ninja)
```

Viola! We now have the ability to build multiple components using different toolchains. You should be able to find the relevant binaries for each in `export/${toolchainTuple}/${componentName}`.

### Adding LLVM as a Toolchain

So far we've been focused on using only GNU toolchains. Another very popular toolchain right now is the LLVM and Clang suite of tools that are nearly drop in replacements for the GNU toolchain. One of the major features of LLVM for embedded development is that it supports a large number of architectures out of the box with every install. This means we don't have to build or install a separate LLVM toolchain for each architecture. Selecting the architecture you want to build becomes as simple as a commmand line argument. Another big reason to lean in on LLVM and Clang is because they do a much better job of retaining the context of the original source code. This means better mapping from found errors back to the source code.

Here is a CMake toolchain configuration I've been using with HelloWorld and Minimal with success:

**cmake/toolchains/aarch64-llvm.cmake**:

```
list(APPEND CMAKE_MODULE_PATH ${CMAKE_CURRENT_LIST_DIR})

# We use "Generic" so cmake can expect to build for `none` platform.
set(CMAKE_SYSTEM_NAME Generic)
# Our buildroot toolchain is for `aarch64`
set(CMAKE_SYSTEM_PROCESSOR aarch64)

# Toolchain Prefix
set(TC_PREFIX "")

# TC_PATH can be changed on command line.
if(NOT DEFINED TC_PATH)
    set(TC_PATH "")
    message(STATUS "No -DTC_PATH specified, assuming in system path.")
endif()

# Some mininal cross-platform convienence.
if(WIN32)
    set(TC_EXT ".exe" )
else()
    set(TC_EXT "" )
endif()

# Shun all C before C99
set(CMAKE_ASM_FLAGS "--target=aarch64-linux-gnu" CACHE INTERNAL "ASM Compiler options")
set(CMAKE_C_FLAGS "--target=aarch64-linux-gnu -std=gnu99" CACHE INTERNAL "C Compiler options")
set(CMAKE_EXE_LINKER_FLAGS "-Wl,-Map=${CMAKE_PROJECT_NAME}.map" CACHE INTERNAL "Linker options")

# Debug flags
set(CMAKE_ASM_FLAGS_DEBUG "" CACHE INTERNAL "ASM Compiler options for debug build type")
set(CMAKE_C_FLAGS_DEBUG "-Og -g" CACHE INTERNAL "C Compiler options for debug build type")
set(CMAKE_EXE_LINKER_FLAGS_DEBUG "" CACHE INTERNAL "Linker options for debug build type")

# Release flags
set(CMAKE_ASM_FLAGS_RELEASE "" CACHE INTERNAL "ASM Compiler options for release build type")
set(CMAKE_C_FLAGS_RELEASE "-Os -flto" CACHE INTERNAL "C Compiler options for release build type")
set(CMAKE_EXE_LINKER_FLAGS_RELEASE "" CACHE INTERNAL "Linker options for release build type")

# Binaries
set(CMAKE_ASM_COMPILER ${TC_PATH}${TC_PREFIX}clang${TC_EXT} CACHE INTERNAL "ASM Compiler")
set(CMAKE_C_COMPILER ${TC_PATH}${TC_PREFIX}clang${TC_EXT} CACHE INTERNAL "C Compiler")
set(CMAKE_OBJCOPY ${TC_PATH}${TC_PREFIX}llvm-objcopy${TC_EXT} CACHE INTERNAL "Objcopy Binary")

# TODO: Explain this.
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)
```

Notice the CMAKE_ASM_COMPILER and CMAKE_C_COMPILER are the same. This is because `clang` is the inteface to the assembler as well as the C compiler. Also take note of the cooresponding flag variables CMAKE_ASM_FLAGS and CMAKE_C_FLAGS. In those variables we're now setting the `--target` argument to target a particular architecture.

With this toolchain in place, we can now update our top level `CMakeLists.txt` so that it uses LLVM.

```
cmake_minimum_required(VERSION 3.14)

project(bare_metal_dev LANGUAGES C ASM)

# This needs to be enabled after project()
set(CMAKE_VERBOSE_MAKEFILE ON)

set(CMAKE_MODULE_PATH "${PROJECT_SOURCE_DIR}/cmake" ${CMAKE_MODULE_PATH})
include(AddMultiTargetComponent)

add_multi_target_component(components HelloWorld host Ninja)
add_multi_target_component(components HelloWorld aarch64-buildroot-linux-uclibc-gnu Ninja)
add_multi_target_component(components Minimal aarch64-buildroot-linux-uclibc-gnu Ninja)

add_multi_target_component(components Minimal aarch64-llvm "Unix Makefiles")
```

### Building Targets From Containers

At the time of this writing I am using Ubuntu 20.04 and the newest available LLVM from apt in Ubuntu 20.04 is LLVM 10. There were some features (`-print-targets`) that I wanted to use that were only available in LLVM 11, so I decided that I needed to install the upstream version of LLVM on my machine. Because this wasn't going to be using the global package management system, I didn't want to just plop it down. Instead I decided this would be a great use case for using containers with CMake.

Now, there is a balance with using containers and over using containers. Based on some very quick research I determined that the overhead of firing up a container (that isn't starting services) is around 1 second. This means that we don't want to fire up a new container for each invocation of clang, but instead fire up a new container for each component or list of components per toolchain. This lead me to creating a `add_containerized_target()` function call that allows me to target any given component, utility, or subproject to be built within a container.

First, we're going to need to create the container. In this case, I've created a Dockerfile that resembles the following. For the sake of breivity, I've snipped some of the repetative noisy parts out:

```
# Ubuntu 20.04 is focal.
FROM ubuntu:focal

# Install `ifconfig` and `ping` because why not?
RUN apt-get update && apt-get install -y net-tools

# Install LLVM install shell script dependencies.
RUN apt-get install -y lsb-release wget software-properties-common

# Install latest stable upstream LLVM.
RUN wget https://apt.llvm.org/llvm.sh && \
    chmod +x llvm.sh && \
    ./llvm.sh 11

# Install dependencies for our builds.
RUN apt-get install -y apt-utils ninja-build make cmake

# Configure generic clang links to specific version.
RUN \
    update-alternatives --install /usr/bin/clang clang /usr/bin/clang-11 100 && \
    update-alternatives --install /usr/bin/clang++ clang++ /usr/bin/clang++-11 100 && \
    update-alternatives --install /usr/bin/clang-cpp clang-cpp /usr/bin/clang-cpp-11 100 && \
    update-alternatives --install /usr/bin/lld lld /usr/bin/lld-11 100 && \
    update-alternatives --install /usr/bin/llvm-objcopy llvm-objcopy /usr/bin/llvm-objcopy-11 100

# Configure std symlinks to use generic clang links.
# Note: Use lld-link for windows?
RUN \
    update-alternatives --install /usr/bin/cpp cpp /usr/bin/clang-cpp 100 && \
    update-alternatives --install /usr/bin/cc cc /usr/bin/clang 100 && \
    update-alternatives --install /usr/bin/c++ c++ /usr/bin/clang++ 100 && \
    update-alternatives --install /usr/bin/ld ld /usr/bin/lld 100 && \
    update-alternatives --install /usr/bin/objcopy objcopy /usr/bin/llvm-objcopy 100

# Setup to build as a user so our host user has access to results.
ARG uid=1000
ARG gid=1000
ARG username=user
ARG groupname=user
WORKDIR /workspace
RUN addgroup --system --gid ${gid} ${groupname}
RUN adduser --system --disabled-password --uid ${uid} --gid ${gid} ${username}
USER ${username}
```

In the above Dockerfile, we're explicitly installing LLVM 11. The way LLVM 11 is installed causes all of its binaries to be suffixed with `-11`. This is kind of annoying, so I've created symlinks (via update-alternatives) to remove the need to type in the `-11` suffix. Additionally, since we don't already have a GNU system toolchain, I also aliased the LLVM and Clang binaries as the default toolchain binaries.

Finally, I create a user account and group that are not root. Ideally, you don't want to run docker containers as root because when you volume mount directories into the containers, any files that are written will by default be owned by root on the host, preventing any host user accounts access to them.

To more closely match the uid, gid, username, and user group of the user created in the image, I've written a script to build the docker image that infers this information from my account:

```
#!/bin/bash

docker build \
    --build-arg uid=$(id -u) \
    --build-arg username=$(whoami) \
    --build-arg gid=$(id -g) \
    --build-arg groupname=$(whoami) \
    -t crazychenz/llvm .
```

Now that we have a Docker image we can fire containers off from, we need the infrastructure built into CMake to facilitate this action. For this, as mentioned before, I created a `add_containerized_target()` function that I've squirreled away in the `cmake/AddMultiTargetComponent.cmake` script:

```
function(add_containerized_target srcRelPrefix project toolchainTuple generator image)
string(REGEX REPLACE "/" "_" safeImage ${image})
    string(REGEX REPLACE "\\\\" "_" safeImage ${safeImage})
    set(projectToolchainTuple ${project}-${safeImage}-${toolchainTuple})
    set(toolchainFile ${CMAKE_SOURCE_DIR}/cmake/toolchains/${toolchainTuple}.cmake)
    set(imageToolchainTuple ${safeImage}-${toolchainTuple})
    set(outputDir ${CMAKE_BINARY_DIR}/${imageToolchainTuple}/${project})
    if(${generator} STREQUAL "Ninja")
        set(buildBin ninja)
    else()
        set(buildBin make)
    endif()
    ExternalProject_Add(${projectToolchainTuple}
        PREFIX ${outputDir}
        SOURCE_DIR ${CMAKE_SOURCE_DIR}/${srcRelPrefix}/${project}
        BINARY_DIR ${outputDir}
        # CONFIGURE_COMMAND ""
        CMAKE_GENERATOR ${generator}
        CMAKE_ARGS -DCMAKE_TOOLCHAIN_FILE=${toolchainFile} -B ${outputDir}
        # Work around for lack of relative pathing: -v ${CMAKE_SOURCE_DIR}:${CMAKE_SOURCE_DIR}
        # This work around depends on the build directory existing in the source directory structure.
        BUILD_COMMAND docker run -ti --rm -v ${CMAKE_SOURCE_DIR}:${CMAKE_SOURCE_DIR} ${image} ${buildBin} -C ${outputDir}
        INSTALL_COMMAND ""
    )
endfunction()
```

There are two notable differences between `add_containerized_target()` and `add_multi_target_component()`. The first is that we've now pre-pended the toolchainTuple with the name of the docker image used to launch the container. The name has been slightly modified so that it doesn't inadvertently create a deeper directory structure by using the common slash found separating docker image names and their namespaces.

The second thing to notice is the BUILD_COMMAND of the `ExternalProject_Add()` function call. Here is where we actually invoke docker and request it runs a builder binary (i.e. make or ninja). Within this docker command, we're forced to use `-v ${CMAKE_SOURCE_DIR}:${CMAKE_SOURCE_DIR}` as a volume mount. This is because CMake doesn't support the creation of relative paths when it generates Makefiles and Ninja files. Usually when running a process in a container, we mount a local directory to a different container directory. Without relative pathing, all absolute paths will no longer work without additionally mounting them as well. To simplify all of this, we simply define the convention that all source and binaries are located within the CMAKE_SOURCE_DIR and then map the CMAKE_SOURCE_DIR into the container as itself. Assuming this doesn't conflict with any parts of the image, absolute paths should now work within the context of the source folder.

That said, we can update our top level `CMakeLists.txt` to have something like the following so that we get a LLVM-11 built Minimal component:

```
cmake_minimum_required(VERSION 3.14)

project(bare_metal_dev LANGUAGES C ASM)

# This needs to be enabled after project()
set(CMAKE_VERBOSE_MAKEFILE ON)

set(CMAKE_MODULE_PATH "${PROJECT_SOURCE_DIR}/cmake" ${CMAKE_MODULE_PATH})
include(AddMultiTargetComponent)

add_multi_target_component(components HelloWorld host Ninja)
add_multi_target_component(components HelloWorld aarch64-buildroot-linux-uclibc-gnu Ninja)
add_multi_target_component(components Minimal aarch64-buildroot-linux-uclibc-gnu Ninja)
add_multi_target_component(components Minimal aarch64-llvm "Unix Makefiles")

add_containerized_target(components Minimal aarch64-llvm "Unix Makefiles" crazychenz/llvm)
```

## Conclusion

In conclusion, CMake is very capable of managing our embedded development needs. As mentioned above, we were able to:

- Build bare metal binary for several different targets:
  - buildroot cross-compiler toolchain.
  - LLVM host defaults.
  - LLVM cross-compiler.
- Build all targets in a single run.
- Build all of the targets using containers (w/ docker).

Even though CMake doesn't explictly support multiple toolchain builds or relative paths for containerized builds, with good conventions and the extensibility of CMake, we were easily able to workaround the limitations without using any tools external to CMake itself (e.g. shell scripts or Python).

More experimentation needs to be done to see how the multiple toolchain builds and containerized builds impact the potential sharing capabilites of the build results with new and more intesting products. For example, could we build a library within a docker container and consumer the library from within another docker container without breaking any dependency trees? I'm also curious about the integration of `autoconf` with CMake and what facilites CMake may have to obsolete `autoconf` itself.
