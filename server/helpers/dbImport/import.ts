import { Writable } from "stream";
import { Database, Statement } from "better-sqlite3";
import { PoolClient } from "pg";
import copy from "pg-copy-streams";
import configs from "../configs";
import { printProgress } from "./pretty";
import { Service } from "./index";

export abstract class Import<S = Service> {
  constructor(protected hydrus: Database, protected postgres: PoolClient) {}
  
  abstract display: string;
  service?: S;
  batchSizeMul = 1;
  initialKey: any[] = [-1];
  useTemp = false;
  
  abstract outputTable: string;
  abstract totalQuery(): string;
  abstract inputQuery(): string;
  abstract outputQuery(table: string): string;
  
  private totalCount: number | null = null;
  
  total() {
    if(this.totalCount === null) this.totalCount = this.hydrus.prepare(this.totalQuery()).raw().get()[0];
    return this.totalCount!;
  }
  
  resetTotal(total: null | number = null) {
    this.totalCount = total;
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
    const total = this.total();
    let count = 0;
    
    if(total === 0) {
      printProgress(true, this.display);
      return;
    }
    
    printProgress([0, total], this.display);
    
    const outputTable = await this.beforeImport();
    
    const input = this.hydrus.prepare(this.inputQuery()).raw(true);
    const output: Writable = await this.postgres.query(copy.from(this.outputQuery(outputTable)));
    
    let lastKey: any[] = this.initialKey;
    
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
    
    await this.afterImport();
    
    printProgress([total, total], this.display);
  }
  
  async startEach(services: S[]) {
    const sizes = services.map(service => {
      this.resetTotal();
      this.service = service;
      return { service, total: this.total() };
    });
    
    sizes.sort((a, b) => b.total - a.total);
    
    for(const { service, total } of sizes) {
      if(total === 0) continue;
      
      this.resetTotal(total);
      this.service = service;
      
      await this.start();
      
      this.useTemp = true;
    }
  }
  
  async beforeImport() {
    if(this.useTemp) {
      await this.postgres.query(`
        CREATE TEMP TABLE ${this.outputTable}_temp (LIKE ${this.outputTable});
      `);
      return `${this.outputTable}_temp`;
    }
    
    return this.outputTable;
  }
  
  async afterImport() {
    if(this.useTemp) {
      await this.postgres.query(`
        INSERT INTO ${this.outputTable} SELECT * FROM ${this.outputTable}_temp ON CONFLICT DO NOTHING;
        DROP TABLE ${this.outputTable}_temp;
      `);
    }
  }
}
