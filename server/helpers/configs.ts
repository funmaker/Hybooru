/* eslint-disable */
import * as fs from 'fs';
import pg from "pg";
import { Theme } from "../../client/hooks/useTheme";
import chalk from "chalk";

interface Configs {
  port: number,
  hydrusDbPath: string | null,
  appName: string,
  appDescription: string,
  adminPassword: string | null,
  isTTY: boolean | null,
  importBatchSize: number,
  pageSize?: number, // deprecated
  cachePages?: number, // deprecated
  cacheRecords?: number, // deprecated
  filesPathOverride?: string | null, // deprecated
  thumbnailsPathOverride?: string | null, // deprecated
  maxPreviewSize?: number, // deprecated
  db: pg.PoolConfig,
  posts: {
    services: Array<string | number> | null,
    pageSize: number,
    cachePages: number,
    cacheRecords: number,
    filesPathOverride: string | null,
    thumbnailsPathOverride: string | null,
    maxPreviewSize: number,
  },
  tags: {
    services: Array<string | number> | null,
    motd: string | Partial<Record<Theme, string>> | null,
    untagged: string,
    ignore: string[],
    blacklist: string[],
    whitelist: string[] | null,
    resolveRelations: boolean,
    reportLoops: boolean,
    searchSummary: number,
  },
  rating: {
    enabled: boolean,
    stars: number,
    serviceName: string | null,
  } | null,
  versionCheck: {
    enabled: boolean,
    owner: string,
    repo: string,
    cacheLifeMs: number
  } | null,
}

let configs: Configs = {
  port: 3939,
  hydrusDbPath: null,
  appName: "HyBooru",
  appDescription: "Hydrus-based booru-styled imageboard in React",
  adminPassword: null,
  isTTY: null,
  importBatchSize: 8192,
  db: {
    user: "hybooru",
    host: "localhost",
    database: "hybooru",
    password: "hybooru",
    port: 5432,
  },
  posts: {
    services: null,
    pageSize: 72,
    cachePages: 5,
    cacheRecords: 1024,
    filesPathOverride: null,
    thumbnailsPathOverride: null,
    maxPreviewSize: 104857600,
  },
  tags: {
    services: null,
    motd: null,
    untagged: "-*",
    ignore: [],
    blacklist: [],
    whitelist: null,
    resolveRelations: true,
    reportLoops: false,
    searchSummary: 39,
  },
  rating: {
    enabled: true,
    stars: 5,
    serviceName: null,
  },
  versionCheck: {
    enabled: true,
    owner: "funmaker",
    repo: "hybooru",
    cacheLifeMs: 3600000
  }
};

const movedPostsOptions = ["pageSize", "cachePages", "cacheRecords", "filesPathOverride", "thumbnailsPathOverride", "maxPreviewSize"] as const;

try {
  // noinspection UnnecessaryLocalVariableJS
  const configsJson: typeof import("../../configs.json") = JSON.parse(fs.readFileSync("./configs.json").toString("utf-8"));
  configs = deepMerge(configs, configsJson);
  
  for(const movedOption of movedPostsOptions) {
    if(configs[movedOption] !== undefined) {
      console.error(`${chalk.bold.yellow("Warning!")} Config option ${movedOption} is deprecated and will be removed in future releases, use posts.${movedOption} instead!`);
      (configs.posts as any)[movedOption] = configs[movedOption];
    }
  }
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
    
    if(isPlainObject(base[key]) && isPlainObject(object[key])) ret[key] = deepMerge(base[key] as any, object[key]);
  }
  
  return ret;
}
