import { Import } from "./import";

export default class Mappings extends Import {
  display = "Mappings";
  
  inputTable = () => `current_mappings_${this.service?.id}`;
  
  initialKey = [-1, -1];
  outputTable = "mappings";
  totalQuery = () => `SELECT count(1) FROM ${this.inputTable()}`;
  outputQuery = (table: string) => `COPY ${table}(postid, tagid) FROM STDIN (FORMAT CSV)`;
  inputQuery = () => `
    SELECT
      mappings.hash_id,
      mappings.tag_id,
      mappings.hash_id || ',' ||
      mappings.tag_id || '\n'
    FROM ${this.inputTable()} mappings
    WHERE (mappings.hash_id, mappings.tag_id) > (?, ?)
    ORDER BY mappings.hash_id, mappings.tag_id
    LIMIT ?
  `;
}
