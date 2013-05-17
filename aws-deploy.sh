#!/bin/bash

# Exit after first error; Enable extended tracing
set -e -x

apt-get update && apt-get upgrade -y
apt-get install git -y
apt-get install build-essential libssl-dev -y

git clone https://github.com/joyent/node.git
cd node
git checkout v0.6.10
./configure
JOBS=2 make
make install

curl http://npmjs.org/install.sh| sh
