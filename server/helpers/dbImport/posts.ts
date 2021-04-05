import { ServiceID } from "../consts";
import { Import } from "./index";

export default class Posts extends Import<number> {
  display = "Posts";
  batchSizeMul = 1 / 2;
  
  totalQuery = `
    SELECT count(1)
    FROM current_files
      LEFT JOIN services ON services.service_id = current_files.service_id
    WHERE services.service_type = ${ServiceID.LOCAL_FILE_DOMAIN} AND services.name != 'repository updates'
  `;
  
  outputQuery = 'COPY posts(id, hash, size, width, height, duration, num_frames, has_audio, rating, mime, posted) FROM STDIN (FORMAT CSV)';
  inputQuery = `
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
    FROM current_files
      LEFT JOIN services ON services.service_id = current_files.service_id
      LEFT JOIN files_info ON files_info.hash_id = current_files.hash_id
      LEFT JOIN hashes ON hashes.hash_id = current_files.hash_id
      LEFT JOIN local_ratings ON local_ratings.hash_id = current_files.hash_id
    WHERE services.service_type = ${ServiceID.LOCAL_FILE_DOMAIN}
      AND services.name != 'repository updates'
      AND current_files.hash_id > ?
    ORDER BY current_files.hash_id ASC
    LIMIT ?
  `;
}
