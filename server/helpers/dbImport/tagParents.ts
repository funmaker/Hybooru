import { Database } from "better-sqlite3";
import { PoolClient } from "pg";
import { ContentStatus } from "../consts";
import { Import } from "./import";

export default class TagParents extends Import {
  display = "Tag parents";
  
  initialKey = [-1, -1];
  outputTable = "tag_parents";
  totalQuery = () => `SELECT count(1) FROM tag_parents WHERE service_id IN (${this.services.join(", ")}) AND status=${ContentStatus.CURRENT}`;
  outputQuery = (table: string) => `COPY ${table}(tagid, parentid) FROM STDIN (FORMAT CSV)`;
  inputQuery = () => `
    SELECT
      child_tag_id,
      parent_tag_id,
      child_tag_id || ',' || parent_tag_id || '\n'
    FROM tag_parents
    WHERE service_id IN (${this.services.join(", ")}) AND status = ${ContentStatus.CURRENT} AND (child_tag_id, parent_tag_id) > (?, ?)
    ORDER BY child_tag_id, parent_tag_id
    LIMIT ?
  `;
  
  constructor(hydrus: Database, postgres: PoolClient, public services: number[]) {
    super(hydrus, postgres);
    
    this.useTemp = true;
  }
}
