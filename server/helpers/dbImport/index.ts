import readline from "readline";
import sqlite from "sqlite";
import chalk from "chalk";
import configs from "../configs";

const BATCH_SIZE = 1024;
const BAR_LENGTH = 20;

let lastProgressName: string | null = null;
let lastProgressBars = 0;
let currentProgressStart = Date.now();

export function elapsed(since: number) {
  const duration = (Date.now() - since) / 1000;
  
  if(duration < 1) return `${Math.floor(duration * 1000)}ms`;
  else if(duration < 60) return `${duration.toFixed(2)}s`;
  else if(duration < 60 * 60) return `${Math.floor(duration / 60)}:${Math.floor(duration % 60)}`;
  else return `${Math.floor(duration / 60 / 60)}:${Math.floor(duration / 60 % 60)}:${Math.floor(duration % 60)}`;
}

export function printProgress(done: boolean, name: string): void;
export function printProgress(progress: [number, number], name: string): void;
export function printProgress(progress: boolean | [number, number], name: string) {
  if(lastProgressName !== null && lastProgressName !== name) printProgress(true, lastProgressName);
  
  const fancy = typeof configs.isTTY === "boolean" ? configs.isTTY : process.stdout.isTTY;
  
  let bar, done;
  if(typeof progress === "boolean") {
    bar = progress ? BAR_LENGTH : 0;
    done = progress;
  } else {
    bar = Math.round(progress[0] / progress[1] * BAR_LENGTH);
    done = progress[0] === progress[1];
  }
  
  if(fancy) {
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    
    let out = name;
    if(Array.isArray(progress)) out += ` (${progress[0]}/${progress[1]})`;
    out = out.padEnd(32, " ");
    out += `${chalk.white("[") + chalk.cyan("#".repeat(bar)) + chalk.gray("-".repeat(BAR_LENGTH - bar)) + chalk.white("]")} `;
    if(done) out += `${chalk.green.bold("Done")} in ${elapsed(currentProgressStart)}\n`;
    
    process.stdout.write(out);
  } else {
    let out = "";
    
    if(lastProgressName === null) {
      out += name;
      if(Array.isArray(progress)) out += ` (${progress[1]})`;
      out = out.padEnd(32, " ");
      out += "[";
    }
    out += "#".repeat(bar - lastProgressBars);
    if(done) out += `] Done in ${elapsed(currentProgressStart)}\n`;
    
    process.stdout.write(out);
  }
  
  if(done) {
    lastProgressName = null;
    lastProgressBars = 0;
  } else {
    if(lastProgressName === null) currentProgressStart = Date.now();
    lastProgressBars = bar;
    lastProgressName = name;
  }
}

export abstract class Import {
  constructor(protected hydrus: sqlite.Database) {}
  
  abstract display: string;
  abstract total(): Promise<number>;
  abstract importBatch(offset: number, limit: number): Promise<void>;
  
  async start() {
    const total = await this.total();
    
    for(let offset = 0; offset < total; offset += BATCH_SIZE) {
      printProgress([offset, total], this.display);
      await this.importBatch(offset, BATCH_SIZE);
    }
    
    printProgress([total, total], this.display);
  }
}

export { default as Posts } from "./posts";
export { default as Tags } from "./tags";
export { default as Mappings } from "./mappings";
export { default as Urls } from "./urls";
