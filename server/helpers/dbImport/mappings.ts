import SQL from "sql-template-strings";
import * as db from "../db";
import { Import } from "./index";

export default class Mappings extends Import {
  display = "Mappings";
  
  async total() {
    const res = await this.hydrus.get<{ count: number }>(SQL`SELECT count(1) AS count FROM current_mappings_7`);
    
    return res!.count;
  }
  
  async importBatch(offset: number, limit: number) {
    const mappings = await this.hydrus.all(SQL`
      SELECT
        current_mappings_7.hash_id as postid,
        current_mappings_7.tag_id as tagid
      FROM current_mappings_7
      ORDER BY current_mappings_7.hash_id, current_mappings_7.tag_id
      LIMIT ${limit}
      OFFSET ${offset}
    `);
    
    await db.query(SQL`
      INSERT INTO mappings(postid, tagid)
      SELECT x.postid, x.tagid
      FROM json_to_recordset(${JSON.stringify(mappings)})
        AS x(
          postid INTEGER,
          tagid INTEGER
        )
        INNER JOIN posts ON posts.id = x.postid
        INNER JOIN tags ON tags.id = x.tagid
    `, true);
  }
}
