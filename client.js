const net = require('net');
const { WebSocket } = require('ws');

let serverAddress = process.env.HOST;

function start() {
    console.log(`SERVER: ${serverAddress}`);

    const ws = new WebSocket(`ws://${serverAddress}:9075/`);

    let pbi = 0;
    const pingBuffer = Array(5).fill(0);
    const totalWeight = (pingBuffer.length / 2) * ((2 * pingBuffer.length) + (pingBuffer.length - 1) * -1);

    let lastPingTime = 0;
    
    function sendPing() {
        lastPingTime = Date.now();
        ws.send('I');
    }

    ws.on('open', () => {
        sendPing();
    });

    function runSpeedTest() {
        let last = Date.now();
        let sinceLast = 0;

        const client = new net.Socket();
        client.connect(9074, serverAddress);

        client.on('data', data => {
            sinceLast += data.length;
        });

        setInterval(() => {
            const sinceLastMB = (sinceLast * 8)/(1024 * 1024);

            const diff = (Date.now() - last) / 1000;
            const mbps = Math.round((sinceLastMB / diff) * 100) / 100;

            console.log(`${mbps} Mb/s`);
            sinceLast = 0;

            last = Date.now();
        }, 1000);
    }

    runSpeedTest();

    ws.on('message', (message) => {
        const msg = message.toString();
        
        if (msg[0] === 'O') {
            const diff = Date.now() - lastPingTime;
            pingBuffer[pbi] = diff / 3;

            let sum = 0;

            for (let i = 0; i < pingBuffer.length; i++) {
                const idx = (pbi + (i * -1) + pingBuffer.length) % pingBuffer.length;
                const pingValue = pingBuffer[idx] * (pingBuffer.length - i);

                sum += pingValue;
            }

            const averagePing = sum/totalWeight;
            ws.send(`P:${Math.round(averagePing)}`);

            console.log(`${Math.round(averagePing)} ms`);

            pbi = (pbi + 1) % pingBuffer.length;
            setTimeout(sendPing, 500);
        }
    });
}

start();
