const dgram = require('dgram');
const os = require('os');
const SubnetInfo = require('subnet-info');
const ipl = require('node-ip-lib');
const ws = require('ws');
const net = require('net');
const zero = require('dev-zero-stream');

const interfaces = os.networkInterfaces()

const ips = Object
    .values(interfaces)
    .flat()
    .filter(inf => inf.family === 'IPv4')
    .map(inf => {
        const si = new SubnetInfo(inf.cidr);

        return {
            network: si._networkAddress(),
            ip: inf.address
        }
    });

const udpServer = dgram.createSocket({
    type: 'udp4'
});

udpServer.addListener('message', (message, info) => {
    const msg = message.toString();

    if (msg === 'IP PLS') {
        const ourIP = ips.find(ip => new ipl.ip(ip.ip).and(info.address).join('.')).ip;
        console.log('SENDING:', ourIP, ' --> ', `${info.address}:${info.port}`);
        udpServer.send(ourIP, info.port, info.address);
    }
});

udpServer.bind(9076, '0.0.0.0');

const wss = new ws.WebSocketServer({
    port: 9075
});

const portAllocation = Array(256).fill(false);

function findPort() {
    return portAllocation.findIndex(port => !port);
}

wss.on('connection', ws => {
    let bytes = null;
    let server = net.createServer();

    const portIndex = findPort();
    portAllocation[portIndex] = true;
    const port = portIndex + (9070 - 256);

    server.listen(port, '0.0.0.0');

    ws.on('message', message => {
        const str = message.toString();

        if (str[0] === 'S') {
            bytes = parseInt(str.split(':').pop());
            ws.send('P:' + port);
        } else if (str[0] === 'I') {
            ws.send('O');
        } else if (str[0] === 'P') {
            // ws.send('O');
        } else if (str[0] === 'D') {
            // ws.send('O');
        }
    });

    server.on('connection', (connection) => {
        if (!bytes) {
            return;
        }

        const z = zero();
        z.pipe(connection);

        connection.on('error', () => {});
    });

    ws.on('close', () => {
        portAllocation[portIndex] = false;
        server.close();
    });
});