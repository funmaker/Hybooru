import { Import } from "./import";

export default class Urls extends Import {
  display = "Urls";
  batchSizeMul = 1 / 2;
  
  outputTable = "urls";
  totalQuery = () => 'SELECT count(1) FROM urls INNER JOIN url_map ON url_map.url_id = urls.url_id';
  outputQuery = (table: string) => `COPY ${table}(id, postid, url) FROM STDIN (FORMAT CSV)`;
  inputQuery = () => `
    SELECT
      urls.url_id,
      urls.url_id || ',' ||
      url_map.hash_id || ',"' ||
      REPLACE(urls.url, '"', '""') || '"\n'
    FROM urls
      INNER JOIN url_map ON url_map.url_id = urls.url_id
    WHERE urls.url_id > ?
    ORDER BY urls.url_id
    LIMIT ?
  `;
}
