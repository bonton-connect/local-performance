const os = require("os");
const ws = require("ws");
const net = require("net");
const path = require("path");
const axios = require("axios");
const zero = require("dev-zero-stream");
const bodyParser = require("body-parser");

const interfaces = os.networkInterfaces();

const ips = Object.values(interfaces)
  .flat()
  .filter((inf) => inf.family === "IPv4")
  .map((inf) => {
    return inf.address;
  });

const wss = new ws.WebSocketServer({
  port: 9075,
});

let clients = {};
let downloadMbps = 0;
let uploadMbps = 0;
let ping = 0;

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const str = message.toString();

    const [_, d, p] = str.split(" ");

    if (d !== undefined && p !== undefined) {
      downloadMbps = parseFloat(d);
      ping = parseInt(p, 10);
    }

    if (str[0] === "I") {
      ws.send("O");
    } else if (str[0] === "P") {
    } else if (str[0] === "U") {
    }
  });

  ws.on("close", () => {
    ping = 0;
    downloadMbps = 0;
  });
});

let server = net.createServer();

let last = Date.now();
let sinceLast = 0;

server.on("connection", (connection) => {
  connection.on("error", () => console.log("Connection error"));

  const id = Date.now();

  const z = zero();
  z.pipe(connection);

  connection.on("data", (data) => {
    sinceLast += data.length;
  });

  setInterval(() => {
    const sinceLastMB = (sinceLast * 8) / (1024 * 1024);

    const diff = (Date.now() - last) / 1000;
    const mbps = Math.round((sinceLastMB / diff) * 100) / 100;

    if (uploadMbps !== undefined) {
      uploadMbps = mbps;
    }

    clients[id] = {
      id: id,
      ping: ping,
      uploadRate: uploadMbps,
      downloadRate: downloadMbps,
      address: connection.remoteAddress,
    };

    axios
      .post("http://localhost:9073/data", {
        clients: clients,
      })
      .then(function (response) {
        console.log(response.data);
      })
      .catch(function (error) {
        console.log(error);
      });

    console.log(clients);
    // console.log(`Upload rate: ${mbps} Mb/s`);

    sinceLast = 0;
    last = Date.now();
  }, 1000);
});

server.listen(9074, "0.0.0.0");

const fs = require("fs/promises");
const app = require("express")();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/table", function (req, res) {
  res.sendFile(path.join(__dirname + "/table.html"));
});

app.get("/termux", async (req, res) => {
  const content = (await fs.readFile("./termux.sh")).toString("utf-8");
  res.end(
    content.replace("999.999.999.999", req.headers.host.split(":").shift())
  );
});

app.post("/data", (req, res) => {
  clients = req.body.clients;
  res.status(200);
});

app.get("/data", (req, res) => {
  res.send({
    clients: clients,
  });
});

app.listen(9073, "0.0.0.0", () => console.log("Server started"));
