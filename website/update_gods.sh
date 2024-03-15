#!/bin/sh

# Wipe the old system_manual
rm -rf gods_system_manual && mkdir gods_system_manual
# Grab the top of the system_manual 
git archive --remote=git@git.lab:lab/system_manual.git --format=tar main | tar -x -C ./gods_system_manual \
  && chmod -R u+w docs/GitOpsDrivenStack/* && rm -rf docs/GitOpsDrivenStack/*
# Synchronize only what we needa
rsync -av gods_system_manual/docusaurus/docs/lab/ docs/GitOpsDrivenStack
# Add README
echo "Do not edit!!, This folder is autogenerated and synchronized from https://git.lab/lab/system_manual.git" \
  > docs/GitOpsDrivenStack/README.txt
# Add more obvious file name
cp docs/GitOpsDrivenStack/README.txt docs/GitOpsDrivenStack/EVERYTHING_HERE_IS_AUTO_GENERATED_CONTENT
# Make it read only
chmod -R -w docs/GitOpsDrivenStack/*
