import { Database } from "better-sqlite3";
import { PoolClient } from "pg";
import SQL from "sql-template-strings";
import { ContentStatus } from "../consts";
import { Import } from "./import";

export default class TagSiblings extends Import {
  display = "Tag siblings";
  
  
  outputTable = "tag_siblings";
  totalQuery = () => `SELECT count(1) FROM tag_siblings WHERE service_id IN (${this.services.join(", ")}) AND status=${ContentStatus.CURRENT}`;
  outputQuery = (table: string) => `COPY ${table}(tagid, betterid) FROM STDIN (FORMAT CSV)`;
  inputQuery = () => `
    SELECT
      bad_tag_id,
      bad_tag_id || ',' || good_tag_id || '\n'
    FROM tag_siblings
    WHERE service_id IN (${this.services.join(", ")}) AND status = ${ContentStatus.CURRENT} AND bad_tag_id > ?
    ORDER BY bad_tag_id
    LIMIT ?
  `;
  
  constructor(hydrus: Database, postgres: PoolClient, public services: number[]) {
    super(hydrus, postgres);
    
    this.useTemp = true;
  }
}
