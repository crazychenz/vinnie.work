#!/bin/sh

docker build -t crazychenz/gatsby .

# Recommended to volume mount /home/user from host to save login info.
# `docker cp <container>:/home/user ./home`
# `docker run -ti --rm -v $(pwd)/home:/home/user sayok/firebase-test bash`
