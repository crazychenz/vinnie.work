FROM debian:13-slim

ARG CLIONLY_VERSION

RUN apt-get update && apt-get install -y curl sudo unzip

RUN useradd -m -G sudo user
USER user
RUN mkdir /home/user/.android /home/user/Downloads
WORKDIR /home/user/.android

ENV JAVA_HOME=/home/user/.android/jdk-17.0.2/
ENV ANDROID_HOME=/home/user/.android/
ENV PATH=${JAVA_HOME}bin:$PATH
ENV PATH=${ANDROID_HOME}cmdline-tools/latest/bin:$PATH
ENV PATH=${ANDROID_HOME}platform-tools:$PATH
#ENV PATH=${ANDROID_HOME}build-tools/latest:$PATH
ENV PATH=${ANDROID_HOME}emulator:$PATH
#ENV PATH=${ANDROID_HOME}scrcpy:$PATH
#ENV PATH=${ANDROID_HOME}jadx/bin:$PATH
#ENV PATH=${ANDROID_HOME}scripts:$PATH
#ENV PATH=${ANDROID_HOME}ndk/latest/toolchains/llvm/prebuilt/linux-x86_64/bin:$PATH
#ENV PATH=${ANDROID_HOME}ndk/latest:$PATH
ENV PS1_TAG="(adbenv) "
ENV PS1="${PS1_TAG}${PS1}"
#exec bash -i

COPY openjdk-17.0.2_linux-x64_bin.tar.gz /home/user/Downloads
RUN tar -xf /home/user/Downloads/openjdk-17.0.2_linux-x64_bin.tar.gz

# Copy as root?
COPY commandlinetools-linux-${CLIONLY_VERSION}_latest.zip /home/user/Downloads
RUN unzip /home/user/Downloads/commandlinetools-linux-${CLIONLY_VERSION}_latest.zip \
  && cd cmdline-tools && mkdir latest && mv * ./latest/ ; echo && cd ..

RUN yes | sdkmanager platform-tools emulator

# Setup pipenv
USER root
RUN apt-get install -y python3 python3-pip pipenv
USER user
# No good in debian :(
#RUN python3 -m pip install --user pipenv

RUN PIPENV_VENV_IN_PROJECT=1 pipenv install

