import { Database } from "better-sqlite3";
import { PoolClient } from "pg";
import SQL from "sql-template-strings";
import { ContentStatus } from "../consts";
import { Import } from "./import";

export default class TagSiblings extends Import {
  display = "Tag siblings";
  
  totalQuery = '';
  outputQuery = 'COPY tag_siblings_temp(tagid, betterid) FROM STDIN (FORMAT CSV)';
  inputQuery = ``;
  
  constructor(hydrus: Database, postgres: PoolClient, services: number[]) {
    super(hydrus, postgres);
    
    this.inputQuery = `
      SELECT
        bad_tag_id,
        bad_tag_id || ',' || good_tag_id || '\n'
      FROM tag_siblings
      WHERE service_id IN (${services.join(", ")}) AND status = ${ContentStatus.CURRENT} AND bad_tag_id > ?
      ORDER BY bad_tag_id
      LIMIT ?
    `;
    
    this.totalQuery = `SELECT count(1) FROM tag_siblings WHERE service_id IN (${services.join(", ")}) AND status=${ContentStatus.CURRENT}`;
  }
  
  async beforeImport() {
    await this.postgres.query(SQL`
      CREATE TEMP TABLE tag_siblings_temp (LIKE tag_siblings);
    `);
  }
  
  async afterImport() {
    await this.postgres.query(SQL`
      INSERT INTO tag_siblings SELECT * FROM tag_siblings_temp ON CONFLICT DO NOTHING;
      DROP TABLE tag_siblings_temp;
    `);
  }
}
