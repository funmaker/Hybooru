import chalk, { Chalk } from "chalk";
import SQL from "sql-template-strings";
import { elapsed } from "../helpers/dbImport/pretty";
import { TagsSearchRequest } from "../routes/apiTypes";
import * as db from "../helpers/db";
import * as postsController from "./posts";
import * as tagsController from "./tags";
import * as globalController from "./global";

const SIZES = [1, 2, 4, 8, 16, 24, 32];
const PAGE_SIZE = 360; // default pageSize * cachePages

type TestCase = string | [string, number];

export async function doBenchmark() {
  console.log(chalk.cyan.bold("\nRunning benchmarks!\n"));
  
  const stats = await globalController.getStats();
  const tagsSearchResult = await tagsController.search({ full: false });
  const tags = Object.keys(tagsSearchResult.tags);
  
  const sizedEach =
    (callback: (id: number, size: number) => string) =>
      SIZES.map(size => new Array(size).fill(null).map((_, id) => callback(id, size)).join(" "));
  
  const sizedSampled =
    (callback: (tags: string[]) => string[], extra = "") =>
      SIZES.map(size =>
        callback(sample(tags, size)).join(" ") + (extra ? ` ${extra}` : ""));
  
  const alternate = (tags: string[]) => tags.map((tag, id) => id % 2 ? `-${tag}` : tag);
  const letter = (id: number) => String.fromCharCode("a".charCodeAt(0) + id % 26);
  
  const startTime = Date.now();
  const results: Record<string, any> = {};
  
  const postTests: Record<string, TestCase[]> = {
    blank: [""],
    tagged: ["*"],
    untagged: ["-*"],
    sum: sizedSampled(tags => tags),
    sub: sizedSampled(tags => tags.map(tag => `-${tag}`)),
    alt: sizedSampled(alternate),
    sizeAsc: sizedSampled(alternate, "order:size_asc"),
    sizeDesc: sizedSampled(alternate, "order:size_desc"),
    rating: sizedSampled(alternate, "rating:2-4"),
    inbox: sizedSampled(alternate, "system:inbox"),
    archive: sizedSampled(alternate, "system:archive"),
    trash: sizedSampled(alternate, "system:trash"),
    offset: SIZES.map(offset => ["", offset * PAGE_SIZE]),
    offset4: SIZES.map(offset => [alternate(sample(tags, 4)).join(" "), offset * PAGE_SIZE]),
    offset32: SIZES.map(offset => [alternate(sample(tags, 32)).join(" "), offset * PAGE_SIZE]),
    end: SIZES.map(offset => ["", Math.max(0, stats.posts - offset * PAGE_SIZE)]),
    starLS: sizedEach(id => `*${letter(id)}`),
    starLN: sizedEach(id => `-*${letter(id)}`),
    starLA: sizedEach(id => id % 2 ? `*${letter(id)}` : `-*${letter(id)}`),
    starRS: sizedEach(id => `${letter(id)}*`),
    starRN: sizedEach(id => `-${letter(id)}*`),
    starRA: sizedEach(id => id % 2 ? `${letter(id)}*` : `-${letter(id)}*`),
    starS: sizedEach(id => `*${letter(id)}*`),
    starN: sizedEach(id => `-*${letter(id)}*`),
    starA: sizedEach(id => id % 2 ? `*${letter(id)}*` : `-*${letter(id)}*`),
  };
  
  const tagsTests: Record<string, TagsSearchRequest[]> = {
    tStarL: SIZES.map(offset => ({ query: "*a", page: offset })),
    tStarR: SIZES.map(offset => ({ query: "*a", page: offset })),
    tStar: SIZES.map(offset => ({ query: "*a*", page: offset })),
    tIdAsc: SIZES.map(offset => ({ sorting: "id_asc", page: offset })),
    tIdDesc: SIZES.map(offset => ({ sorting: "id_desc", page: offset })),
    tStart: SIZES.map(offset => ({ page: offset })),
    tEnd: SIZES.map(offset => ({ page: tagsSearchResult.total / tagsSearchResult.pageSize - offset })),
  };
  
  const maxNameLength = [...Object.keys(postTests), ...Object.keys(tagsTests)].reduce((acc, val) => val.length > acc ? val.length : acc, 0);
  console.log(chalk.bold(`${" ".repeat(maxNameLength)} ${SIZES.map(size => `${size}`.padStart(6, " ")).join(" ")}`));
  
  for(const [name, cases] of Object.entries(postTests)) {
    process.stdout.write(`${" ".repeat(maxNameLength - name.length)}${name}`);
    await doTests(name, cases, getPosts, results);
  }
  
  for(const [name, cases] of Object.entries(tagsTests)) {
    process.stdout.write(`${" ".repeat(maxNameLength - name.length)}${name}`);
    await doTests(name, cases, getTags, results);
  }
  
  console.log();
  
  console.log(`   Posts ${chalk.bold(stats.posts)}`);
  console.log(`    Tags ${chalk.bold(stats.tags)}`);
  console.log(`Mappings ${chalk.bold(stats.mappings)}`);
  
  console.log(`${chalk.bold.green("\nBenchmarks completed")} in ${elapsed(startTime)}\n`);
  
  return results;
}

async function doTests<T>(name: string, cases: T[], callback: (testCase: T) => Promise<any>, results: Record<string, any>) {
  for(let sizeId = 0; sizeId < SIZES.length; sizeId++) {
    if(sizeId >= cases.length) {
      process.stdout.write(` ${chalk.gray("------")}`);
      continue;
    }
    
    const testCase = cases[sizeId];
    const testName = cases.length > 1 ? `${name}_${SIZES[sizeId]}` : name;
    const result = results[testName] = await callback(testCase);
    const execTime = result?.["QUERY PLAN"]?.[0]?.["Execution Time"];
    
    let color: keyof Chalk = "cyan";
    if(typeof execTime === "number") {
      if(execTime < 100) color = "green";
      else if(execTime < 1000) color = "yellow";
      else color = "red";
    }
    
    process.stdout.write(` ${chalk[color].bold(fixedFormatTime(execTime))}`);
  }
  
  console.log();
}

async function getPosts(testCase: TestCase) {
  let query: string;
  let offset = 0;
  if(Array.isArray(testCase)) [query, offset] = testCase;
  else query = testCase;
  
  const key = postsController.getCacheKey(query);
  key.offset = offset;
  
  const sql = postsController.getCachedPostsQuery(key);
  
  return await db.queryFirst<any>(SQL`EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON)\n`.append(sql));
}

async function getTags(testCase: TagsSearchRequest) {
  const sql = tagsController.tagSearchQuery(testCase);
  
  return await db.queryFirst<any>(SQL`EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON)\n`.append(sql));
}

function fixedFormatTime(ms: number | undefined) {
  if(typeof ms !== "number") return "   ???";
  
  if(ms < 10) return `${ms.toFixed(2)}ms`;
  else if(ms < 100) return `${ms.toFixed(1)}ms`;
  else if(ms < 1000) return ` ${ms.toFixed(0)}ms`;
  else if(ms < 1000 * 10) return ` ${(ms / 1000).toFixed(2)}s`;
  else if(ms < 1000 * 60) return ` ${(ms / 1000).toFixed(1)}s`;
  else if(ms < 1000 * 60 * 10) return ` ${(ms / 1000 / 60).toFixed(2)}m`;
  else if(ms < 1000 * 60 * 60) return ` ${(ms / 1000 / 60).toFixed(1)}m`;
  else if(ms < 1000 * 60 * 60 * 10) return ` ${(ms / 1000 / 60 / 60).toFixed(2)}h`;
  else if(ms < 1000 * 60 * 60 * 24) return ` ${(ms / 1000 / 60 / 60).toFixed(1)}h`;
  else return `  ${(ms / 1000 / 60 / 60).toFixed(0)}h`;
}

function sample<T>(array: T[]): T;
function sample<T>(array: T[], amount: number): T[];
function sample<T>(array: T[], amount?: number): T | T[] {
  if(typeof amount !== "number") {
    return array[Math.floor(Math.random() * array.length)];
  } else {
    array = array.slice();
    const ret: T[] = [];
    while(amount > 0 && array.length > 0) {
      ret.push(array.splice(Math.floor(Math.random() * array.length), 1)[0]);
      amount--;
    }
    return ret;
  }
}
