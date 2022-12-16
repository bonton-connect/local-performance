apt update
apt install -y nodejs git
[[ $OSTYPE == *"android"* ]] apt install -y termux-api

npm install -g yarn

mkdir -p local-performance
cd local-performance

[[ -d .git ]] && git pull || git clone https://github.com/bonton-connect/local-performance.git .

yarn install

termux-wifi-connectioninfo > wifiinfo.json

node ./client.js
