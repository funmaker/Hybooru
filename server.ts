import 'source-map-support/register';
import http from 'http';
import chalk from 'chalk';
import { WebSocketServer } from 'ws';

import app from './server/app';
import configs from "./server/helpers/configs";
import { onWsConnection } from "./server/routes/websockets";

if(typeof configs.isTTY === "boolean") {
  chalk.level = configs.isTTY ? (chalk.level || 1) : 0;
}

let port = configs.port || 3000;
if(process.env.PORT) port = parseInt(process.env.PORT) || port;

let host = configs.host || "0.0.0.0";
if(process.env.HOST) host = process.env.HOST;

const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

let currentWsHandler = onWsConnection;
server.on('upgrade', (req, soc, head) => currentWsHandler(wss, req, soc, head));
server.listen({ port, host });

console.log(`\n${chalk.bold("Hybooru")} started on ${chalk.yellow.bold(`http://${host === "0.0.0.0" ? "127.0.0.1" : host}:${port}`)}`);
console.log(`Environment: ${chalk.yellow.bold("" + process.env.NODE_ENV)}.`);
console.log(chalk.dim.white(`Press Ctrl-C to terminate.\n`));

if(module.hot) {
  const origApp = app;
  let currentApp = app;
  module.hot.accept('./server/app', () => {
    let newApp = app;
    if(origApp === newApp) newApp = require("./server/app").default;
    server.removeListener('request', currentApp);
    server.on('request', newApp);
    currentApp = newApp;
  });
  
  const origWsHandler = onWsConnection;
  module.hot.accept('./server/routes/websockets', () => {
    let newWsHandler = onWsConnection;
    if(origWsHandler === newWsHandler) newWsHandler = require("./server/routes/websockets").onWsConnection;
    wss.clients.forEach(client => client.close());
    currentWsHandler = newWsHandler;
  });
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
