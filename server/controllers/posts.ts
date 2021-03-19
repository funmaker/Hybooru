import SQL, { SQLStatement } from "sql-template-strings";
import { Post, PostSearchResults, PostSummary } from "../routes/apiTypes";
import * as db from "../helpers/db";
import HTTPError from "../helpers/HTTPError";
import { MIME_EXT } from "../helpers/consts";

const PAGE_SIZE = 36;
const TAGS_COUNT = 40;
const MAX_PARTS = 40;

const SORTS = {
  date: "posted",
  id: "id",
  score: "rating",
  size: "size",
};

export async function search({ query = "", page = 0, includeTags = false, pageSize = PAGE_SIZE }): Promise<PostSearchResults> {
  if(pageSize > PAGE_SIZE) pageSize = PAGE_SIZE;
  
  const parts = query.split(" ")
                     .filter(p => !!p)
                     .map(p => p.toLowerCase()
                                .replace(/\\/g, "\\\\")
                                .replace(/%/g, "\\%")
                                .replace(/_/g, "\\_")
                                .replace(/\*/g, "%")
                                .replace(/\?/g, "_"));
  
  if(parts.length > MAX_PARTS) throw new HTTPError(400, `Query can have only up to ${MAX_PARTS} parts.`);
  
  const whitelist = [];
  const blacklist = [];
  let sort = SORTS.date;
  let order = "desc";
  
  for(let part of parts) {
    if(part.startsWith("-")) {
      blacklist.push(part.slice(1));
    } else if(part.startsWith("order:")) {
      part = part.slice(6);
      
      if(part.endsWith("\\_asc")) {
        order = "asc";
        part = part.slice(0, -5);
      }
      if(part.endsWith("\\_desc")) {
        order = "desc";
        part = part.slice(0, -6);
      }
      
      if(!(part in SORTS)) throw new HTTPError(400, `Invalid sorting: ${part}, expected: ${Object.keys(SORTS).join(", ")}`);
      sort = SORTS[part as keyof typeof SORTS];
    } else {
      whitelist.push(part);
    }
  }
  
  if(whitelist.length === 0) whitelist.push("%");
  
  let tagsQuery: SQLStatement | string = "";
  if(includeTags) {
    tagsQuery = SQL`
      , (
        SELECT
          COALESCE(json_object_agg(name, used), '{}')
        FROM (
          SELECT *
          FROM(
            SELECT DISTINCT ON (tags.id)
              tags.id,
              tags.name,
              tags.used,
              count(1) as count
            FROM filtered
            LEFT  JOIN mappings ON mappings.postid = filtered.id
            LEFT  JOIN tags     ON mappings.tagid = tags.id
            GROUP BY tags.id
          ) x
          ORDER BY count DESC, id ASC
          LIMIT ${TAGS_COUNT}
        ) x
      ) AS tags
    `;
  }
  
  const result = await db.queryFirst(SQL`
    WITH
      whitelisted AS (
        SELECT DISTINCT array_agg(id) AS ids
        FROM unnest(${whitelist}::TEXT[]) WITH ORDINALITY x(pat, patid)
        LEFT JOIN tags ON name ILIKE pat OR subtag ILIKE pat
        GROUP BY patid
      ),
      blacklisted AS (
        SELECT array_agg(DISTINCT id) AS ids
        FROM unnest(${blacklist}::TEXT[]) pat
        LEFT JOIN tags ON name ILIKE pat OR subtag ILIKE pat
      ),
      whitelist_size AS (SELECT count(*) AS size FROM whitelisted),
      filtered AS (
        SELECT DISTINCT ON (posts.id)
          posts.*
        FROM posts
          CROSS JOIN whitelisted
          CROSS JOIN blacklisted
          CROSS JOIN whitelist_size
        WHERE     EXISTS (SELECT 1 FROM mappings WHERE mappings.postid = posts.id AND mappings.tagid = ANY(whitelisted.ids))
          AND NOT EXISTS (SELECT 1 FROM mappings WHERE mappings.postid = posts.id AND mappings.tagid = ANY(blacklisted.ids))
        GROUP BY posts.id, whitelist_size.size
        HAVING count(1) = whitelist_size.size
      )
    SELECT
      COALESCE(json_agg(json_build_object(
        'id', id,
        'hash', encode(hash, 'hex'),
        'mime', mime,
        'posted', format_date(posted)
      )), '[]') as posts,
      (SELECT count(1) FROM filtered)::INTEGER as total,
      ${pageSize}::INTEGER as "pageSize"
      `.append(tagsQuery).append(SQL`
    FROM (
      SELECT *
      FROM filtered
      ORDER BY `).append(`filtered."${sort}" ${order} NULLS LAST, filtered.id ${order}`).append(SQL`
      LIMIT ${pageSize}
      OFFSET ${page * pageSize}
    ) x
  `));
  
  for(const post of result.posts) {
    if(post) post.extension = MIME_EXT[post.mime as keyof typeof MIME_EXT] || "";
  }
  
  return result;
}

export async function random(tag = ""): Promise<PostSummary | null> {
  const post = await db.queryFirst(SQL`
    WITH filtered AS (
          SELECT DISTINCT ON (posts.id)
            posts.*
          FROM posts
          LEFT JOIN mappings ON mappings.postid = posts.id
          LEFT JOIN tags     ON mappings.tagid = tags.id
          WHERE tags.name ILIKE ${tag} OR tags.subtag ILIKE ${tag} OR ${tag} = ''
          GROUP BY posts.id
        )
    SELECT
      id,
      encode(hash, 'hex') as hash,
      mime,
      format_date(posted) AS posted
    FROM filtered
    ORDER BY id
    OFFSET floor(random() * (SELECT count(1) FROM filtered))
  `);
  
  if(post) post.extension = MIME_EXT[post.mime as keyof typeof MIME_EXT] || "";
  
  return post;
}

export async function get(id: number): Promise<Post | null> {
  const post = await db.queryFirst(SQL`
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
      format_date(posted) AS posted,
      COALESCE(json_object_agg(
        tags.name, tags.used
        ORDER BY name ASC, tags.id ASC
      ) FILTER (WHERE tags.id IS NOT NULL), '{}') AS tags,
      COALESCE(array_agg(DISTINCT urls.url) FILTER (WHERE urls.id IS NOT NULL), '{}') AS sources
    FROM posts
    LEFT  JOIN mappings ON mappings.postid = posts.id
    LEFT  JOIN tags     ON mappings.tagid = tags.id
    LEFT  JOIN urls     ON urls.postid = posts.id
    WHERE posts.id = ${id}
    GROUP BY posts.id
  `);
  
  if(post) post.extension = MIME_EXT[post.mime as keyof typeof MIME_EXT] || "";
  
  return post;
}
