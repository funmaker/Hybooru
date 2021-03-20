/* eslint-disable */
import * as fs from 'fs';
import pg from "pg";

type Configs = {
  port: number,
  db: pg.PoolConfig,
  hydrusDbPath: string | null,
  appName: string,
  appDescription: string,
  adminPassword: string | null,
  tags: {
    motd?: string | null,
    ignore?: string[],
    blacklist?: string[],
  }
};

let configs: Configs = {
  port: 3939,
  db: {
    user: "hybooru",
    host: "localhost",
    database: "hybooru",
    password: "hybooru",
    port: 5432,
  },
  hydrusDbPath: null,
  appName: "HyBooru",
  appDescription: "Hydrus-based booru-styled imageboard in React",
  adminPassword: null,
  tags: {
    motd: null,
    ignore: [],
    blacklist: [],
  }
};

try {
  // noinspection UnnecessaryLocalVariableJS
  const configsJson: typeof import("../../configs.json") = JSON.parse(fs.readFileSync("./configs.json").toString("utf-8"));
  const configsJsonGuard: Configs = configsJson;
  configs = {
    ...configs,
    ...configsJsonGuard,
  };
} catch(e) {
  console.error("Failed to read configs.json");
  console.error(e);
  
  throw e;
}

export default configs;
