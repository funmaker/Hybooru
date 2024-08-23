import { Database } from "better-sqlite3";
import { PoolClient } from "pg";
import { Import } from "./import";

export default class TagParents extends Import {
  display = "Tag parents";
  
  inputTable = () => `current_tag_parents_${this.service?.id}`;
  
  initialKey = [-1, -1];
  outputTable = "tag_parents";
  totalQuery = () => `SELECT count(1) FROM ${this.inputTable()}`;
  outputQuery = (table: string) => `COPY ${table}(tagid, parentid) FROM STDIN (FORMAT CSV)`;
  inputQuery = () => `
    SELECT
      child_tag_id,
      parent_tag_id,
      child_tag_id || ',' || parent_tag_id || '\n'
    FROM ${this.inputTable()}
    WHERE (child_tag_id, parent_tag_id) > (?, ?)
    ORDER BY child_tag_id, parent_tag_id
    LIMIT ?
  `;
  
  constructor(hydrus: Database, postgres: PoolClient) {
    super(hydrus, postgres);
    
    this.useTemp = true;
  }
}
