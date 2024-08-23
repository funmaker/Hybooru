import { PoolClient } from "pg";
import { Database } from "better-sqlite3";
import { ServiceID } from "../consts";
import { Import } from "./import";
import { Service } from "./index";

export default class Posts extends Import {
  display = "Posts";
  
  inputTable = () => `current_files_${this.service?.id || 0}`;
  
  batchSizeMul = 1 / 2;
  outputTable = "posts";
  totalQuery = () => `SELECT count(1) FROM ${this.inputTable()}`;
  outputQuery = (table: string) => `COPY ${table}(id, sha256, md5, blurhash, size, width, height, duration, num_frames, has_audio, rating, mime, inbox, trash, posted) FROM STDIN (FORMAT CSV)`;
  inputQuery = () => `
    SELECT
      current_files.hash_id,
      current_files.hash_id || ',' ||
      '\\x' || hex(hashes.hash) || ',' ||
      COALESCE('\\x' || NULLIF(hex(local_hashes.md5), ''), '') || ',' ||
      COALESCE('"' || blurhashes.blurhash || '"', '') || ',' ||
      COALESCE(files_info.size, '') || ',' ||
      COALESCE(files_info.width, '') || ',' ||
      COALESCE(files_info.height, '') || ',' ||
      COALESCE(files_info.duration, '') || ',' ||
      COALESCE(files_info.num_frames, '') || ',' ||
      COALESCE(files_info.has_audio, '') || ',' ||
      COALESCE(local_ratings.rating, '') || ',' ||
      COALESCE(files_info.mime, '') || ',' ||
      (file_inbox.hash_id IS NOT NULL) || ',' ||
      ${this.service?.type === ServiceID.LOCAL_FILE_TRASH_DOMAIN} || ',' ||
      datetime(current_files.timestamp_ms / 1000, 'unixepoch', 'utc') || '\n'
    FROM ${this.inputTable()} current_files
      INNER JOIN hashes ON hashes.hash_id = current_files.hash_id
      LEFT JOIN files_info ON files_info.hash_id = current_files.hash_id
      LEFT JOIN local_hashes ON local_hashes.hash_id = current_files.hash_id
      LEFT JOIN blurhashes ON blurhashes.hash_id = current_files.hash_id
      LEFT JOIN local_ratings ON local_ratings.service_id = ${this.ratingService?.id || null} AND local_ratings.hash_id = current_files.hash_id
      LEFT JOIN file_inbox ON file_inbox.hash_id = current_files.hash_id
    WHERE current_files.hash_id > ?
    ORDER BY current_files.hash_id ASC
    LIMIT ?
  `;
  
  constructor(hydrus: Database, postgres: PoolClient, public ratingService: Service | null) {
    super(hydrus, postgres);
  }
}
