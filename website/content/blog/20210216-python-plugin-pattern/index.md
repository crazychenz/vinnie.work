---
title: "A Python Plugin Pattern"
date: "2021-02-16T12:00:00.000Z"
description: |
  Python has many different plugin patterns that can be used for adding extensibility to your python applications and frameworks. This article explains my preferred method for adding plugins.
---

## Overview

When I first started messing around with Python (around 2010), I learned about calls like `exec()` and `__import__` and how they could be used to dynamically load other python files. This naturally felt like a path of least resistance for implementing any kind of plugin framework for python projects that I needed. Or is it?

Arguably, the vagueness of what a plugin is can be defined in many different ways and used in different phases of a project (e.g. a plugin could be something used at build time before the application has been released and installed or dynamically at runtime after an application has been installed by an end user.) The assumption going forward is that when we refer to a plugin, its a distributable package that is built outside of the framework's source tree and is dynamically integrated into the framework sometime after the end user has already installed and started using the framework in their environment.

When implementing plugins, you are essentially declaring that you plan to allow loosely coupled objects with their own life cycles to extend the feature set of an existing framework or application. Plugin objects inherently need to implement a publically supported interface (i.e. API). In addition to the API, each plugin object should be versioned and revision controlled (e.g. git) independent of the framework they are plugging into. For example, if the framework was at version `v1.2`, the plugin versions could be `v0.5`, or `v7.9`.

In addition to versions and revision control, its also highly recommended that you consider:

- Plugin life cycle management (i.e. install, upgrade, uninstall).
- Plugin discoverability for getting the correct feature when you need it.
- Plugin repositories for storing collections of relevant plugins.
- Standard packaging for easy plugin analysis and maintenance.

What all of this amounts to is that you should never design a plugin framework from scratch. Find something else that already provides this capability and integrate that into your application. This will not only increase the flexibility and power of your plugin management, but will also ease the level of effort required to get started with extended your framework or application.

In Javascript, I would say that you'd want to consider using the yarn or npm framework. For more localized environments, there are tools like yucc that can help with sharing plugins across projects.

In Python, the framework you want to use is `pip` and `setuptools`. If you've ever done any python package/distribution installs and creation, you'll be familiar with these tools. But have you ever thought of a package as a plugin?

## Entry Points

[Entry points](https://packaging.python.org/specifications/entry-points/) are the key to allowing a python package distribution act as a plugin for a larger framework. The entrypoint mechanism allows `pip` and `setuptools` to perform some book keeping on package installations that allows packages to group themselves into arbitrary categories that can later be iterated on.

The most common entry point category that is used is the `console_scripts` entrypoint. This is used to declare what callable function (or object) will act as the entrypoint for the CLI command given in the `setup()` call. When you see the `console_scripts` setting in `setup()` it may look something like:

```
  entry_points={
    'console_scripts': [
      'framework = framework.cli:main',
    ],
  },
```

In the above code, the call `main()` from `framework.cli` module is called when I execute `framework` from the command line. This is a convention defined by setuptools to allow python applications to have a more independent feel.

But how do you use entry points as plugins? `pkg_resources` is a module that is able to iterate on all of the entrypoints given a query. For example, if you wanted to query all of the `console_scripts` that were installed in your python environment, you could do something like the following:

```
import pkg_resources
for ep in pkg_resources.iter_entry_points(group='typeA'):
  print("{name} = {module_name}{attrs}".format(\
      name=ep.name,
      module_name=ep.module_name,
      attrs=ep.attrs))
```

## Implement A Framework With Plugins

Lets create our own framework with multiple plugins of a particular type. We'll call the framework, aptly, `framework` and the plugins will be `framework.typeA.plugin1` and `framework.typeA.plugin2`. Our framework will consist of a CLI command that executes a `run()` function from each plugin.

See official [Python Packaging](https://packaging.python.org) documentation for more information on generating python packages.

As a getting started quick, each python package distribution needs a setup.py and package folders. I usually setup my package folders so that they exist under a specific `src` directory. This is so that when the package is build, the `src` directory is at the same level as the autogenerated `build` and `dist` folders.

All python packages need a `__init__.py` file to be recognized as a python package. To allow these package namespaces to be reused, I also always include the following into any _empty_ package:

```
__path__ = __import__("pkgutil").extend_path(__path__, __name__)
```

Without this, you may find yourself getting namespace conflicts or missing module errors that make no sense.

### Framework Files

The directory structure of the minimal framework looks like:

```
framework/
├── setup.py
└── src
    └── framework
        ├── cli.py
        └── __init__.py
```

`setup.py` contains:

```
from setuptools import setup

setup(
    name="framework",
    version="0.0.1",
    description="Example of a Pythonic plugin pattern.",
    author="Vincent Agriesti",
    author_email="crazychenz@gmail.com",
    url="https://github.com/crazychenz",
    packages=[
        "framework",
    ],
    package_dir={"": "src"},
    install_requires=[
        "future",
        "pkg_resources",
    ],
    entry_points={
        'console_scripts': [
            'framework = framework.cli:main',
        ],
    },
)
```

`src/framework/__init__.py` contains:

```
__path__ = __import__("pkgutil").extend_path(__path__, __name__)
```

`src/framework/cli.py` contains:

```
import pkg_resources
import pprint

def main():
    print("Framework is running.")

    typeA_plugins = {}

    # Load each entrypoint of type "typeA" into typeA plugins and then
    # execute the assumed entry point of the plugin (i.e. run()).
    for ep in pkg_resources.iter_entry_points(group='typeA'):
        # Populate the typeA_plugins dictionary
        typeA_plugins[ep.module_name] = {
            'obj': ep.load(),
            'name': ep.name,
            'module_name': ep.module_name,
            'attrs': ep.attrs,
            'dist': ep.dist,
            'extras': ep.extras,
        }

        # Run the plugin entry point.
        typeA_plugins[ep.module_name]['obj']()

    print("Framework is now exiting.")
```

The _real work_ is done in the `cli.py` file. In our `setup.py`, we've declared that the `main()` in `cli.py` should be called when we run `framework` from the command line. In this `main()` call, we are registering all of the plugins that are installed with an entry point `typeA`. After each plugin in registered, we call the registered object. In our case, this equates to the `run()` call in each plugin.

### Plugin Files

The directory structure of a minimal plugin looks like:

```
typeA_plugin1
├── setup.py
└── src
    └── framework
        ├── __init__.py
        └── typeA
            ├── __init__.py
            └── plugin1
                └── __init__.py
```

`setup.py` contains:

```
from setuptools import setup

setup(
    name="framework.typeA.plugin1",
    version="0.0.1",
    description="Example of a Pythonic plugin pattern.",
    author="Vincent Agriesti",
    author_email="crazychenz@gmail.com",
    url="https://github.com/crazychenz",
    packages=[
        "framework",
        "framework.typeA",
        "framework.typeA.plugin1"
    ],
    package_dir={"": "src"},
    install_requires=[
        "future",
        "pkg_resources",
    ],
    entry_points={
        'typeA': [
            'plugin = framework.typeA.plugin1:run',
        ],
    },
)
```

`src/framework/__init__.py` and `src/framework/typeA/__init__.py` contain:

```
__path__ = __import__("pkgutil").extend_path(__path__, __name__)
```

`src/framework/typeA/plugin1/__init__.py` contains:

```
def run():
    print("framework.typeA.plugin1 starting")
    print("framework.typeA.plugin1 finishing")
```

As you might have noticed, there is only a little bit more meta data required for the plugin to be considered a plugin. For one, in the `setup.py`, we include the entry point for `typeA`:

```
entry_points={
  'typeA': [
    'plugin = framework.typeA.plugin1:run',
  ],
},
```

This means that in our `main()` call of framework, it'll see this plugin and run its `run()` call. I'm not going to repeat what I've just done to show that you can do the same thing multiple times, but if you simply copy the plugin folder to a new folder and change all instances of `plugin1` with `plugin2`, you'll see that they are indeed separately loadable plugins (of type `typeA`).

### Namespaces

In the above example, we've deliberately used namespaces to organize our plugins. This allows us to visually recognize what package distributions belong to which plugin APIs. For instance:

- We know our framework, the thing declaring the API, is called `framework`.
- One of the APIs declared by `framework` is `typeA`, therefore we have the namespace `framework.typeA`.
- Finally, we've implmented a python called `typeA_plugin1` that implements `typeA` API for the `framework` framework, therefore it lives in the namespace `framework.typeA.plugin1`.

These conventions are purely optional, but this particular convention makes the most sense to me and I've found it to be particulary timeless because of how each subsequent depth depends on the parent. But, perhaps it could be considered more prudent to have a namespace like `framework.plugins.typeA.plugin1`? It really all depends on the needs of the application and the team implementing it.

## Developing In Place

I don't want to go into deep detail on `pip`, but when developing package distributions, it can be incredibly useful to use the `-e` argument. The `-e` argument allows us to install the python package distribution from its source directory so that we can work on it while its installed. For example, when used with virtualenv, one way to setup the environment described above would be to do something like the following:

```
$ virtualenv -p python2 venv
$ source ./venv/bin/activate
(venv) $ pip install -U -e framework
(venv) $ pip install -U -e typeA_plugin1
(venv) $ pip install -U -e typeA_plugin2
```

**Warning:** Please be aware that any changes to `setup.py` will require the package to be reinstalled. This is because the install command is what triggers setuptools to re-read and register the entry points (and all other metadata in the `setup()` call).

Once everything is installed, you can simply run the `framework` command.

```
(venv) $ framework
Framework is running.
framework.typeA.plugin1 starting
framework.typeA.plugin1 finishing
framework.typeA.plugin2 starting
framework.typeA.plugin2 finishing
Framework is now exiting.
```

## Building For Release

Put simply, from each python package distribution's root folder (i.e. the folder with `setup.py`) run the following:

```
python ./setup.py sdist
```

This will create a source distribution that you can release for others to install with pip. For example, if we had `pkgs/framework-0.0.1.tar.gz` we can install with pip by running:

```
$ virtualenv -p python2 venv
$ source ./venv/bin/activate
(venv) $ pip install ./pkgs/framework-0.0.1.tar.gz
```

Once big reason to always use virtualenv instead of the system python environment is so that we can encapsulate all of the framework, plugins, and dependencies for _snapshots_ of the environment. Once you have everything installed, you can get a snapshot of what is installed with `pip freeze`. This will give you something that you can drop into a `requirements.txt`. _Note: You'll want to remove all inplace installation before doing this._

```
(venv) $ pip freeze > requirements.txt
```

You can additionally compile all of the dependencies that pip fetches by running a `pip download` with the previously fetched `requirements.txt`:

```
(venv) $ mkdir pkgs
(venv) $ pip download -r requirements.txt -d pkgs
```

This command should download all of the dependencies noted in `requirements.txt` into a `pkgs` folder. Then you can transfer the `requirements.txt` and `pkgs` folder to any other host with virtualenv and compatible python version to install with something like:

```
$ virtualenv -p python2 venv
$ source ./venv/bin/activate
(venv) $ pip install -r requirements.txt -f ./pkgs
```

### Dedicated Repositories

Some quick notes on repositories:

- If you want your plugins and framework to be available on the internet, [PyPi](https://pypi.org/) is probably the place to go.
- If you want your plugins to be available similar to PyPi, but available on a private server with whatever policies you dictate, I suggest taking a look at [devpi](https://pypi.org/project/devpi/). One of my favorite features of devpi is its ability to layer repositories so you can give your packages priority but allow PyPi to back everything not locally stored. Its also a great python package caching service.
- If your framework is implemented with a mix of python and other languages, I suggest looking at [Artifactory](https://jfrog.com/artifactory) and its Conan interface. Conan is built to package compiled languages and Artifactory can act as a Conan and Pip repository, acting as a single service for all your package and plugin distribution needs.

## Conclusion

Using `pip` and `setuptools`, while a little more noisey, is a much better way to enable plugins and extensibility for any python applications or frameworks that need such a mechanism. Avoid using home grown systems like `exec()` or `__import__` unless you've ruled out the availability of the former options.

Always use virtualenv to prevent namespace collision, version collision, and to encapsulate your environment for easy exportation to end users for offline installs or testing.

I also wanted to mention that python has some other official recommendations for [plugin patterns](https://packaging.python.org/guides/creating-and-discovering-plugins/).
