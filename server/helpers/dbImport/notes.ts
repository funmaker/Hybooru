import { Import } from "./import";

export default class Notes extends Import {
  display = "Notes";
  batchSizeMul = 1 / 4;
  
  outputTable = "notes";
  totalQuery = () => `
    SELECT count(1) FROM file_notes
      INNER JOIN notes ON file_notes.note_id = notes.note_id
      INNER JOIN labels ON file_notes.name_id = labels.label_id
  `;
  
  outputQuery = (table: string) => `COPY ${table}(id, postid, label, note) FROM STDIN (FORMAT CSV)`;
  inputQuery = () => `
    SELECT
      file_notes.note_id,
      file_notes.note_id || ',' ||
      file_notes.hash_id || ',"' ||
      REPLACE(labels.label, '"', '""') || '","' ||
      REPLACE(notes.note, '"', '""') || '"\n'
    FROM file_notes
      INNER JOIN notes ON file_notes.note_id = notes.note_id
      INNER JOIN labels ON file_notes.name_id = labels.label_id
    WHERE file_notes.note_id > ?
    ORDER BY file_notes.note_id
    LIMIT ?
  `;
}
