import { Database } from "better-sqlite3";
import { PoolClient } from "pg";
import { Import } from "./import";

export default class TagSiblings extends Import {
  display = "Tag siblings";
  
  inputTable = () => `current_tag_siblings_${this.service?.id}`;
  
  outputTable = "tag_siblings";
  totalQuery = () => `SELECT count(1) FROM ${this.inputTable()}`;
  outputQuery = (table: string) => `COPY ${table}(tagid, betterid) FROM STDIN (FORMAT CSV)`;
  inputQuery = () => `
    SELECT
      bad_tag_id,
      bad_tag_id || ',' || good_tag_id || '\n'
    FROM ${this.inputTable()}
    WHERE bad_tag_id > ?
    ORDER BY bad_tag_id
    LIMIT ?
  `;
  
  constructor(hydrus: Database, postgres: PoolClient) {
    super(hydrus, postgres);
    
    this.useTemp = true;
  }
}
