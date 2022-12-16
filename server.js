const os = require('os');
const ws = require('ws');
const net = require('net');
const zero = require('dev-zero-stream');

const interfaces = os.networkInterfaces()

const ips = Object
    .values(interfaces)
    .flat()
    .filter(inf => inf.family === 'IPv4')
    .map(inf => {
        return inf.address
    });

const wss = new ws.WebSocketServer({
    port: 9075
});


wss.on('connection', ws => {
    ws.on('message', message => {
        const str = message.toString();

        if (str[0] === 'I') {
            ws.send('O');
        } else if (str[0] === 'P') {
            // ws.send('O');
        } else if (str[0] === 'D') {
            // ws.send('O');
        }
    });
});

let server = net.createServer();

server.on('connection', (connection) => {
    const z = zero();
    z.pipe(connection);

    connection.on('error', () => {});
});

server.listen(9074, '0.0.0.0');

const fs = require('fs/promises');
const app = require('express')();

app.get('/termux', async (req, res) => {
    const content = (await fs.readFile('./termux.sh')).toString('utf-8');
    res.end(content.replace('999.999.999.999', req.headers.host.split(':').shift()));
});

app.listen(9073, '0.0.0.0');