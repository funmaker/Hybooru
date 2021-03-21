import SQL from "sql-template-strings";
import * as db from "../db";
import { Import } from "./index";

export default class Tags extends Import {
  display = "Tags";
  
  async total() {
    const res = await this.hydrus.get<{ count: number }>(SQL`SELECT count(1) AS count FROM tags`);
    
    return res!.count;
  }
  
  async importBatch(offset: number, limit: number) {
    const tags = await this.hydrus.all(SQL`
      SELECT
        tags.tag_id AS id,
        CASE WHEN namespaces.namespace IS NOT NULL AND namespaces.namespace != ''
          THEN namespaces.namespace || ':' || subtags.subtag
          ELSE subtags.subtag
        END AS name,
        subtags.subtag
      FROM tags
        INNER JOIN subtags ON subtags.subtag_id = tags.subtag_id
        INNER JOIN namespaces ON namespaces.namespace_id = tags.namespace_id
      ORDER BY tags.tag_id
      LIMIT ${limit}
      OFFSET ${offset}
    `);
    
    await db.query(SQL`
      INSERT INTO tags(id, name, subtag, used)
      SELECT id, REPLACE(name, ' ', '_'), REPLACE(subtag, ' ', '_'), -1
      FROM json_to_recordset(${JSON.stringify(tags)})
        AS x(
          id INTEGER,
          name TEXT,
          subtag TEXT
        )
    `, true);
  }
}
