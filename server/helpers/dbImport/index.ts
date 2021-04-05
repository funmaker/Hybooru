import { Writable } from "stream";
import { Database, Statement } from "better-sqlite3";
import { PoolClient } from "pg";
import copy from "pg-copy-streams";
import configs from "../configs";
import { printProgress, elapsed } from "./pretty";

export abstract class Import<Key> {
  constructor(protected hydrus: Database, protected postgres: PoolClient) {}
  
  abstract display: string;
  batchSizeMul = 1;
  
  abstract totalQuery: string;
  abstract inputQuery: string;
  abstract outputQuery: string;
  
  total() {
    return this.hydrus.prepare(this.totalQuery).raw().get()[0];
  }
  
  async importBatch(lastKey: Key | null, limit: number, input: Statement, output: Writable): Promise<Key | null> {
    const rows = input.all(lastKey === null ? -1 : lastKey, limit);
    
    let buf = "";
    for(const row of rows) {
      buf += row[1];
    }
    output.write(buf);
    
    if(rows.length > 0) return rows[rows.length - 1][0];
    else return null;
  }
  
  async start() {
    const batchSize = Math.ceil(configs.importBatchSize * this.batchSizeMul);
    const total = await this.total();
    
    const input = this.hydrus.prepare(this.inputQuery).raw(true);
    const output: Writable = await this.postgres.query(copy.from(this.outputQuery));
    
    let lastKey: Key | null = null;
    
    for(let count = 0; count < total; count += batchSize) {
      lastKey = await this.importBatch(lastKey, batchSize, input, output);
      if(lastKey === null) break;
      
      if(output.writableLength > output.writableHighWaterMark) {
        printProgress([count, total], this.display);
        await new Promise(res => output.once("drain", res));
      } else {
        await new Promise(res => setImmediate(res));
      }
    }
    
    await new Promise(res => output.end(res));
    
    printProgress([total, total], this.display);
  }
}

export { default as Posts } from "./posts";
export { default as Tags } from "./tags";
export { default as Mappings } from "./mappings";
export { default as Urls } from "./urls";
export { printProgress, elapsed };
