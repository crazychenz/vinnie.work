---
slug: 2025-10-13-python-repl
title: "await-able Python REPL"
draft: false
---

In [Interactive Consoles/REPLs of Python](https://vinnie.work/blog/2025-10-06-python-repl), I wrote about some pains with dropping into a _useable_ REPL from anywhere in my code. Hoping `code.interact()` would just work failed me, so I started down the path of writing a simple REPL that would allow me to copy/paste arbitrary python code (including code with multi-line pastes).

I even went as far as developing an `await`-able version, but it was really only a synchronous function masquerading as an `async` function. And to make matters worse, we still could not `await` in the REPL itself.

All things to fix now!

<!-- truncate -->

## Where Were We?

In the previous article, I left it at the following bit of code:

<details>
<summary>Await-able Synchronous REPL Code</summary>

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

</details>

Problems Include:
- The code above doesn't actually handle completely empty input. Hitting enter on `>>>` will create `...` until you add a python statement block or expression.
- The code above will allow defining an `async def` function, but if you attempt to `await` on any coroutine, it'll dead lock the event loop because eval and exec won't finish until await returns and the coroutine can't run until eval and exec yield (which they can't do).
- The code above doesn't handle single line execution correctly. In a REPL, we're striving for usability so we want single line expressions (not statements) to automatically output (i.e. print) non-`None` returns.

## Detecting Python Expression

OK, lets start with processing a single line of Python as an expression. That seems easy enough, how do we do that? ... Naively, you might think that you can look for an assignment symbol (`=`) or a scope keyword like `def` in the input. But this gets a bit unweildy if you attempt to find all the edge cases. You'll eventually find yourself implementing a minimal Python tokenizer. Turns out, Python provides a tokenizer to the developer. Consider the following block of code:

```python
def run_single_line(source_code, namespace):

    try:
        tree = ast.parse(source_code, mode="exec")
    except SyntaxError as e:
        print(f"SyntaxError: {e}")
        return None

    if all(isinstance(node, ast.Expr) for node in tree.body):
        ret = eval(source_code, namespace, namespace)
    else:
        exec(source_code, namespace, namespace)

```

It uses `ast.parse` to tokenize and parse the given python source code into an abstract syntax tree so we can programatically analyze it for indications of it being an expression or statement. The line `all(isinstance(node, ast.Expr) for node in tree.body)` is a clean pythonic way to determine if the top level of the given source code line is an expression without doing any manual parsing of the string itself.

Lets do better and make the evaluation print when its not `None`:

```python
def run_single_line(source_code, namespace):

    try:
        tree = ast.parse(source_code, mode="exec")
    except SyntaxError as e:
        print(f"SyntaxError: {e}")
        return None

    if is_ast_expression(tree):
        ret = eval(source_code, namespace, namespace)
        if ret is not None:                             # <<----
            print(ret)                                  # <<----
    else:
        exec(source_code, namespace, namespace)
```

Ok great, now we need to intergrate this ability to run a single line of code into our REPL:

```python
async def async_repl(namespace=None):
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

                    if len(final_buffer) == 0:                                     # <<----
                        # Ignore empty input.                                      # <<----
                        continue                                                   # <<----

                    # Continue loop if buffer is not single statement or newline.  # <<----
                    # (i.e. extra Enter after multi-line paste.)                   # <<----
                    if len(buffer) > 1:                                            # <<----
                        continue                                                   # <<----

                    # Note: Assume complete and good syntax below.                 # <<----
                    break                                                          # <<----

                final_src = '\n'.join([*final_buffer, ''])                         # <<----
                if len(final_src) > 0:                                             # <<----
                    if len(final_buffer) == 1:                                     # <<----
                        await run_single_line(final_buffer[0], namespace)          # <<----
                    else:                                                          # <<----
                        more = console.runsource(final_src, symbol="exec")
                        prompt = ps2 if more else ps1
                
                # Ensure event loop has time to execute.
                await asyncio.sleep(0)

            except KeyboardInterrupt:
                prompt = ps1
                print("\nKeyboardInterrupt")
            # Possibly returned by ast or runsource                                # <<----
            except SyntaxError as e:                                               # <<----
                print(f"\nSyntaxError: {e}")                                       # <<----

    except EOFError:
        print()
        pass
```

We now have a REPL that can determine:

- Single line or multi-line
- Expression or Statement

But what we really need is a way to determine if the code is an await statement or not.

## Implementing Await-ability Into REPL

As mentioned several times already, we have a chicken and egg problem with await. We can't run await inside a `exec` or `eval` because it will deadlock the event loop (without additional pre-emptive threading complexities). 

### Finding The Await

To take this one step at a time, lets look back at the AST to determine when this matters. Before we were checking if a piece of code was a Python expression. Now we want to know if the source code contains any `await` calls. Remember, _any_ `await` whether its on a simple call, a parameter, or a pre-existing coroutine object can not be made at the top level of python. They must always be wrapped by an `async def` scope.

Bad at top-level:

```python
async def my_coroutine():           # <<--- OK by itself.
    await another_call()            # <<--- OK as definition code.
await my_coroutine()                # <<--- Throws exception.
my_sync_call(await my_parameter())  # <<--- Throws exception.
```

I refer to the bottom lines (in the code above) as "naked awaits". They are exposed out there all by themselves (hint: unwrapped). Lets see the following code for how to detect them:

```python
def is_ast_naked_await(tree) -> bool:
    # Set parent for each child
    for parent in ast.walk(tree):
        for child in ast.iter_child_nodes(parent):
            child.parent = parent

    def inside_async_function(node):
        # Walk up ancestry tree to see if await is wrapped.
        while node:
            if isinstance(node, ast.AsyncFunctionDef):
                return True
            node = getattr(node, "parent", None)
        return False

    # Check if all awaits are wrapped or not.
    for node in ast.walk(tree):
        if isinstance(node, ast.Await) and not inside_async_function(node):
            return True
    return False
```

In the case where we were looking for an expression, we only needed to check the top level of the tree. Here, because we need to check all the parameters and calls, we need to walk the entire tree. The Python AST does include a `ast.Await` object to look for, but we only care about `ast.Await` objects in the tree that are not beneath an `async def` or `ast.AsyncFunctionDef`. The `async def` is what makes an `await` wrapped, in contrast to being unwrapped or naked.

### Finding Complete Await Call

Now that we have `is_ast_naked_await` to tell us when there is an `await`, what do we do with this information? One of the things to consider is that we have no way to determine if a code block is complete if it has an `await` call in it. We don't want to prematurely start running the wrapped code if it isn't complete, therefore we do our own compilation with a minimal wrap to determine its completeness independent of the `code.runsource()` call:

```python
def async_def_complete(final_buffer):
    # Check for completeness
    async_wrap = ['    ' + x for x in final_buffer]
    async_wrap.insert(0, 'async def __thridparty_sandbox_asyncdef():')
    final_src = '\n'.join([*async_wrap, ''])
    complete = False
    if len(final_src) > 0:
        complete = codeop.compile_command(final_src, "<string>", "exec")
    return complete
```

In the above code, we:

- Indent the given buffer of code so it fits snuggly into our new wrapper function.
- Prepend the source code buffer with a function header that has a name that includes the _namespace_ of our package to mitigate label collisions in the python namespace. (Note: You can also spice up the name with a random bit of label valid characters and further mitigate by checking the scope before definition. I don't care that much.)

`async_def_complete()` will raise a `SyntaxError` exception on bad code, but return `False` in the event that a code block is deemed incomplete. We do need to keep in mind though that a buffer from STDIN (i.e. a multi-line paste) takes precedence for determining if the code is compelete. Once we have completely consumed the buffer, we'll use `async_def_complete` to determine if a function is complete or possibly needs more lines to paste or manually fill in.

### Running The Await Call

To recap, we now know if there is a naked `await` and we know when the code itself is complete enough to run. How do we **run** asynchrounous code from a synchronous call like `exec` and `eval`.

When I referred to the internets, most if not all responses were "use `asyncio.run_coroutine_threadsafe()`". No good! That'll run the code in the completely wrong context. Remember, I want to run code to inspect variables in **this** thread, not some other thread that doesn't know what the current state is. Further more, even if I got a snapshot of the target threads variables from another thread, I can't mutate them and any cross threading mutations wouldn't be threadsafe without locks ... and then we're into the conversation about "Why am I even doing async programming?!" Also, clever developers might be thinking ... just use a database, why not shared memory, and so forth. No thank you. We can do better!

As discussed, naked `await` calls are completely find if they are wrapped. But if we wrap them, they may not have access to the same scope that we'd want them to have. Luckily, Python allows us to import variables from out of scope with `global`. Some might think, "but I don't want to always have something in global", and I agree. The difference here is that we're running our _wrap_ code in `exec` and therefore in a scope of our choosing. We do this by passing whatever namespace we want to the `exec` call. 

Let's see the wrapping in practice:

```python
async def async_wrap(source_code, namespace):

    # Wrapper header.
    wrapped_source = [
        'import asyncio as __thirdparty_sandbox_asyncio',
        'async def __thirdparty_sandbox_async_def():'
    ]

    # Expose all the global variables to function.
    for key in namespace:
        if is_valid_python_identifier(key):
            wrapped_source.append(f'    global {key}')

    # If its an expression, save the result.
    if is_expr:
        wrapped_source.append(f"    __thirdparty_sandbox_ret = {source_code}")
    else:
        # TODO: Check for (premature) return or yield in source_code?
        wrapped_source.append(f"    {source_code}")

    # Update globals() with any local assignments.
    wrapped_source.append('    globals().update(locals())')

    if is_expr:
        wrapped_source.append('    return __thirdparty_sandbox_ret')
    
    task_launcher = [
        '__thirdparty_sandbox_task = ',
        '__thirdparty_sandbox_asyncio.get_running_loop().',
        'create_task(__thirdparty_sandbox_async_def())',
    ]
    wrapped_source.append(''.join(task_launcher))

    # Run the function definition in user given namespace (e.g. globals()).
    exec('\n'.join(wrapped_source), namespace, namespace)

    # Spin the event loop until the task is complete.
    while not namespace['__thirdparty_sandbox_task'].done():
        await asyncio.sleep(0.01)
    ret = namespace['__thirdparty_sandbox_task'].result()

    # If original source was an expression, print it.
    if is_expr and ret is not None:
        print(ret)

    # Wiping created symbols from namespace
    namespace.pop('__thirdparty_sandbox_async_def', None)
    namespace.pop('__thirdparty_sandbox_task', None)

```

Walking through this a bit:

- First we start our wrap code with an import of `asyncio`, but we alias it with a _namespaced_ label to mitigate label collision in the scope. We don't want to assume that the global scope of our REPL has imported asyncio and if they have, we can't assume they've used the label `asyncio`, so we grab our own instance.
- Like we did in `async_def_complete()`, we create a function header that also has a _namespaced_ label to mitigate label collision in the scope.
- Within the newly defined `async def` function, we loop through all labels in the current namespace scope (e.g. `globals()`) and define any of the keywords that are python label safe as `global`. Python label safe is important here because a global namespace dictionary can have keys that have special characters or non-printable characters. Yuck!
- If the target source code is an expression, we convert it into an assignment statement so the result can be captured and returned, otherwise its inserted into the wrapper as-is.
- If the source code modified any local variables, we make sure those are pushed into globals with `globals().update(locals())`. Yes, nasty, but it works.
- After the wrapper is complete, we manually create an `asyncio.Task` object and assign it to a variable in the global scope.

Once the wrapper and the task creation code has been built, we execute it. At this point, in our `namespace` defined scope, we have added a function, created a coroutine, and assigned that coroutine to a `Task` object. BUT, the code itself has not executed because we haven't yielded to the event loop to run the code. Remember, `exec` is blocking and we've run no `await` since starting this wrap operation. The good news is that `exec` did return because it itself did not depend on an event loop cycle to return!

The next thing we do is iteratively yield to the event loop until we manually detect that our task is complete. This is sort of simulating what an `await` does itself:

```python
# Spin the event loop until the task is complete.
while not namespace['__thirdparty_sandbox_task'].done():
    await asyncio.sleep(0.01)
ret = namespace['__thirdparty_sandbox_task'].result()
```

Now that we have the result of our `await` call in `ret`, we simply determine if its a non-`None` expression to be printed or not. If the code started as a statement, any relavant assignments should have occured and will be in the given namespace.

Finally, we remove the temporary function and task object from the namespace to prevent unwanted artifacts from showing up.

In summary, we now know when we have a naked `await`. We know when we have a complete `await` block to be processed. We can wrap the `await` and actually run it to completion after defining the scope with `exec`. Time to put it all together...


## Defining An Async Repl

<details>
<summary>Code for Async REPL with `await` Support</summary>

```python
#!/usr/bin/env python3

import readline
import asyncio
import sys
import code
import select
import keyword
import re
import ast
import codeop
import os
import json
import io
import contextlib
import traceback


identifier_re = re.compile(r'^[A-Za-z_][A-Za-z0-9_]*$')

console = code.InteractiveConsole(self.namespace)
ps1 = ">>> "
ps2 = "... "
prompt = ps1


def is_ast_naked_await(tree) -> bool:
    # Set parent for each child
    for parent in ast.walk(tree):
        for child in ast.iter_child_nodes(parent):
            child.parent = parent

    def inside_async_function(node):
        # Walk up ancestry tree to see if await is wrapped.
        while node:
            if isinstance(node, ast.AsyncFunctionDef):
                return True
            node = getattr(node, "parent", None)
        return False

    # Check if all awaits are wrapped or not.
    for node in ast.walk(tree):
        if isinstance(node, ast.Await) and not inside_async_function(node):
            return True
    return False


def is_ast_expression(tree) -> bool:

    if not tree.body:
        # Empty string is not an expression
        return False

    return all(isinstance(node, ast.Expr) for node in tree.body)


def is_valid_python_identifier(key) -> bool:
    return (
        isinstance(key, str) and
        identifier_re.match(key) is not None and
        not keyword.iskeyword(key)
    )


def blocking_run_single_line(source_code, namespace):

    try:
        tree = ast.parse(source_code, mode="exec")
    except SyntaxError as e:
        print(f"SyntaxError: {e}")
        return None

    if not is_ast_naked_await(tree):
        # No wrapping required.
        if is_ast_expression(tree):
            ret = eval(source_code, namespace, namespace)
            if ret is not None:
                print(ret)
        else:
            exec(source_code, namespace, namespace)
    else:
        # Need to wrap await.
        raise NotImplementedError("Calling await from sync REPL not supported.")


# Note: This function needs to stay in global scope.
async def async_run_single_line(source_code, namespace):

    try:
        tree = ast.parse(source_code, mode="exec")
    except SyntaxError as e:
        print(f"SyntaxError: {e}")
        return None

    is_expr = is_ast_expression(tree)

    if not is_ast_naked_await(tree):
        # No wrapping required.
        if is_expr:
            ret = eval(source_code, namespace, namespace)
            if ret is not None:
                print(ret)
        else:
            # Note: This code is blocking!
            exec(source_code, namespace, namespace)
    else:
        # Need to wrap potential compound await expression into a single await.

        # To distinguish out new symbols from user symbols we prefix.
        # - We can also consider adding UUID for all new symbols.
        # - We can consider checking to see if symbol exists.

        # Wrapper header.
        wrapped_source = [
            'import asyncio as __thirdparty_sandbox_asyncio',
            'async def __thirdparty_sandbox_async_def():'
        ]

        # Expose all the global variables to function.
        for key in namespace:
            if is_valid_python_identifier(key):
                wrapped_source.append(f'    global {key}')

        # If its an expression, save the result.
        if is_expr:
            wrapped_source.append(f"    __thirdparty_sandbox_ret = {source_code}")
        else:
            # TODO: Check for (premature) return or yield in source_code?
            wrapped_source.append(f"    {source_code}")

        # Update globals() with any local assignments.
        wrapped_source.append('    globals().update(locals())')

        if is_expr:
            wrapped_source.append('    return __thirdparty_sandbox_ret')
        
        task_launcher = [
            '__thirdparty_sandbox_task = ',
            '__thirdparty_sandbox_asyncio.get_running_loop().',
            'create_task(__thirdparty_sandbox_async_def())',
        ]
        wrapped_source.append(''.join(task_launcher))

        # Run the function definition in user given namespace (e.g. globals()).
        exec('\n'.join(wrapped_source), namespace, namespace)

        # Spin the event loop until the task is complete.
        while not namespace['__thirdparty_sandbox_task'].done():
            await asyncio.sleep(0.01)
        ret = namespace['__thirdparty_sandbox_task'].result()

        # If original source was an expression, print it.
        if is_expr and ret is not None:
            print(ret)

        # Wiping created symbols from namespace
        namespace.pop('__thirdparty_sandbox_async_def', None)
        namespace.pop('__thirdparty_sandbox_task', None)


async def async_input(prompt: str) -> str:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, input, prompt)


def async_def_complete(final_buffer):
    # Check for completeness
    async_wrap = ['    ' + x for x in final_buffer]
    async_wrap.insert(0, 'async def __thridparty_sandbox_asyncdef():')
    final_src = '\n'.join([*async_wrap, ''])
    complete = False
    if len(final_src) > 0:
        try:
            complete = codeop.compile_command(final_src, "<string>", "exec")
        except SyntaxError as e:
            if 'await' in e.msg and 'outside' in e.msg:
                complete = True
            else:
                raise
    return complete


async def async_repl(namespace):
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

                    if len(final_buffer) == 0:
                        # Ignore empty input.
                        continue

                    # Continue loop if buffer is not single statement or newline.
                    # (i.e. extra Enter after multi-line paste.)
                    if len(buffer) > 1:
                        continue

                    # Check for code completeness.
                    # Note: "async def" wrap to ignore await outside function error.
                    complete, final_src = wrap_in_async_def(final_buffer)
                    if not complete:
                        prompt = ps2
                        continue

                    # Note: Assume complete and good syntax below.
                    break

                final_src = '\n'.join([*final_buffer, ''])
                if len(final_src) > 0:
                    if len(final_buffer) == 1:
                        await async_run_single_line(final_buffer[0])
                    else:
                        # TODO: Use exec and namespace
                        more = console.runsource(final_src, symbol="exec")
                        prompt = ps2 if more else ps1
                
                # Ensure event loop has time to execute.
                await asyncio.sleep(0)

            except KeyboardInterrupt:
                prompt = ps1
                print("\nKeyboardInterrupt")
            except SyntaxError as e:
                print(f"\nSyntaxError: {e}")

    except EOFError:
        print()
        pass


if __name__ == "__main__":
    asyncio.run(async_repl())

```

</details>

The above code has a whole host of issues that can be addressed and there is a lot left to be desired, but a perfect solution wasn't really the point. I hope that the reader can take away that while Python (AFAIK) doesn't yet include this kind of functionality (i.e. dropping into await-able REPL mid-code) and while its not as simple as one might assume, this kind of feature is certainly doable once you wrap your head around the constraints of asyncio's "one event loop per thread", the limitations of Python's await usage, and the processes used to infer whether code is complete or not.

## Follow Up

Since writing this article, I've gone well beyond what I've left here. Sky is the limit, but I've since implemented the above "await-able REPL" design into a remote-able REPL. You start up a server (Inet or Unix Socket) anywhere in a application and then connect to it from a client in another terminal or Tmux pane for runtime inspection. It behaves just like the standard `python` REPL in all the ways I need.

Based on some inherent limitations and the relative simplicity of the given solution, the one thing that I think you need to pay the most attention to is the scope of your variables. I sometimes bury things deeply into locals or hide state information away in closures. To provide access to these, you need to expose their state to the scope that you intend to expose to the REPL. The new constraint has caused me to link a lot of state to a object tree that is tied to global scope by way of caching objects that would otherwise exist on their own. This linkage is probably bad for memory usage, but in the big picture well worth the effort to have direct access to the state of the system while developing tools.

## A Note On PDB and breakpoints

Additionally, I'd like to make note that I use the term "inspection" in the purpose of my above REPL efforts because I'm developing a tool that brings in a ton of deeply populated object state and while developing I want to inspect the state various variables at different phases (especially while using `await` with network enabled code). This is very different than troubleshooting my own Python code and state with something like `pdb` or `breakpoint()`. I am currently of the opinon that `pdb`/`breakpoint()` should never be asynchronous. It is quite literally its job to stop execution for low-level inspection of python state code with additional benefit of steps, memory analysis, etc. I've often fell victum to thinking that `pdb.set_trace()` is a one-size solution for REPL-ing into my Python. This act of using `pdb`/`breakpoint` purely as a REPL is likely bad practice and should be avoided.

In the case of debugging around `await` in Python, the trick to `pdb`/`breakpoint`s not being asynchronous is to add more of them! If you want to halt execution, inspect, await, halt, inspect, rinse/repeat. You simply add a breakpoint before and after the await statement and use `continue` from the debugger. Its basically the same as defining manual steps.

## Comments

<Comments />