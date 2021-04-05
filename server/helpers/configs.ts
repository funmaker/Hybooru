/* eslint-disable */
import * as fs from 'fs';
import pg from "pg";
import { Theme } from "../../client/hooks/useTheme";

type Configs = {
  port: number,
  hydrusDbPath: string | null,
  appName: string,
  appDescription: string,
  adminPassword: string | null,
  isTTY: boolean | null,
  importBatchSize: number,
  db: pg.PoolConfig,
  tags: {
    motd: string | Partial<Record<Theme, string>> | null,
    untagged: string,
    ignore: string[],
    blacklist: string[],
  }
};

let configs: Configs = {
  port: 3939,
  hydrusDbPath: null,
  appName: "HyBooru",
  appDescription: "Hydrus-based booru-styled imageboard in React",
  adminPassword: null,
  isTTY: null,
  importBatchSize: 10000,
  db: {
    user: "hybooru",
    host: "localhost",
    database: "hybooru",
    password: "hybooru",
    port: 5432,
  },
  tags: {
    motd: null,
    untagged: "-*",
    ignore: [],
    blacklist: [],
  }
};

try {
  // noinspection UnnecessaryLocalVariableJS
  const configsJson: typeof import("../../configs.json") = JSON.parse(fs.readFileSync("./configs.json").toString("utf-8"));
  configs = deepMerge(configs, configsJson);
} catch(e) {
  console.error("Failed to read configs.json");
  console.error(e);
  
  throw e;
}

export default configs;

function isPlainObject(obj: any) {
  return typeof obj === 'object'
      && obj !== null
      && obj.constructor === Object
      && Object.prototype.toString.call(obj) === '[object Object]';
}

function deepMerge<T extends Object>(base: T, object: T): T {
  const ret = { ...base, ...object };
  
  for(const key in object) {
    if(!object.hasOwnProperty(key)) continue;
    
    if(isPlainObject(base[key]) && isPlainObject(object[key])) ret[key] = deepMerge(base[key], object[key]);
  }
  
  return ret;
}
