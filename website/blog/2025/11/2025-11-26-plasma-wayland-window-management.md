---
slug: 2025-11-26-plasma-wayland-window-management
title: "Plasma 6 (Wayland) Window Management"
draft: false
---

## Wayland Rant

What do you mean I have no control over what my applications identify as?! The Wayland developers don't get it. They are the reason Linux Desktop still struggles. I don't care what security strides or modern GPU support they've developed. When you get in the way of an entire community from meeting minimal standard usability, you've created a negative product that might feel good, but degrades the community in the same way controlled substance tear apart families. Its bad for society, organizations, and the future. Their choice to block window managers from doing _actual_ window management is pitful, short sighted, and an utter failure of synapses. Without going into details, we have to go great lengths to attempt to save and restore windows states for even the most simple situations. _Rant Over_

## Overview

One simple work around for managing Window Rules in KDE-Plasma6-Wayland (for multi-instance applications) is to treat the Window Rules as a dynamic thing. The idea here is to add some metadata to the Window Rules themselves. Then when we want to launch a specific application with specific rules, we reconfigure the Window Rules temporarily, launch the application, and then revert the Window Rules back to their original state. This feels and is ridiculous, but Wayland ridiculous decision breed ridiculous solutions.

<!-- truncate -->

## Implementation

The way we'll manage what rules are reconfigured is through the use of _tags_. We could add the tags in a unspecified property or in another file, but I wanted to be able to maintain the tags via the normal KDE Window Rules GUI. Therefore we're adding the tags themselves to the Window Class field. This will prevent the rule from being active without the context switching script as well as allow KDE Settings maintenance.

The Tags are encoded in JSON. Example: `{"id":"VSCodium","tags":["tag1", "tag2"]}`.

When we reconfigure, the above JSON becomes `VSCodium`, but only if "tag1" or "tag2" are activated in the launch script.

Below is the script code that I'm using:

```python
#!/usr/bin/env python3

import configparser
import json
import shutil
import os
import subprocess
import sys
import time

kwinrulesrc_fpath = os.path.expanduser("~/.config/kwinrulesrc")
kwinrulesrc_backup = os.path.expanduser("~/.config/kwinrulesrc.backup")

# Always copy the original to a backup (never backup temporal config)
print("Creating backup.")
shutil.copy(kwinrulesrc_fpath, kwinrulesrc_backup)

try:
    # Get the tags and command args
    # Example: python script.py tag1 tag2 -- arg1 arg2
    args = sys.argv[1:]
    try:
        sep_index = args.index('--')
    except ValueError:
        sep_index = None

    tags = args
    cmd_args = []
    if sep_index is not None:
        tags = args[:sep_index]
        cmd_args = args[sep_index+1:]

    # Read original rules.
    tagged = configparser.ConfigParser()
    tagged.read(kwinrulesrc_fpath)

    # Convert to dictionary
    all_sections = {}
    for section in tagged.sections():
        all_sections[section] = {}
        for option in tagged.options(section):
            value = tagged.get(section, option)
            if option == 'wmclass' and value[0] == '{':
                obj = json.loads(value)
                all_sections[section][option] = obj['id']
                all_sections[section]['tags'] = obj['tags']
                continue
            all_sections[section][option] = value

    # Filter dictionary based on tags.
    output = {}
    for section in all_sections:
        if 'tags' not in all_sections[section]:
            output[section] = all_sections[section]
        else:
            for active_tag in tags:
                if active_tag in all_sections[section]['tags']:
                    output[section] = all_sections[section]
                    output[section]["tags"] = ','.join(output[section]["tags"])
                    break

    # Output the temporal rules
    temp = configparser.ConfigParser()
    temp.read_dict(output)
    with open(kwinrulesrc_fpath, "w") as temp_fobj:
        temp.write(temp_fobj)
    print("Wrote new config.")

    # Reload Window Rules
    os.system("qdbus6 org.kde.KWin /KWin reconfigure")
    print("Reconfigured Window Rules")

    # Run user command with setsid
    cmd = ' '.join(cmd_args)
    with open("/dev/null", "w") as devnull:
        subprocess.Popen(
            cmd,
            stdout=devnull,
            stderr=devnull,
            stdin=devnull,
            preexec_fn=os.setsid
        )

finally:

    # Give window time to start before reverting rules.
    time.sleep(3)
    # Revert Window Rules
    print("Reverting Rules File")
    shutil.copy(kwinrulesrc_backup, kwinrulesrc_fpath)
    print("Revertting Window Rules")
    os.system("qdbus6 org.kde.KWin /KWin reconfigure")
```

## Usage

The usage of the above script is a bit complicated. First, you need a way to launch your target application from CLI. I only use this process for my initial configurations for codium, zen, and spotify. Therefore all of those binaries are in my path. 

Step 2 is to create the KDE/Plasma Window Rules. For each application size/postion/virtual-desktop combination, you'll need a unique rule. If you setup your windows the way you like them, you can use the Window Rules "Detect Windows Properties" button toward the bottom of the rule definition to target a window to get the various property settings.

Once you have the _Whole window class_ detected in the Window Class field, you'll want to replace it with the appropriate JSON. For Zen, the _whole class name_ is `zen zen`. For my "setup zen on the right side of virtual desktop 3", I would make the window class field: `{"id":"zen zen","tags":["web_desk3"]}`.

The last step is to either run the above script with the approate tag and command, or setup the command to run as a batch command job. Here is an example of rules that I am running:

```sh
# Load codium on the left side of virtual desktop 1 and virtual desktop 2.
~/.config/kwin-rulestart.py codium_desk1and2 -- codium
# Load whatsapp in lower left of virtual desktop 3
~/.config/kwin-rulestart.py social_desk3 -- zen
# Load 66% Zen on right side of virtual desktop 3
~/.config/kwin-rulestart.py web_desk3 -- zen
# Load 33% Zen on right side of virtual desktop 2
~/.config/kwin-rulestart.py web_desk2 -- zen
```

## Additional Suggestings

- I would recommend that you export your rules to ensure if the script fails, you don't lose all your work.

- The ~/.config/kwinrulesrc file is an INI file that stores all of the rules. These could be added to a dotfiles repo.

- Note: The scale setting of the desktop will effect the position and size of the window.

- Tiling Managers may make this whole thing moot. I use Kwin Autozones and this process seems to compliment it.

## Comments

<Comments />