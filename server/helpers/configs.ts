/* eslint-disable */
import * as fs from 'fs';
import pg from "pg";
import { Theme } from "../../client/hooks/useTheme";
import chalk from "chalk";
import { ThumbnailsMode } from "../routes/apiTypes";

interface Configs {
  port: number,
  host: string | null,
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
    filesPathOverride: string | null,
    thumbnailsPathOverride: string | null,
    thumbnailsMode: string,
    pageSize: number,
    cachePages: number,
    cacheRecords: number,
    maxPreviewSize: number,
  },
  tags: {
    services: Array<string | number> | null,
    motd: string | Partial<Record<Theme, string>> | null,
    untagged: string,
    ignore: string[],
    blacklist: string[] | null,
    whitelist: string[] | null,
    resolveRelations: boolean,
    reportLoops: boolean,
    searchSummary: number,
  },
  rating: {
    enabled: boolean,
    service: string | number | null,
    stars: number,
    /** @deprecated */
    serviceName?: string | null,
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
  host: null,
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
    filesPathOverride: null,
    thumbnailsPathOverride: null,
    thumbnailsMode: ThumbnailsMode.FIT,
    pageSize: 72,
    cachePages: 5,
    cacheRecords: 1024,
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
    service: null,
  },
  versionCheck: {
    enabled: true,
    owner: "funmaker",
    repo: "hybooru",
    cacheLifeMs: 3600000
  }
};

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

const movedOptions = ["pageSize", "cachePages", "cacheRecords", "filesPathOverride", "thumbnailsPathOverride", "maxPreviewSize"] as const;

try {
  // noinspection UnnecessaryLocalVariableJS
  const configsJson: typeof import("../../configs.json") = JSON.parse(fs.readFileSync("./configs.json").toString("utf-8"));
  configs = deepMerge(configs, configsJson);
  
  for(const movedOption of movedOptions) {
    if(configs[movedOption] !== undefined) {
      console.error(`${chalk.bold.yellow("Warning!")} Config option ${movedOption} is deprecated and will be removed in future releases, use posts.${movedOption} instead!`);
      (configs.posts as any)[movedOption] ??= configs[movedOption];
    }
  }
  
  if(configs.rating?.serviceName !== undefined) {
    console.error(`${chalk.bold.yellow("Warning!")} Config option rating.serviceName is deprecated and will be removed in future releases, use rating.service instead!`);
    configs.rating.service ??= configs.rating.serviceName;
  }
} catch(e) {
  console.error("Failed to read configs.json");
  console.error(e);
  
  throw e;
}

if(process.env.HYDRUS_ADMIN_PASSWORD) {
  configs.adminPassword = process.env.HYDRUS_ADMIN_PASSWORD;
}

if(configs.posts.thumbnailsMode !== ThumbnailsMode.FIT && configs.posts.thumbnailsMode !== ThumbnailsMode.FILL) {
  console.error(`${chalk.bold.yellow("Warning!")} Config option posts.thumbnailsMode should be "fit" or "fill", got ${JSON.stringify(configs.posts.thumbnailsMode)}!`);
  configs.posts.thumbnailsMode = "fit";
}

export default configs;
