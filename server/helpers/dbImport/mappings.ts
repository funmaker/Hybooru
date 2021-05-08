import { Database } from "better-sqlite3";
import { PoolClient } from "pg";
import { Import } from "./import";

export default class Mappings extends Import {
  display = "Mappings";
  
  initialKey = [-1, -1];
  totalQuery = '';
  outputQuery = 'COPY mappings(postid, tagid) FROM STDIN (FORMAT CSV)';
  inputQuery = '';
  
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
}
