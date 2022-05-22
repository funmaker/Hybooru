import SQL from "sql-template-strings";
import { Database } from "better-sqlite3";
import { PoolClient } from "pg";
import { Import } from "./import";

export default class Mappings extends Import {
  display = "Mappings";
  
  initialKey = [-1, -1];
  totalQuery = '';
  outputQuery = '';
  inputQuery = '';
  
  private useTemp = false;
  
  constructor(hydrus: Database, postgres: PoolClient, service: number) {
    super(hydrus, postgres);
    
    const mappingsTable = `current_mappings_${service}`;
    
    this.inputQuery = `
      SELECT
        mappings.hash_id,
        mappings.tag_id,
        mappings.hash_id || ',' ||
        mappings.tag_id || '\n'
      FROM ${mappingsTable} mappings
      WHERE (mappings.hash_id, mappings.tag_id) > (?, ?)
      ORDER BY mappings.hash_id, mappings.tag_id
      LIMIT ?
    `;
    
    this.totalQuery = `SELECT count(1) FROM ${mappingsTable}`;
  }
  
  async start(useTemp?: boolean) {
    if(useTemp !== undefined) this.useTemp = useTemp;
    
    const outputTable = this.useTemp ? 'mappings_temp' : 'mappings';
    this.outputQuery = `COPY ${outputTable}(postid, tagid) FROM STDIN (FORMAT CSV)`;
    
    return await super.start();
  }
  
  async beforeImport() {
    if(this.useTemp) {
      await this.postgres.query(SQL`
        CREATE TEMP TABLE mappings_temp (LIKE mappings);
      `);
    }
  }
  
  async afterImport() {
    if(this.useTemp) {
      await this.postgres.query(SQL`
        INSERT INTO mappings SELECT * FROM mappings_temp ON CONFLICT DO NOTHING;
        DROP TABLE mappings_temp;
      `);
    }
  }
}
