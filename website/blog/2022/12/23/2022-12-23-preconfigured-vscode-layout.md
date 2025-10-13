---
slug: 2022-12-23-preconfigured-vscode-layout
title: 'Preconfigured VSCode Layout (as End User GUI)'
draft: false
---

## Background

Suppose you have a new software product that has a lot of value to an end-user, but the variability of the product would prevent you from delivering a full solution to end users simply because of the lead time required to develop a GUI with reasonable UX. What to do?

In my opinion, the conventional wisdom is to apply agile methodologies and develop only the options the user needs now. Naturally this is what I want to do, but its also my belief that the user should be able to tweak and experiment with the code base (as I do) to get the greatest value in the shortest amount of time.

<!-- truncate -->

I've been working on some python scripts recently that assist with OCR and translation of various document types. Up until now, I've been accepting one off requests to test the software by accepting various types of end user input, processing the data, and returning the resulting output back to the end user. It has now come to the point where I need to stop tweaking the code and start thinking of handing the product off to end users. The trouble is, while the code has proven to be of high value, the tweak-ability would cause any reasonable GUI development to consist of such complexity that its likely value would be loss. How do we deliver the greatest value now?!

## The Idea

Back in 1994, when you purchased a computer with DOS or Windows 3.x, it would often include some QuickBASIC (i.e. QBASIC) scripts. Notably, Nibbles was one that I would play all the time. The thing about Nibbles what that you didn't just run it on the command line. I was taught that you open the QBasic IDE, load the script into the Interpreter and then hit `F5` to start the game. **But what was all that code on the screen before I hit `F5`?!** (And that was the catalyst for Vinnie learning to computer program.)

In the same vane, I would like to instruct the end user to:

- Open a VSCode interface.
- Upload files to the Explorer side bar.
- Run the script from the embedded VSCode terminal.
- Download files from the Explorer side bar.
- Optionally tweak the actual script code with an easy restart/revert button.

The above process is effectively a complete use case, but it depends on a canned/pre-configured VSCode. The UX is assumed to be improved by containerizing the software, all of the product dependencies, and a _pre-configured_ VSCode (or Theia) web service. This way, the end user is only required to pull a container from a container registry, fire it up, and then visit some `http://localhost:<port>` within their platform (whether it be bare metal or a VM). How do we _pre-configure_ VSCode or Theia to have the right windows/editors in the correct state?

## Pre-Configure VSCode

From what research I've done, there are no good resources (that I've found yet) to run a startup script for VSCode. This led me to developing my first VSCode extension. Unlike other extensions you may find in the Extension Marketplace, I developed this extension as a hard coded one off that will be embedded in my container.

### VSCode Extension Development Preparation

I usually do all of my development on remote platforms from VSCode in Windows. For VSCode extension development, its highly recommended to just install all of the extension development dependencies directly on the same platform as the VSCode. (Build a VSCode development VM for yourself if its important to not have node/npm/yarn clutter in your bare metal environment.) 

```sh
# Install NVM (Node Version Manager) ... for linux.
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash

# Close and Re-open terminal to get updated environment variables installed by nvm.

# Install Node
nvm install v16.19.0

# I prefer yarn.
npm install -g yarn
```

Now with `node` and `yarn` on your VSCode platform, we'll generate a quick extension starter project. Note: Most documentation will recommend that you install the following globally. I'm personally allergic to installing tools in global scopes so I create a project just for this.

```sh
# Create new folder
mkdir vscode-ext ; cd vscode-ext

# Initialize yarn project for some starter tools.
yarn init

# Add key dependencies
yarn add -D yo generator-code

# Generate the template extension. (Note: I used Typescript and called by extension "initlayout".)
yarn yo code
```

### Extension Development/Configuration

Once my `initlayout` extension was created, there is a new folder with all kinds of files in it. To run the extension on VSCode start, you need to set the `activationEvents` property in the `package.json` file. If you want the extension to be activated as soon as possible, this'll be set to `*`. Since I just need to setup some layout stuff after everything has loaded, I opted to set it to `onStartupFinished`. I removed the `onCommand:...` bit. That was relevant for my use case.

```json
"activationEvents": [
  "onStartupFinished"
]
```

After that, you can start to populate the `src/extension.ts` with various extension-y things. I read up on a lot of extension capabilities and calls and in the end I came to the conclusion that the most simply was to interact with VSCode as an extension is with the workbench commands. You can accomplish a great deal of automation within VSCode with only these commands (i.e. all the things from the command pallette). Once you are comfortable with that, as needed you can venture into more advanced calls. For the most part, I'm going to be only using commands for my one-off hard-coded VSCode extension.

Within `src/extension.ts` I defined a `initlayout()` call:

```ts
export default async function initlayout(context: vscode.ExtensionContext) {    
    // reset all the editors and terminals
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
    await vscode.commands.executeCommand("workbench.action.terminal.killAll");

    // Start a terminal
    let term!: vscode.Terminal;
    term = vscode.window.createTerminal({name: "CLI", shellPath: "/bin/bash" /*, cwd: ""*/});
    term.show();

    // Open primary script
    await vscode.commands.executeCommand("vscode.open", vscode.Uri.file("/etc/passwd"));

    // Show the explorer view.
    await vscode.commands.executeCommand('revealInExplorer');

    // Show the getting started readme
    await vscode.commands.executeCommand("markdown.showPreview", vscode.Uri.file(context.asAbsolutePath("README.md")));
}
```

In brief, the above code:

- Closes all editors and kills all terminals. This resets VSCode state that may have been saved from previous sessions. This reset would ideally be configurable by power users, but for now we're aiming for a deterministic and repeatable UX for folks that may not be VSCode proficient.
- We start up a terminal that should default to the bottom half of the IDE. This'll be where the end user is expected to manually dial in commands to execute the value add product.
- We open the code in a editor in the top half. This will allow Jupyter savvy users to see the code and know where they can fiddle. This provides a raw UX but permits the users to accomplish any options that would ideally have been added to a complex GUI.
- Next, we ensure that the Explorer side bar is opened. This is because the primary use case calls for the user to upload data to process and download processed data.
- Finally, and most importantly last, we open the extension README markdown in preview view. This'll basically be the getting started instructions. We load this last so its the first thing that the user sees. A quick read through and re-reference on this tab should allow the user to easily copy/paste/modify various commands for running the software product script.

Then within the `activate()` call (towards the end), I added my `initlayout(context);` call. All done!

Also, I didn't find any good Microsoft documentation on how to discover all of the various commands available. Instead I leaned on a [cheatsheet](https://kapeli.com/cheat_sheets/Visual_Studio_Code.docset/Contents/Resources/Documents/index) that I found on the net.

### Extension Testing

At this point we can load up the extension into VSCode and ideally just hit `F5` to run the extension. It'll open another VSCode that has the extension loaded for testing. Note: Any `console.log`-ing that you perform in your extension will show up in the parent VSCode, not the VSCode under test.

If you repeated the process described above, it should have the explorer opened, an open bash terminal, and 2 editor tabs open with the README markdown in preview mode on top. In other words, we've predictably pre-configured VSCode to match any instructions we present to the end-user in the README.

## Follow On Work

- While this article is just a taste of VSCode automation, this actual use case would then need to be compiled into a `.vsix` file and then incorporated into a VSCode web service or Theia build. All of this would be stored within a container and then any persistance would depend on how the container volumes were configured when started.
- Interestingly, the above extension is so simple, you could easily develop a slightly more advanced extension that would read various commands and parameters from a text file and just run that file path (via VSCode configuration) on start. If this doesn't already exist, I may consider something like this in the future when I find myself changing the above process for multiple use cases.
- While this automation is primarily a way for me to deliver an interim deliverable to get the software into user's hands as soon as possible, I can also see this as a powerful learning tool. Imagine being able to pre-can various situations in VSCode while teaching students how to think through solving various coding problems.

## Resources

- [Restore Terminals](https://marketplace.visualstudio.com/items?itemName=EthanSK.restore-terminals) [(Github)](https://github.com/EthanSK/restore-terminals-vscode/blob/master/src/restoreTerminals.ts)
- [Your First Extension](https://code.visualstudio.com/api/get-started/your-first-extension)
- [Install NVM](https://github.com/nvm-sh/nvm#installing-and-updating)
- [VSCode API - TerminalOptions](https://code.visualstudio.com/api/references/vscode-api#TerminalOptions)
- [Write Text To New Tab Programmatically](https://stackoverflow.com/questions/55993750/write-text-to-new-tab-in-vs-code-programmatically)
- [VSCode API - window Object](https://code.visualstudio.com/api/references/vscode-api#window)
- [VSCode API - onStartupFinished](https://code.visualstudio.com/api/references/activation-events#onStartupFinished)
- [VSCode API - Extension Guides / command](https://code.visualstudio.com/api/extension-guides/command)
- [VSCode API - commands](https://code.visualstudio.com/api/references/commands)

## Comments

<Comments />
