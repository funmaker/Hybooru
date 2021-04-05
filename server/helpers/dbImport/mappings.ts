import { Writable } from "stream";
import { Database, Statement } from "better-sqlite3";
import { PoolClient } from "pg";
import { ServiceID } from "../consts";
import { Import } from "./index";

export default class Mappings extends Import<[number, number]> {
  display = "Mappings";
  
  totalQuery = '';
  outputQuery = 'COPY mappings(postid, tagid) FROM STDIN (FORMAT CSV)';
  inputQuery = '';
  
  constructor(hydrus: Database, postgres: PoolClient) {
    super(hydrus, postgres);
    
    const service: { id: number } = hydrus.prepare(`SELECT service_id AS id FROM services WHERE service_type = ${ServiceID.LOCAL_TAG} LIMIT 1`).get();
    if(!service) throw new Error("Unable to locate local tags service!");
    
    const mappingsTable = `current_mappings_${service.id}`;
    
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
  
  async importBatch(lastKey: [number, number] | null, limit: number, input: Statement, output: Writable): Promise<[number, number] | null> {
    const rows = input.all(lastKey === null ? -1 : lastKey[0], lastKey === null ? -1 : lastKey[1], limit);
    
    let buf = "";
    for(const row of rows) {
      buf += row[2];
    }
    output.write(buf);
    
    if(rows.length > 0) return [rows[rows.length - 1][0], rows[rows.length - 1][1]];
    else return null;
  }
}
