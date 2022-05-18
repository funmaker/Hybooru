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
  
  constructor(hydrus: Database, postgres: PoolClient, service: number, private useTemp: boolean = false) {
    super(hydrus, postgres);
    
    const mappingsTable = `current_mappings_${service}`;
    const outputTable = useTemp ? 'mappings_temp' : 'mappings';
    
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
    
    this.outputQuery = `COPY ${outputTable}(postid, tagid) FROM STDIN (FORMAT CSV)`;
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
