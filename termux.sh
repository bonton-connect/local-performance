apt update
apt install -y nodejs git
npm install -g yarn

mkdir -p local-performance
cd local-performance

[[ -d .git ]] && git pull || git clone https://github.com/bonton-connect/local-performance.git .

yarn install
HOST=999.999.999.999 node ./client.js
