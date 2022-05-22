import SQL from "sql-template-strings";
import { Database } from "better-sqlite3";
import { PoolClient } from "pg";
import { ContentStatus } from "../consts";
import { Import } from "./import";

export default class TagParents extends Import {
  display = "Tag parents";
  
  initialKey = [-1, -1];
  totalQuery = '';
  outputQuery = 'COPY tag_parents_temp(tagid, parentid) FROM STDIN (FORMAT CSV)';
  inputQuery = ``;
  
  constructor(hydrus: Database, postgres: PoolClient, services: number[]) {
    super(hydrus, postgres);
    
    this.inputQuery = `
      SELECT
        child_tag_id,
        parent_tag_id,
        child_tag_id || ',' || parent_tag_id || '\n'
      FROM tag_parents
      WHERE service_id IN (${services.join(", ")}) AND status = ${ContentStatus.CURRENT} AND (child_tag_id, parent_tag_id) > (?, ?)
      ORDER BY child_tag_id, parent_tag_id
      LIMIT ?
    `;
    
    this.totalQuery = `SELECT count(1) FROM tag_parents WHERE service_id IN (${services.join(", ")}) AND status=${ContentStatus.CURRENT}`;
  }
  
  async beforeImport() {
    await this.postgres.query(SQL`
      CREATE TEMP TABLE tag_parents_temp (LIKE tag_parents);
    `);
  }
  
  async afterImport() {
    await this.postgres.query(SQL`
      INSERT INTO tag_parents SELECT * FROM tag_parents_temp ON CONFLICT DO NOTHING;
      DROP TABLE tag_parents_temp;
    `);
  }
}
