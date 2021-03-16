/* eslint-disable */
import * as fs from 'fs';
import pg from "pg";

type Config = {
  port: number,
  db: pg.PoolConfig,
  hydrusDbPath: string | null,
  appName: string,
};

let configs: Config;
try {
  // noinspection UnnecessaryLocalVariableJS
  const configsJson: typeof import("../../configs.json") = JSON.parse(fs.readFileSync("./configs.json").toString("utf-8"));
  configs = configsJson;
} catch(e) {
  configs = {
    port: 3939,
    db: {
      user: "hybooru",
      host: "localhost",
      database: "hybooru",
      password: "hybooru",
      port: 5432,
    },
    hydrusDbPath: null,
    appName: "HyBooru"
  };
}

export default configs;
