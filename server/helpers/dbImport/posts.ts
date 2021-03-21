import SQL from "sql-template-strings";
import * as db from "../db";
import { ServiceID } from "../consts";
import { Import } from "./index";

export default class Posts extends Import {
  display = "Posts";
  
  async total() {
    const res = await this.hydrus.get<{ count: number }>(SQL`
      SELECT count(1) AS count
      FROM current_files
        LEFT JOIN services ON services.service_id = current_files.service_id
      WHERE services.service_type = ${ServiceID.LOCAL_FILE_DOMAIN} AND services.name != 'repository updates'
    `);
    
    return res!.count;
  }
  
  async importBatch(offset: number, limit: number) {
    const posts = await this.hydrus.all(SQL`
      SELECT
        current_files.hash_id AS id,
        hashes.hash,
        files_info.size,
        files_info.width,
        files_info.height,
        files_info.duration,
        files_info.num_frames,
        files_info.has_audio,
        local_ratings.rating,
        files_info.mime,
        current_files.timestamp as posted
      FROM current_files
        LEFT JOIN services ON services.service_id = current_files.service_id
        LEFT JOIN files_info ON files_info.hash_id = current_files.hash_id
        LEFT JOIN hashes ON hashes.hash_id = current_files.hash_id
        LEFT JOIN local_ratings ON local_ratings.hash_id = current_files.hash_id
      WHERE services.service_type = ${ServiceID.LOCAL_FILE_DOMAIN} AND services.name != 'repository updates'
      ORDER BY current_files.hash_id
      LIMIT ${limit}
      OFFSET ${offset}
    `);
    
    for(const post of posts) {
      post.hash = post.hash.toString("base64");
    }
    
    await db.query(SQL`
      INSERT INTO posts(id, hash, size, width, height, duration, num_frames, has_audio, rating, mime, posted)
      SELECT id, decode(hash, 'base64') as hash, size, width, height, duration, num_frames, has_audio, rating, mime, to_timestamp(posted)
      FROM json_to_recordset(${JSON.stringify(posts)})
        AS x(
          id INTEGER,
          hash TEXT,
          size INTEGER,
          width INTEGER,
          height INTEGER,
          duration FLOAT,
          num_frames INTEGER,
          has_audio BOOLEAN,
          rating FLOAT,
          mime INTEGER,
          posted INTEGER
        )
    `, true);
  }
}
