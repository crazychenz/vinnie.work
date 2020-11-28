#!/bin/sh

./firebase_env.sh yarn firebase emulators:start --export-on-exit data --import data
