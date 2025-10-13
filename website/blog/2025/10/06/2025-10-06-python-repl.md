---
slug: 2025-10-06-python-repl
title: "Interactive Consoles/REPLs of Python"
draft: false
---

Recently I've been developing some debugging utilities in python. Due to a number of desires to have multiple ways of interfacing with these tools, I've gone down a number of rabbit holes in how the internals of Python work. One such rabbit how is in regards to the interactive console or REPL. Note: REPL is a "read-eval_exec-print loop". I use console and REPL interchangeably.

As most know, when you start python without any parameters it drops into a interactive console:

```
Python 3.13.5 (main, Jun 25 2025, 18:55:22) [GCC 14.2.0] on linux
Type "help", "copyright", "credits" or "license" for more information.
>>>
```

When you type a (single-line) command in the terminal, it completes.

```
>>> print("text here")
text here
>>>
```

Now, the `print("text here")` code above is considered a complete block (or a complete expression). Python was able to confidently assume that your command was complete and it could be run. But what if we're doing a multi-line function?

```
>>> def func():
...     print("first")
...     print("second")
...
```

The console will change the prompt to indicate that there is a continuance of the current python code block. The console will not run until it can assume that you are done with your code block. This assumption is based on the empty line at the end. Ok, great, but what about functions that have newlines in the middle of them? For example, what happens if you copy the following into an interactive python console? For example:

```
def func():
    print("first")

    print("second")

```

Magic!

<!-- truncate -->

## Different Consoles

Let's back up a bit. There are at least 2 different "interactive consoles" that I know about in CPython. There is also the python debugger console and its variants, but as an actual debugger, it falls outside the scope of this article.

- The first is the `python` interactive console you get when you don't give the command line python any parameters.

- Another is one you'll often find in Python documentation itself. You can easily launch it from anywhere in your code with:

  ```python
  #!/usr/bin/env python3
  import code
  code.interact()
  ```

Before today, I assumed these were the same thing ... _they are not_. 

> ### A Note on GNU readline
> 
> To compound the issue, each console has fallbacks for when GNU readline is not available. And each of these fallbacks have different behaviors themselves. For the sake of simplicity, I'm (generally) assuming all systems I use will have GNU readline support.
>  
> In brief, without GNU readline, the terminal (tty/pty) will likely be line buffered and fully echoed (aka "cooked"). This means that if you paste multiple lines of code, it'll be dumped directly to the screen before the code ever gets the chance to process it line by line. GNU readline (and other raw tty/pty solutions) will configure the terminal to have more controlled behaviors that reads 1 key press at a time.

A simple example of code that I wanted console to process:

```
def func():
    print("first")

    print("second")
```

Ok, so lets copy the above code in `code.interact()` and hit _Enter_ key:

```
(InteractiveConsole)
>>> def func():
...     print("first")
...
>>>     print("second")
  File "<console>", line 1
    print("second")
IndentationError: unexpected indent
>>>
```

Hmm, I guess we can't have new lines. But what about the `python` console?

```
>>> def func():
...     print("first")
...
...     print("second")
...
>>>
```

It looks fine!

## My Problem

The issue with the difference between these two is that I wanted a simple interface that I could drop into to do some variable inspection for a utility I'm writing. I initially expected both consoles to behave the same, but when they didn't I started throwing many rocks at it to make it behave the way I wanted. For starters, I asked ChatGPT. The LLM was completely useless in helping me actually understand what I was seeing and why. In fact, I initially looked at [`Lib/code.py`](https://github.com/python/cpython/blob/3.13/Lib/code.py) as a source or truth. In there you'll see a loop that has the following:

```python
while True:
    try:
        if more:
            prompt = sys.ps2
        else:
            prompt = sys.ps1
        try:
            line = self.raw_input(prompt)  # calls input()
        except EOFError:
            self.write("\n")
            break
        else:
            more = self.push(line)
    except KeyboardInterrupt:
        self.write("\nKeyboardInterrupt\n")
        self.resetbuffer()
        more = 0
    except SystemExit as e:
        if self.local_exit:
            self.write("\n")
            break
        else:
            raise e
```

This loop clearly shows that its pulling output from what I believed to be the builtin input() function. This function will read line buffered input from STDIN. This is exactly what I wanted except that when you paste a function, it'll dump the clip board and _then_ process each of the lines.

Example Code:

```python
import code

console = code.InteractiveConsole()
more = False
while True:
    try:
        if more:
            prompt = '... '
        else:
            prompt = '>>> '

        try:
            line = input(prompt)
        except EOFError:
            break
        else:
            more = console.push(line)
    except KeyboardInterrupt:
        break
    except SystemExit:
        break
    except Exception:
        raise
```

Example Output:

```
>>> def func():
    print("first")

    print("second")... ... >>>
```

This is really annoying because I wanted my paste to be treated as if they are keypresses. In that case, you'd expect input() to return when it sees a '\n'. For whatever reason, this is not the default behavior of terminals.

Now, if you look a little further down in the `Lib/code.py` file, you'll find the following:

```python
console = InteractiveConsole(local, local_exit=local_exit)
if readfunc is not None:
    console.raw_input = readfunc
else:
    try:
        import readline
    except ImportError:
        pass
console.interact(banner, exitmsg)
```

The code attempts to load GNU readline. _Ok, we'll do that!_ (The reality here is before I noticed the `import readline`, I spent a _long_ time looking into raw terminals with echo turned off, async vs sync handling, reading individual characters and inferring based on amount of content read from the buffer at once and it all felt very bad. ... essentially rewriting what GNU readline does itself!)

Example Code:

```python
import code
import readline

console = code.InteractiveConsole()
more = False
while True:
    try:
        if more:
            prompt = '... '
        else:
            prompt = '>>> '

        try:
            line = input(prompt)
        except EOFError:
            break
        else:
            more = console.push(line)
    except KeyboardInterrupt:
        break
    except SystemExit:
        break
    except Exception:
        raise
```

Example Output:

```
>>> def func():
...     print("first")
...
>>>     print("second")
```

Much better than without GNU readline, but it is still assuming that my function ends with the new line. What is `python` console doing differently than `import code` console?! For this, we'll need to look at the cpython source.

## Digging Into CPython

Note: I'm using v3.13 at the time of this writing.

```
git clone https://github.com/python/cpython.git
```

Some quick searching led me to tracing a couple call stacks through `Python/pythonrun.c`:

- **`PyRun_InteractiveLoop()`**
  - `PyRun_InteractiveLoopFlags()`
    - `_PyRun_InteractiveLoopObject()`
      - `PyRun_InteractiveOneObjectEx()`
        - `pyrun_one_parse_ast()`
          - `_PyParser_InteractiveASTFromFile`
            - `_PyPegen_run_parser_from_file_pointer`
              - `_PyTokenizer_FromFile`
                - `tok->underflow` set to `tok_underflow_interactive`
                - _See `PyOS_Readline`_

- **Built In "input" set to builtin_input**
  - `builtin_input` in Python/clinic/bltinmodule.c.h
    - `builtin_input_impl` in Python/bltinmodule.c
    - _See `PyOS_Readline`_

- **`PyOS_Readline` in myreadline.c**
  - `PyOS_ReadlineFunctionPointer` in Modules/readline.c
    - _set to `call_readline` in `PyInit_readline()`_
    - _See `PyOS_StdioReadline` if `PyOS_ReadlineFunctionPointer` NULL._
    - `call_readline` in Modules/readline.c
      - `readline_until_enter_or_signal` in Modules/readline.c

- **Note:** `PyOS_ReadlineFunctionPointer == NULL` is Uncommon
  - `PyOS_StdioReadline` in myreadline.c
    - `my_fgets` in myreadline.c

Right ... so the point here is that (via PyInit_readline), both the built in `input()` and the `python` interactive loop work from `readline_until_enter_or_signal()` in Modules/readline.c to fetch data from STDIN. In this code, here is the core loop (assuming no GUI or TK):

```c
static char *completed_input_string;

static void
rlhandler(char *text)
{
    completed_input_string = text;
    rl_callback_handler_remove();
}

static char *
readline_until_enter_or_signal(const char *prompt, int *signal)
{
    /* ... */
    char * not_done_reading = "";
    rl_callback_handler_install (prompt, rlhandler); // <---- GNU Callback At EOL
    FD_ZERO(&selectset);

    completed_input_string = not_done_reading;
    while (completed_input_string == not_done_reading) {
        int has_input = 0, err = 0;

        while (!has_input)
        {
            /* ... */
            FD_SET(fileno(rl_instream), &selectset);
            has_input = select(fileno(rl_instream) + 1, &selectset, // <---- blocks
                                NULL, NULL, NULL);
            err = errno;
        }

        if (has_input > 0) {
            rl_callback_read_char(); // <---- GNU Readline Call (non-blocking)
        }
        /* ... */
    }

    return completed_input_string;
}
```

This might be a bit hard to follow, but as long as there is input in the STDIN buffer, the code should pass through the `select()` and run `rl_callback_read_char()`. `rl_callback_read_char()` will populate an internal readline buffer until it encounters a newline. (Note: This readline buffer always ends with NULL or `'\0'`.) Once it sees the newline, it calls the registered callback `rlhandler()`. In the above code, the `rlhandler` callback only sets the `completed_input_string` to the incoming buffer pointer and then resumes after the call to `rl_callback_read_char()`. 

Subtly, the loop `while (completed_input_string == not_done_reading)` ignores empty strings, which is exactly what you get from a line that is nothing but a NEWLINE with more data to follow. Therefore it keeps on reading past empty lines until there is nothing more to read. When there is nothing left to read, the callback receives a NULL, thereby setting `completed_input_string` to NULL instead of an empty string (`""`) and breaks the loop. Popping the call stack in the interactive loop case subsequently runs the parser and tokenization over the input data.

In summary, _unindented_ newlines that are not at the end of the data are ignored by CPython's readline wrapper. (I believe there might be some empty line normalization that happens in the call stack as well, but I didn't go down that path.)

## A Python Solution

I'm content with assuming that all of my usecases will have GNU readline available, so I'm not considering the non-GNU-readline use case at this time. I originally intended on mimicing the above behavior (exactly) in Python, except GNU-readline doesn't really expose the same interface so its gets kind of weird. (I refuse to use ctypes for this.) For the record, I did come up with the following:

```python
#!/usr/bin/env python3

import readline
import sys
import select

while True:

    completed_input_string = ""
    not_done_reading = ""

    while completed_input_string == not_done_reading:
        completed_input_string = input("> ")
```

As simple as that was, I've had a lot of issues integrating `code.InteractiveConsole()` into that code for several reasons. We want to be able to paste whole pastes, but we can't only use `code.InteractiveConsole().push(line)` to evaluate whether we use `>>> ` or `... `. The actual approach I used is:

- First line is always `>>>`.
- If there is no more data to read after first line, the line is immediately evaluated.
- If there is more data to read from stdin after the `input()` returns (via non-blocking `select()`), we assume all following lines will be `...`. 
- Once we do have all input, the input is not run until we have a lone empty line. This creates the oppurtunity to do many multi-line pastes that run at the same time.

```python
#!/usr/bin/env python3

import readline
import sys
import select
import code

console = code.InteractiveConsole()
ps1 = ">>> "
ps2 = "... "
prompt = ps1

try:
    # REPL Loop
    while True:

        try:

            final_buffer = []

            # Atomic Input Loop (e.g. Multiline Paste)
            while True:
                buffer = []

                # Line Input
                while True:
                    completed_input_string = input(prompt)
                    buffer.append(completed_input_string)
                    has_input, _, _ = select.select([sys.stdin], [], [], 0.01)
                    if not has_input:
                        break
                    prompt = ps2

                # Move current buffer to final_buffer to detect lone newline.
                final_buffer.extend(x for x in buffer if x != '')

                # Continue loop if buffer is no single statement or newline.
                if len(buffer) > 1:
                    continue
                break

            final_buffer.append('')
            final_src = '\n'.join(final_buffer)
            more = console.runsource(final_src, symbol="exec")  # <---- No longer push()
            prompt = ps2 if more else ps1

        except KeyboardInterrupt:
            prompt = ps1
            print("\nKeyboardInterrupt")

except EOFError:
    print()
    pass
```

One issue that caught me off guard was that `code.InteractiveConsole().push()` doesn't like to have multiple top-level statements in the same push. Under the hood, the `push()` call is calling `runsource(symbol="single")`. Therefore, I changed the `push()` call to an explicit `runsource(symbol="exec")`. There really is no reason to use `push()` at all anymore since we do our out buffer management anyway.

## Making It Async

As is usually the case, we want an async version of everything. The following is an example of making the REPL await-able. That said, its not _really_ async code. The readline `input()` is run from another thread (outside of the event loop). This is kind of preferred because I do like the idea of things happening while I'm providing user input. But by the design of simple REPLs, you don't get any updates from STDOUT/STDERR until you hit enter on the `input()`. 

Also, I'd like to note that the `select()` is a syscall and not considered _async_. This is not an issue, because when `select()` is run with a zero timeout it is non-blocking.

Finally, the most synchronous aspect of the code below is the fact that `exec()` and therefore `runsource()` is blocking. There are some use cases where we can make it asynchronous and I'm currently working on that for another article. For now, know that when running code in the following REPL, it will halt the async event loop until after `exec()` returns.

```python
#!/usr/bin/env python3
import readline
import asyncio
import sys
import code
import select

console = code.InteractiveConsole()
ps1 = ">>> "
ps2 = "... "
prompt = ps1


async def async_input(prompt: str) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, input, prompt)


async def repl():
    global prompt
    global ps1
    global ps2

    try:
        # REPL Loop
        while True:

            try:

                final_buffer = []

                # Atomic Input Loop (e.g. Multiline Paste)
                while True:
                    buffer = []

                    # Ensure event loop has time to execute.
                    await asyncio.sleep(0)

                    # Line Input
                    while True:
                        completed_input_string = await async_input(prompt)
                        buffer.append(completed_input_string)
                        
                        has_input, _, _ = select.select([sys.stdin], [], [], 0)
                        if not has_input:
                            break
                        prompt = ps2

                    # Move current buffer to final_buffer to detect lone newline.
                    final_buffer.extend(x for x in buffer if x != '')

                    # Continue loop if buffer is no single statement or newline.
                    if len(buffer) > 1:
                        continue
                    break

                final_buffer.append('')
                final_src = '\n'.join(final_buffer)
                # !!! This is synchronous. !!!
                more = console.runsource(final_src, symbol="exec")  # <---- No longer push()
                prompt = ps2 if more else ps1

                # Ensure event loop has time to execute.
                await asyncio.sleep(0)

            except KeyboardInterrupt:
                prompt = ps1
                print("\nKeyboardInterrupt")

    except EOFError:
        print()
        pass


if __name__ == "__main__":
    asyncio.run(repl())
```

Right, so from the crappy `code.interact()` we now have a much better REPL that behaves much closer to the actual `python3` interactive REPL (but in pure python). From this point, we can do lots of fun things like break into this REPL in our code for environment inspection and on-demand code execution. 

## But Can It Run Async Code?

More to follow in another write up...

## Comments

<Comments />




