const net = require("net");
const { WebSocket } = require("ws");
const zero = require("dev-zero-stream");

let serverAddress = process.env.HOST;

const parameters = process.argv.slice(2);

let upload = false;
let download = false;

let downloadMbpsToSend = 0;

if (parameters.length > 0) {
  parameters.find((param) => {
    if (param.includes("-D")) {
      download = true;
      console.log("Download test");
    } else if (param.includes("-U")) {
      upload = true;
      console.log("Upload test");
    }
  });
}

function start() {
  console.log(`SERVER: ${serverAddress}`);

  const ws = new WebSocket(`ws://${serverAddress}:9075/`);
  const client = new net.Socket();
  client.connect(9074, serverAddress);

  let pbi = 0;

  const pingBuffer = Array(5).fill(0);

  const totalWeight =
    (pingBuffer.length / 2) *
    (2 * pingBuffer.length + (pingBuffer.length - 1) * -1);

  let lastPingTime = 0;

  function sendPing() {
    lastPingTime = Date.now();
    ws.send("I");
  }

  ws.on("open", () => {
    sendPing();
  });

  function runUploadTest() {
    let sinceLastUpload = 0;

    const stream = zero();

    stream.on("data", (data) => {
      sinceLastUpload += data.length;
    });

    stream.pipe(client);
  }

  if (upload) {
    runUploadTest();
  } else {
    console.log("No upload test issued");
  }

  function runDownloadSpeedTest() {
    let last = Date.now();
    let sinceLastDownload = 0;

    client.on("data", (data) => {
      sinceLastDownload += data.length;
    });

    client.setMaxListeners(0);

    setInterval(() => {
      const sinceLastDownloadMB = (sinceLastDownload * 8) / (1024 * 1024);
      const diff = (Date.now() - last) / 1000;

      const downloadMbps = Math.round((sinceLastDownloadMB / diff) * 100) / 100;

      downloadMbpsToSend = downloadMbps;

      console.log(`Download rate: ${downloadMbps} Mb/s`);

      sinceLastDownload = 0;

      last = Date.now();
    }, 1000);
  }

  if (download) {
    runDownloadSpeedTest();
  } else {
    console.log("No download test issued");
  }

  ws.on("message", (message) => {
    const msg = message.toString();

    if (msg[0] === "O") {
      const diff = Date.now() - lastPingTime;
      pingBuffer[pbi] = diff / 3;

      let sum = 0;

      for (let i = 0; i < pingBuffer.length; i++) {
        const idx = (pbi + i * -1 + pingBuffer.length) % pingBuffer.length;
        const pingValue = pingBuffer[idx] * (pingBuffer.length - i);

        sum += pingValue;
      }

      const averagePing = sum / totalWeight;
      const d = downloadMbpsToSend;
      ws.send(`D ${d} ${averagePing}`);

      // ws.send(
      //   `P:${Math.round(
      //     averagePing
      //   )} ms ${downloadMbpsToSend} ${uploadMbpsToSend}`
      // );

      console.log(`${Math.round(averagePing)} ms`, downloadMbpsToSend);

      pbi = (pbi + 1) % pingBuffer.length;
      setTimeout(sendPing, 500);
    }
  });
}

start();
