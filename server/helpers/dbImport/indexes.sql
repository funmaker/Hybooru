
DELETE FROM urls WHERE NOT EXISTS (SELECT 1 FROM posts WHERE id = postid);
CREATE INDEX ON urls(postid);
ALTER TABLE urls ADD CONSTRAINT urls_postid_fkey FOREIGN KEY (postid) REFERENCES posts(id) ON DELETE CASCADE;

DELETE FROM notes WHERE NOT EXISTS (SELECT 1 FROM posts WHERE id = postid);
CREATE INDEX ON notes(postid);
ALTER TABLE notes ADD CONSTRAINT notes_postid_fkey FOREIGN KEY (postid) REFERENCES posts(id) ON DELETE CASCADE;

DELETE FROM mappings WHERE NOT EXISTS (SELECT 1 FROM posts WHERE id = postid);
DELETE FROM mappings WHERE NOT EXISTS (SELECT 1 FROM tags WHERE id = tagid);
DELETE FROM tags WHERE NOT EXISTS (SELECT 1 FROM mappings WHERE mappings.tagid = tags.id)
                   AND NOT EXISTS (SELECT 1
                                   FROM mappings
                                   INNER JOIN tag_siblings ON tag_siblings.betterid = mappings.tagid
                                   WHERE tag_siblings.tagid = tags.id);
ALTER TABLE mappings ADD CONSTRAINT mappings_postid_fkey FOREIGN KEY (postid) REFERENCES posts(id) ON DELETE CASCADE,
                     ADD CONSTRAINT mappings_tagid_fkey FOREIGN KEY (tagid) REFERENCES tags(id) ON DELETE CASCADE;
CREATE INDEX ON mappings(tagid);
CREATE INDEX tags_name_idx ON tags USING gin(name gin_trgm_ops);
CREATE INDEX tags_subtag_idx ON tags USING gin(subtag gin_trgm_ops);

DROP TABLE IF EXISTS tag_postids;
CREATE TABLE tag_postids AS
  SELECT tagid, sort(array_agg(postid)) AS postids
  FROM mappings
  GROUP BY tagid;
CREATE UNIQUE INDEX ON tag_postids(tagid);

CREATE INDEX ON posts(posted, id);
CREATE INDEX ON posts(rating, id);
CREATE INDEX ON posts(size, id);
CREATE UNIQUE INDEX ON posts(sha256);
CREATE INDEX ON posts(md5);

DELETE FROM relations WHERE NOT EXISTS (SELECT 1 FROM posts WHERE id = postid);
DELETE FROM relations WHERE NOT EXISTS (SELECT 1 FROM posts WHERE id = other_postid);
ALTER TABLE relations ADD CONSTRAINT relations_postid_fkey FOREIGN KEY (postid) REFERENCES posts(id) ON DELETE CASCADE,
                      ADD CONSTRAINT relations_other_postid_fkey FOREIGN KEY (other_postid) REFERENCES posts(id) ON DELETE CASCADE;
