import { PoolClient } from "pg";
import { Database } from "better-sqlite3";
import { Import } from "./import";

export default class Posts extends Import {
  display = "Posts";
  
  service = 0;
  inputTable = () => `current_files_${this.service}`;
  
  batchSizeMul = 1 / 2;
  outputTable = "posts";
  totalQuery = () => `SELECT count(1) FROM ${this.inputTable()}`;
  outputQuery = (table: string) => `COPY ${table}(id, hash, size, width, height, duration, num_frames, has_audio, rating, mime, posted) FROM STDIN (FORMAT CSV)`;
  inputQuery = () => `
    SELECT
      current_files.hash_id,
      current_files.hash_id || ',' ||
      '\\x' || hex(hashes.hash) || ',' ||
      COALESCE(files_info.size, '') || ',' ||
      COALESCE(files_info.width, '') || ',' ||
      COALESCE(files_info.height, '') || ',' ||
      COALESCE(files_info.duration, '') || ',' ||
      COALESCE(files_info.num_frames, '') || ',' ||
      COALESCE(files_info.has_audio, '') || ',' ||
      COALESCE(local_ratings.rating, '') || ',' ||
      COALESCE(files_info.mime, '') || ',' ||
      datetime(current_files.timestamp, 'unixepoch', 'utc') || '\n'
    FROM ${this.inputTable()} current_files
      LEFT JOIN files_info ON files_info.hash_id = current_files.hash_id
      LEFT JOIN hashes ON hashes.hash_id = current_files.hash_id
      LEFT JOIN local_ratings ON local_ratings.service_id = ${this.ratingService} AND local_ratings.hash_id = current_files.hash_id
    WHERE current_files.hash_id > ?
    ORDER BY current_files.hash_id ASC
    LIMIT ?
  `;
  
  constructor(hydrus: Database, postgres: PoolClient, public ratingService: number | null) {
    super(hydrus, postgres);
  }
  
  async startEach(services: number[]) {
    const sizes = services.map(service => {
      this.resetTotal();
      this.service = service;
      return { service, total: this.total() };
    });
    
    sizes.sort((a, b) => b.total - a.total);
    
    for(const { service, total } of sizes) {
      if(total === 0) continue;
      
      this.resetTotal(total);
      this.service = service;
      await this.start();
    }
  }
}
