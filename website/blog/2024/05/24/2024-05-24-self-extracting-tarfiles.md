---
slug: 2024-05-24-self-extracting-tarfiles
title: "Self Extracting Tar Files"
draft: false
---

## Problem

It has long been normal to embed some blob of data into the end of a shell script that is implemented as a self-extracting `tar` file. I've used varying methods of this over the years, but I recently started seeing Segmentation Faults when creating files over 2G.

<!-- truncate -->

The process I was using when hitting the segfaults was kind of neat because it kept the shell script 100% text by base64 encoding the embedded data in the script:

```sh
#!/bin/sh

# Create test data to tar up
truncate -s 3G bigfile

# ## Create the header of a self-extracting script.
#
# This header will use a _Here document_ (multi-line 
# input) to inject the base64 encoded data.
cat >bigfile_install.sh <<SH_EOF
#!/bin/sh
base64 -d <<TAR_EOF | tar -xf -
SH_EOF

# Tar the data, base64, and append to the header above.
tar -cf - bigfile | base64 -w 72 >>bigfile_install.sh

# Add the end marker of the Here document.
cat >>bigfile_install.sh <<SH_EOF
TAR_EOF

SH_EOF

# Make our self-extracting shell script executable.
chmod +x bigfile_install.sh
```

Ok, great! It's clean because its all printable text and we know the `TAR_EOF` marker can not show up in the data because it has a `_`. The **problem** is that if you use data that goes over 2GiB (assuming this is literally 2^31 bytes), the shell script will **Segmentation Fault**!

In troubleshooting this, I've ruled out base64 and tar as the culprits. While I don't have the evidence in code of this, I suspect that the Bash Here document from a script can only handle data up to 2GiB.  (... more to investigate later.)

## Workaround

Another technique for self-extracting shell scripts includes using a marker in the data for sed to use as a EOF marker.

```sh
#!/bin/sh

# Create test data to tar up
truncate -s 3G bigfile

# ## Create the header of a self-extracting script.
# Here we use a end of file marker (#EOF#)
cat >bigfile_install.sh <<SH_EOF
#!/bin/sh
sed '0,/^#EOF#$/d' \$0 | tar zx; exit 0
#EOF#
SH_EOF

# Tar the data, base64, and append to the header above.
tar -c bigfile >>bigfile_install.sh

# Make our self-extracting shell script executable.
chmod +x bigfile_install.sh
```

This is better than the `base64` case because it doesn't Segfault. But there is still something that bothers me about this solution. If I am embedding gigabytes of data, having the combination of bytes `#EOF#` is more likely to be in the file. Is there a way to eliminate this edge case?

## Solution

```sh
#!/bin/sh

# Create test data to tar up
truncate -s 3G bigfile

# ## Create the header of a self-extracting script.
# Here we use a end of file marker (#EOF#)
cat >bigfile_install.sh <<SH_EOF
#!/bin/sh
sed '1,3d' \$0 | tar x ; exit 0
# Verbatim tar data following this 3rd line.
SH_EOF

# Tar the data, base64, and append to the header above.
tar -c bigfile >>bigfile_install.sh

# Make our self-extracting shell script executable.
chmod +x bigfile_install.sh
```

This is probably a good sweet spot. It uses sed to stream out the embedded data to tar. But instead of using a marker that could potentially show up in other files, we're explicitly telling sed to remove the top 3 lines of the script and assume everything else is embedded data. This is by far the cleanest way to handle this in a repeatable manner.

## Comments

<Comments />


