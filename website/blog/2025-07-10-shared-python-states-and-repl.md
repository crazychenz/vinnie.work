---
slug: shared-python-states-and-repl
title: "Shared Python States & REPL"
draft: false
---

## Overview

Code snippet of 3 python files:

- EnhancedConsole - a simple extension of InteractiveConsole for hosting REPL in server and client code.
- Server - A simple example of using `multiprocessing.managers` over Unix sockets and running with a REPL.
- Client - A simple exmaple of using `multiprocessing.managers` (as a client) over Unix sockers and running with a REPL.

<!-- truncate -->

## The Idea

Curiousity into how jupyter/ipython does their cell management led me to these code snippets. Ideally, I would have developed a second client that used `blessed` TUI library to _render_ state using the multiprocessing.managers synchronization. After toying around with it, I determined that it really doesn't fit any of my current use cases.

## The Code

### `console.py`

```python
import os
import sys
from code import InteractiveConsole

class EnhancedConsole(InteractiveConsole):
    def __init__(self, locals=None, filename="<console>", histfile=None):
        super().__init__(locals, filename)
        self.init_readline(histfile)

    def interact(self, banner=None):
        original = [getattr(sys, 'ps1', '>>> '), getattr(sys, 'ps2', '... ')]
        try:
            sys.ps1 = "MY_PROMPT >>> "
            sys.ps2 = "MY_PROMPT ... "
            super().interact(banner)
        finally:
            (sys.ps1, sys.ps2) = original

    def init_readline(self, histfile=None):
        try:
            # Note: Overloads builtins.input and friends
            import readline
            import rlcompleter

            # Tab completion
            readline.set_completer(rlcompleter.Completer(self.locals).complete)
            readline.parse_and_bind("tab: complete")

            # Setup history
            if histfile is None:
                histfile = os.path.expanduser("~/.python_history")
            try:
                readline.read_history_file(histfile)
            except FileNotFoundError:
                pass  # No history file yet
            readline.set_history_length(1000)
            import atexit
            atexit.register(readline.write_history_file, histfile)

            # Key bindings
            readline.parse_and_bind('"\e[A": history-search-backward')
            readline.parse_and_bind('"\e[B": history-search-forward')
            readline.parse_and_bind('"\e[C": forward-char')
            readline.parse_and_bind('"\e[D": backward-char')

        except ImportError:
            print("Readline required but not available.")
```

### `server.py`

```python
#!/usr/bin/env python3

import os
from multiprocessing.managers import BaseManager
from multiprocessing import Process
import time
from console import EnhancedConsole
import threading

class Counter:
    def __init__(self):
        self.value = 0

    def increment(self):
        self.value += 1
        return self.value

    def decrement(self):
        self.value -= 1
        return self.value

    def get_value(self):
        return self.value

    def set_value(self, value):
        self.value = value
        return self.value

    def reset(self):
        """Reset the counter to 0"""
        self.value = 0
        return self.value

class CounterManager(BaseManager): pass

def run_server(manager, server):
    server.serve_forever()

def start_server():
    socket_path = '/tmp/counter_server.sock'

    if os.path.exists(socket_path):
        os.unlink(socket_path)

    counter = Counter()

    CounterManager.register('Counter', callable=lambda: counter)

    manager = CounterManager(address=socket_path, authkey=b'counter_secret')
    server = manager.get_server()
    threading.Thread(target=run_server, args=(manager,server,), daemon=True).start()

    print(f"Starting server on Unix socket: {socket_path}")
    print("Press Ctrl+D to stop the server")

    EnhancedConsole(locals=locals()).interact(banner="Go go REPL.")
    print("Shutting down server...")

if __name__ == '__main__':
    start_server()
```

### `client.py`

```python
#!/usr/bin/env python3

import os
import sys
from multiprocessing.managers import BaseManager
from console import EnhancedConsole

class CounterManager(managers.BaseManager): pass

def main():
    socket_path = '/tmp/counter_server.sock'

    CounterManager.register('Counter')

    try:
        # Connect to the server
        manager = CounterManager(address=socket_path, authkey=b'counter_secret')
        manager.connect()
        print(f"Connected to server at: {socket_path}")

        counter = manager.Counter()
        local_vars = {"manager": manager, "counter": counter}

        console = EnhancedConsole(locals=local_vars)
        console.interact(banner="Go go REPL.")

    except ConnectionRefusedError:
        print(f"Could not connect to server at {socket_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()
```



## Comments

<Comments />



