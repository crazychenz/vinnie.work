#!/bin/sh

./firebase_env.sh alias eslint='yarn eslint' \; yarn firebase deploy --only functions
