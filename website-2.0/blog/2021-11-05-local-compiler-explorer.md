---
slug: 2021-11-05-local-compiler-explorer
title: 'Local Compiler Explorer'
draft: true
---

Watched an old 2018 CppCon talk today. Ended up finding out about Compiler Explorer. I've seen this kind of things in the past, but since I was about to start writing about toolchains and linker scripts I decided to create a local installation of Compiler Explorer. This is a fantastic tool for quickly running through all the states of the compiler.

<!--truncate-->

`etc/config/c.local.properties`:

<details>
<summary>Click to see content.</summary>

```ini
# Local settings for C
compilers=aarch64_buildroot_linux_musl_gcc_10_3
defaultCompiler=aarch64_buildroot_linux_musl_gcc_10_3
demangler=/projects/playground/br-tools/host/bin/aarch64-buildroot-linux-musl-c++filt
objdumper=/projects/playground/br-tools/host/bin/aarch64-buildroot-linux-musl-objdump
postProcess=
supportsBinary=true
#binaryHideFuncRe=^(__.*|_(init|start|fini)|(de)?register_tm_clones|call_gmon_start|frame_dummy|\.plt.*)$
stubRe=\bmain\b
stubText=int main(void){return 0;/*stub provided by Compiler Explorer*/}
supportsLibraryCodeFilter=true

compiler.aarch64_buildroot_linux_musl_gcc_10_3.exe=/projects/playground/br-tools/host/bin/aarch64-buildroot-linux-musl-gcc
compiler.aarch64_buildroot_linux_musl_gcc_10_3.name=aarch64-buildroot-linux-musl-gcc
#compiler.aarch64_buildroot_linux_musl_gcc_10_3.options=
ler.aarch64_buildroot_linux_musl_gcc_10_3.needsMulti=true
compiler.aarch64_buildroot_linux_musl_gcc_10_3.versionFlag=--version
compiler.aarch64_buildroot_linux_musl_gcc_10_3.executionWrapper=qemu-aarch64
```

</details>

Start with: `make EXTRA_ARGS="--host 0.0.0.0 --language c"`

## VSCode Integration

```json
{
    "compiler-explorer.url": "https://godbolt.org", // url of the compiler explorer you want to use.
    "compiler-explorer.compiler": "carmg820", // Compiler code - See help below.
    "compiler-explorer.options": "-O3", // Compiler options
    "compiler-explorer.debug": true, // true indicates that the extension will print debug to its output channel.
    "compiler-explorer.include": [<filepaths>]
}
```

## Resources

[OpenGithub Issue: Support -E in some way](https://github.com/compiler-explorer/compiler-explorer/issues/1380)

## Comments

<Comments />
