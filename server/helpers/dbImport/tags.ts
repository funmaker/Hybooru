import { Import } from "./import";

export default class Tags extends Import {
  display = "Tags";
  batchSizeMul = 1 / 2;
  
  totalQuery = 'SELECT count(1) FROM tags';
  outputQuery = 'COPY tags(id, name, subtag) FROM STDIN (FORMAT CSV)';
  inputQuery = `
    SELECT
      tags.tag_id,
      REPLACE(
        '' || tags.tag_id || ',"' ||
        LOWER(REPLACE(
          CASE WHEN namespaces.namespace IS NOT NULL AND namespaces.namespace != ''
            THEN namespaces.namespace || ':' || subtags.subtag
            ELSE subtags.subtag
          END,
        '"', '""')) || '","' ||
        LOWER(REPLACE(
          subtags.subtag,
        '"', '""')) || '"\n',
      ' ', '_')
    FROM tags
      INNER JOIN subtags ON subtags.subtag_id = tags.subtag_id
      INNER JOIN namespaces ON namespaces.namespace_id = tags.namespace_id
    WHERE tags.tag_id > ?
    ORDER BY tags.tag_id ASC
    LIMIT ?
  `;
}
