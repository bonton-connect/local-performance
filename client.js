const blessed = require('blessed');
const randomPrime = require('./random-prime').randomPrime;
const os = require('os');
const SubnetInfo = require('subnet-info');
const net = require('net');

let ips = [];

if (!(`${process.env.PATH}`.indexOf('termux') >= 0 || `${process.env.OSTYPE}`.indexOf('android') >= 0)) {
    const interfaces = os.networkInterfaces()

    ips = Object
        .values(interfaces)
        .flat()
        .filter(inf => inf.family === 'IPv4')
        .map(inf => {
            return new SubnetInfo(inf.cidr)._broadcastAddress();
        }).concat(['127.0.0.1']);
} else {
    ips.push(new SubnetInfo(require('./wifiinfo.json').ip + '/24')._broadcastAddress())
    
    if (process.env.IP) {
        ips.push(process.env.IP);
    }
}

const dgram = require('dgram');
const { clearInterval } = require('timers');
const { WebSocket } = require('ws');

const udpSocket = dgram.createSocket({
    type: 'udp4'
});

udpSocket.bind(9077, '0.0.0.0');

const inter = setInterval(() => {
    for (const ip of ips) {
        udpSocket.send('IP PLS', 9076, ip);
    }
}, 2000);

// const screen = blessed.screen({
//     smartCSR: true
// });

// screen.title = 'SPEED TEST CLIENT';

// const box = blessed.box({
//     top: 'center',
//     left: 'center',
//     height: '100%',
//     padding: 2,
//     content: '',
//     tags: true,
//     border: {
//         type: 'line',
//         bold: true
//     },
//     style: {
//         fg: 'white',
//         // bg: 'magenta',
//         border: {
//             fg: '#f0f0f0'
//         }
//     }
// });

// const speed = blessed.BigText({
//     content: '---',
//     fg: 'yellow',
// });

// const speedText = blessed.text({
//     content: '-- MEGA-BITS / SECOND',
//     fg: 'white',
//     top: 14,
//     style: {
//         bg: 'magenta'
//     }
// });

// const ping = blessed.bigtext({
//     content: '---',
//     fg: 'white',
//     top: 16
// });

// const pingText = blessed.text({
//     content: '-- MILLISECONDs',
//     fg: 'white',
//     top: 14 + 2 + 14
// });

const size = randomPrime({
    min: 1024 * 1024 * 5,
    max: 1024 * 1024 * 50
});

// const agreedUponSize = blessed.text({
//     content: `CHUNK SIZE: ${size} bytes | ~ ${Math.round(size / 1024 / 1024)} MBs`,
//     fg: 'white',
//     bottom: 5,
//     left: 0
// });

// const server = blessed.text({
//     content: `SERVER: ---`,
//     fg: 'white',
//     bottom: 5,
//     right: 0
// });

// const progressBar = blessed.progressbar({
//     filled: 50,
//     pch: '-',
//     width: '92%',
//     height: 1,
//     bottom: 0,
//     orientation: 'horizontal'
// });

// box.append(speed);
// box.append(speedText);
// box.append(ping);
// box.append(pingText);
// box.append(agreedUponSize);
// box.append(server);

// box.append(progressBar);

// box.on('click', () => process.exit(0));


// screen.append(box);

// screen.key(['escape', 'q', 'C-c'], function (ch, key) {
//     return process.exit(0);
// });

let found = null;

function start() {
    console.log(`SERVER: ${found}`);
    // screen.render();

    const ws = new WebSocket(`ws://${found}:9075/`);

    let pbi = 0;
    const pingBuffer = Array(5).fill(0);
    const totalWeight = (pingBuffer.length / 2) * ((2 * pingBuffer.length) + (pingBuffer.length - 1) * -1);

    let lastPingTime = 0;
    
    function sendPing() {
        lastPingTime = Date.now();
        ws.send('I');
    }

    ws.on('open', () => {
        ws.send(`S:${size}`);
        sendPing();
    });

    function runSpeedTest(port) {
        let last = Date.now();
        let sinceLast = 0;

        const client = new net.Socket();
        client.connect(port, found);

        client.on('data', data => {
            sinceLast += data.length;
        });

        setInterval(() => {
            const sinceLastMB = (sinceLast * 8)/(1024 * 1024);

            const diff = (Date.now() - last) / 1000;
            const mbps = Math.round((sinceLastMB / diff) * 10000) / 100;

            console.log(`${mbps} Mb/s`);
            // screen.render();
            sinceLast = 0;

            last = Date.now();
        }, 1000);
    }

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
            // screen.render();

            pbi = (pbi + 1) % pingBuffer.length;
            setTimeout(sendPing, 500);
        } else if (msg[0] === 'P') {
            runSpeedTest(parseInt(msg.split(':').pop()));
        }
    });
}

udpSocket.addListener('message', message => {
    if (found) {
        return;
    }

    found = message.toString('utf-8');

    clearInterval(inter);
    start();
});

// screen.render();
