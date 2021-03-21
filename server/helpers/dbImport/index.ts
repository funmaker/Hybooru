import sqlite from "sqlite";
import chalk from "chalk";

const BATCH_SIZE = 1024;
const BAR_LENGTH = 20;

let lastProgressName: string | null = null;

export function printProgress(done: boolean, name: string): void;
export function printProgress(progress: [number, number], name: string): void;
export function printProgress(progress: boolean | [number, number], name: string) {
  if(lastProgressName !== null && lastProgressName !== name) printProgress(true, lastProgressName);
  
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  
  let bar, done;
  if(typeof progress === "boolean") {
    bar = progress ? BAR_LENGTH : 0;
    done = progress;
  } else {
    bar = Math.round(progress[0] / progress[1] * BAR_LENGTH);
    done = progress[0] === progress[1];
  }
  
  let out = `${chalk.white("[") + chalk.cyan("#".repeat(bar)) + chalk.gray("#".repeat(BAR_LENGTH - bar)) + chalk.white("]")} ${name} `;
  if(Array.isArray(progress)) out += `${progress[0]}/${progress[1]} `;
  
  if(done) {
    out += chalk.green.bold("Done\n");
    lastProgressName = null;
  } else {
    lastProgressName = name;
  }
  
  process.stdout.write(out);
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
