# set the base image to Debian
# https://hub.docker.com/_/debian/
FROM sayok/nvm

# These were values used in sayok/nvm
WORKDIR /workspace
USER user
ENV NVM_DIR /home/user/.nvm

# Install latest LTS node.
# https://docs.expo.io/get-started/installation/
RUN source $NVM_DIR/nvm.sh && nvm install --lts

RUN source $NVM_DIR/nvm.sh && npm install -g yarn

# Dump node and npm information.
RUN source $NVM_DIR/nvm.sh && (echo -en "Node: " ; node -v && echo -en "NPM: " ; npm -v)

# Need to set default shell to get nvm settings from .bashrc
SHELL ["/bin/bash", "-c"]