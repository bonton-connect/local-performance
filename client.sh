apt update
apt install nodejs git

npm install -g yarn

mkdir -p local-performance
cd local-performance

[[ -d .git ]] && git clone https://github.com/bonton-connect/local-performance.git . || git pull

node ./client.js
