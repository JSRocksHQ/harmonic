#!/bin/bash
#./install.sh

nodev=$(node -v);
echo -e "\nyour node.js version is $nodev\n";

echo "Creating a file 'nodeHarmony'";

echo '
!/bin/sh
node --use-strict --harmony "$@"
' >> /usr/local/bin/nodeHarmony

echo -e 'Giving the right permission...';
sudo chmod a+x /usr/local/bin/nodeHarmony

echo -e 'installing dependencies...\n';
sudo npm install

echo -e '\nputting harmonic on your global path...';
npm link

echo -e '\nNow, just build your awesome website!\n';
echo -e 'use: harmonic build\n\n';
echo -e 'See more in https://github.com/es6rocks/harmonic\n';