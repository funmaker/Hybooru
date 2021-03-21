import SQL from "sql-template-strings";
import * as db from "../db";
import { Import } from "./index";

export default class Urls extends Import {
  display = "Tags";
  
  async total() {
    const res = await this.hydrus.get<{ count: number }>(SQL`SELECT count(1) AS count FROM urls`);
    
    return res!.count;
  }
  
  async importBatch(offset: number, limit: number) {
    const urls = await this.hydrus.all(SQL`
      SELECT
        urls.url_id AS id,
        url_map.hash_id AS postid,
        urls.url
      FROM urls
        INNER JOIN url_map ON url_map.url_id = urls.url_id
      ORDER BY urls.url_id
      LIMIT ${limit}
      OFFSET ${offset}
    `);
    
    await db.query(SQL`
      INSERT INTO urls(id, postid, url)
      SELECT x.id, x.postid, x.url
      FROM json_to_recordset(${JSON.stringify(urls)})
        AS x(
          id INTEGER,
          postid INTEGER,
          url TEXT
        )
        INNER JOIN posts ON posts.id = x.postid
    `, true);
  }
}
