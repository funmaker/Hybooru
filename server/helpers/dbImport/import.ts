import { Writable } from "stream";
import { Database, Statement } from "better-sqlite3";
import { PoolClient } from "pg";
import copy from "pg-copy-streams";
import configs from "../configs";
import { printProgress } from "./pretty";

export abstract class Import {
  constructor(protected hydrus: Database, protected postgres: PoolClient) {}
  
  abstract display: string;
  batchSizeMul = 1;
  initialKey: any[] = [-1];
  
  abstract totalQuery: string;
  abstract inputQuery: string;
  abstract outputQuery: string;
  
  total() {
    return this.hydrus.prepare(this.totalQuery).raw().get()[0];
  }
  
  async importBatch(lastKey: any[], limit: number, input: Statement, output: Writable): Promise<any[] | null> {
    const rows = input.all(...lastKey, limit);
    
    let buf = "";
    for(const row of rows) {
      buf += row.pop();
    }
    output.write(buf);
    
    if(rows.length > 0) return rows[rows.length - 1];
    else return null;
  }
  
  async start() {
    printProgress(false, this.display);
    
    const batchSize = Math.ceil(configs.importBatchSize * this.batchSizeMul);
    const total = await this.total();
    let count = 0;
    
    if(total === 0) {
      printProgress(true, this.display);
      return;
    }
    
    const input = this.hydrus.prepare(this.inputQuery).raw(true);
    const output: Writable = await this.postgres.query(copy.from(this.outputQuery));
    
    let lastKey: any[] = this.initialKey;
    
    printProgress([0, total], this.display);
    
    // eslint-disable-next-line no-constant-condition
    while(true) {
      const result = await this.importBatch(lastKey, batchSize, input, output);
      if(!result) break;
      lastKey = result;
      count += batchSize;
      
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
