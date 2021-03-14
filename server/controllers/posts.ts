import SQL from "sql-template-strings";
import { Post, SearchResults } from "../routes/apiTypes";
import * as db from "../helpers/db";

const PAGE_SIZE = 36;
const TAGS_COUNT = 40;

export async function search(query = "", page = 0, includeTags = false): Promise<SearchResults> {
  const parts = query.split(" ")
                     .filter(p => !!p)
                     .map(p => p.replace(/\\/g, "\\\\")
                                .replace(/%/g, "\\%")
                                .replace(/_/g, "\\_")
                                .replace(/\*/g, "%")
                                .replace(/\?/g, "_"));
  
  const whitelist = parts.filter(p => !p.startsWith("-"));
  const blacklist = parts.filter(p => p.startsWith("-"))
                         .map(p => p.substr(1));
  
  let tags;
  if(includeTags) {
    ({ tags } = await db.queryFirst(SQL`
      SELECT
        json_object_agg(name, used ORDER BY count DESC, id ASC) AS tags
      FROM (
        SELECT DISTINCT ON (tags.id)
          tags.id,
          tags.name,
          tags.used,
          count(1) as count
        FROM (
          SELECT DISTINCT ON (posts.id)
            posts.*
          FROM tags w_tags
            INNER JOIN mappings w_map ON w_map.tagid = w_tags.id
            INNER JOIN posts          ON w_map.postid = posts.id
            LEFT  JOIN mappings b_map ON b_map.postid = posts.id
            LEFT  JOIN tags b_tags    ON b_map.tagid = b_tags.id AND (b_tags.name ILIKE ANY(${blacklist}::TEXT[]) OR b_tags.subtag ILIKE ANY(${blacklist}::TEXT[]))
          WHERE (w_tags.name ILIKE ANY(${whitelist}::TEXT[]) OR w_tags.subtag ILIKE ANY(${whitelist}::TEXT[]) OR ${whitelist.length === 0})
            AND b_tags.id IS NULL
        ) filtered
        LEFT  JOIN mappings ON mappings.postid = filtered.id
        LEFT  JOIN tags     ON mappings.tagid = tags.id
        GROUP BY tags.id
        LIMIT ${TAGS_COUNT}
      ) x
    `));
  }
  
  const posts = await db.queryAll(SQL`
    SELECT
      filtered.id,
      encode(filtered.hash, 'hex') as hash,
      filtered.mime,
      (count(1) OVER())::INTEGER as total
    FROM (
      SELECT DISTINCT ON (posts.id)
        posts.*
      FROM tags w_tags
        INNER JOIN mappings w_map ON w_map.tagid = w_tags.id
        INNER JOIN posts          ON w_map.postid = posts.id
        LEFT  JOIN mappings b_map ON b_map.postid = posts.id
        LEFT  JOIN tags b_tags    ON b_map.tagid = b_tags.id AND (b_tags.name ILIKE ANY(${blacklist}::TEXT[]) OR b_tags.subtag ILIKE ANY(${blacklist}::TEXT[]))
      WHERE (w_tags.name ILIKE ANY(${whitelist}::TEXT[]) OR w_tags.subtag ILIKE ANY(${whitelist}::TEXT[]) OR ${whitelist.length === 0})
        AND b_tags.id IS NULL
    ) filtered
    ORDER BY filtered.posted DESC, filtered.id ASC
    LIMIT ${PAGE_SIZE}
    OFFSET ${page * PAGE_SIZE}
  `);
  
  // Not the cleanest, but will do
  const total = posts[0]?.total || 0;
  for(const post of posts) delete post.total;
  
  return {
    posts,
    total,
    tags,
  };
}

export async function get(id: number): Promise<Post | null> {
  return await db.queryFirst(SQL`
    SELECT
      posts.id,
      encode(posts.hash, 'hex') AS hash,
      posts.size,
      posts.width,
      posts.height,
      posts.duration,
      posts.num_frames AS "nunFrames",
      posts.has_audio AS "hasAudio",
      posts.rating,
      posts.mime,
      posts.posted,
      json_object_agg(tags.name, tags.used ORDER BY name ASC, tags.id ASC) AS tags
    FROM posts
    LEFT  JOIN mappings ON mappings.postid = posts.id
    LEFT  JOIN tags     ON mappings.tagid = tags.id
    WHERE posts.id = ${id}
    GROUP BY posts.id
  `);
}
