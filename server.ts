import 'source-map-support/register';
import http from 'http';
import chalk, { Level } from 'chalk';

import app from './server/app';
import configs from "./server/helpers/configs";

if(typeof configs.isTTY === "boolean") {
  chalk.enabled = configs.isTTY;
  chalk.level = configs.isTTY ? (chalk.level || Level.Basic) : Level.None;
}

let port = configs.port || 3000;
if(process.env.DOCKERIZED) port = 80;

const server = http.createServer(app);
const origApp = app;
let currentApp = app;
server.listen(port);

console.log(`\n${chalk.bold("HyBooru")} started on port ${chalk.yellow.bold("" + port)}`);
console.log(`Environment: ${chalk.yellow.bold("" + process.env.NODE_ENV)}.`);
console.log(chalk.dim.white(`Press Ctrl-C to terminate.\n`));

if(module.hot) {
  module.hot.accept('./server/app', () => {
    let newApp = app;
    if(origApp === newApp) newApp = require("./server/app").default;
    server.removeListener('request', currentApp);
    server.on('request', newApp);
    currentApp = newApp;
  });
}

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});
