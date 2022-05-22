import SQL, { SQLStatement } from "sql-template-strings";
import objectHash from "node-object-hash";
import { PoolClient } from "pg";
import { Post, PostSearchResults, PostSummary } from "../routes/apiTypes";
import * as db from "../helpers/db";
import HTTPError from "../helpers/HTTPError";
import { MIME_EXT, rangeRatingRegex } from "../helpers/consts";
import { preparePattern } from "../helpers/utils";
import configs from "../helpers/configs";

const TAGS_COUNT = 40;
const MAX_PARTS = 40;
const TAGS_SAMPLE_MAX = 256;
const CACHE_SIZE = configs.pageSize * configs.cachePages;

const blankPattern = /^[_%]*%[_%]*$/;

const SORTS = {
  date: "posted",
  id: "id",
  score: "rating",
  size: "size",
};

interface SearchArgs {
  query?: string;
  page?: number;
  includeTags?: boolean;
  pageSize?: number;
  client?: PoolClient;
}

export async function search({ query = "", page = 0, includeTags = false, pageSize = configs.pageSize, client }: SearchArgs): Promise<PostSearchResults> {
  if(pageSize > configs.pageSize) pageSize = configs.pageSize;
  
  const parts = query.split(" ")
                     .filter(p => !!p)
                     .map(preparePattern);
  
  if(parts.length > MAX_PARTS) throw new HTTPError(400, `Query can have only up to ${MAX_PARTS} parts.`);
  
  const whitelist = [];
  const blacklist = [];
  let sort = SORTS.date;
  let order = "desc";
  let rating: undefined | null | [number, number] = undefined;
  let match: RegExpMatchArray | null = null;
  
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
    } else if(part === "rating:none") {
      rating = null;
    } else if(configs.rating?.enabled && (match = part.match(rangeRatingRegex))) {
      let min = parseInt(match[1]);
      let max = parseInt(match[2]);
      if(match[2] === undefined) max = min;
      if(isNaN(min) || isNaN(max)) continue;
      if(min > max) [min, max] = [max, min];
      
      rating = [min / configs.rating.stars - Number.EPSILON, max / configs.rating.stars + Number.EPSILON];
    } else {
      whitelist.push(part);
    }
  }
  
  const cached = [];
  let start = page * pageSize;
  const end = page * pageSize + pageSize;
  let tags = {};
  let total = 0;
  
  while(start < end) {
    const cacheStart = Math.floor(start / CACHE_SIZE) * CACHE_SIZE;
    const cacheEnd = cacheStart + CACHE_SIZE;
    const cachePage = await getCachedPosts({ whitelist, blacklist, sort, order, rating, offset: cacheStart }, client);
    
    tags = cachePage.tags;
    total = cachePage.total;
    cached.push(...cachePage.posts.slice(start - cacheStart, end - cacheStart));
    
    start = cacheEnd;
  }
  
  const result = await db.queryFirst(SQL`
    SELECT
      COALESCE(json_agg(json_build_object(
        'id', id,
        'hash', encode(hash, 'hex'),
        'mime', mime,
        'posted', format_date(posted),
        'size', size
      ) ORDER BY rn), '[]') as posts
    FROM unnest(${cached}::INTEGER[]) WITH ORDINALITY x(cached, rn)
    INNER JOIN posts ON id = cached
  `, client);
  
  result.pageSize = pageSize;
  result.tags = tags;
  result.total = total;
  
  for(const post of result.posts) {
    if(post) post.extension = MIME_EXT[post.mime as keyof typeof MIME_EXT] || "";
  }
  
  return result;
}

export async function random(tag: string | null = null): Promise<PostSummary | null> {
  let sample: SQLStatement;
  if(!tag) {
    sample = SQL`(
      SELECT id
      FROM posts
      OFFSET floor(random() * (SELECT posts FROM global))
      LIMIT 1
    )`;
  } else {
    const pattern = preparePattern(tag);
    sample = SQL`(
      SELECT filtered.ids[floor(random() * icount(filtered.ids)) + 1] as id
      FROM (
        SELECT union_agg(tag_postids.postids) AS ids
        FROM tags
        INNER JOIN tag_postids ON tag_postids.tagid = tags.id
        WHERE tags.name LIKE ${pattern} OR tags.subtag LIKE ${pattern}
      ) filtered
    )`;
  }
  
  const post = await db.queryFirst(SQL`
    WITH sample AS `.append(sample).append(SQL`
    SELECT
      posts.id,
      encode(hash, 'hex') as hash,
      mime,
      format_date(posted) AS posted
    FROM sample
    INNER JOIN posts ON posts.id = sample.id
  `));
  
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
      (
        SELECT COALESCE(array_agg(DISTINCT urls.url) FILTER (WHERE urls.id IS NOT NULL), '{}')
        FROM urls
        WHERE urls.postid = posts.id
      ) AS sources,
      (
        SELECT COALESCE(array_agg(json_build_object(
          'id', other.id,
          'hash', encode(other.hash, 'hex'),
          'mime', other.mime,
          'posted', format_date(other.posted),
          'kind', relations.kind
        )) FILTER (WHERE relations.postid IS NOT NULL), '{}')
        FROM relations
        INNER JOIN posts other ON other.id = relations.other_postid
        WHERE relations.postid = posts.id
      ) AS relations
    FROM posts
    LEFT  JOIN mappings ON mappings.postid = posts.id
    LEFT  JOIN tags     ON mappings.tagid = tags.id
    WHERE posts.id = ${id}
    GROUP BY posts.id
  `);
  
  if(post) {
    post.extension = MIME_EXT[post.mime as keyof typeof MIME_EXT] || "";
    
    for(const relation of post.relations) {
      relation.extension = MIME_EXT[relation.mime as keyof typeof MIME_EXT] || "";
    }
  }
  
  return post;
}

interface CacheKey {
  whitelist: string[];
  blacklist: string[];
  sort: string;
  order: string;
  rating: undefined | null | [number, number];
  offset: number;
}

interface CacheValue {
  posts: number[];
  tags: Record<string, number>;
  total: number;
  lastUsed: number;
}

const keyHasher = objectHash({ alg: "sha1", coerce: false });
let postsCache: Record<string, CacheValue> = {};

async function getCachedPosts(key: CacheKey, client?: PoolClient): Promise<CacheValue> {
  const hashed = keyHasher.hash(key);
  
  if(postsCache[hashed]) {
    postsCache[hashed].lastUsed = Date.now();
    return postsCache[hashed];
  }
  
  let { whitelist, blacklist, sort, order, offset, rating } = key;
  
  let ratingFilter = SQL``;
  let from = SQL`
    FROM filtered
    INNER JOIN posts ON posts.id = filtered.id
  `;
  
  const onlyTagged = whitelist.length > 0 && whitelist.every(pat => blankPattern.test(pat));
  const onlyUntagged = blacklist.some(pat => blankPattern.test(pat));
  
  whitelist = whitelist.filter(pat => !blankPattern.test(pat));
  blacklist = blacklist.filter(pat => !blankPattern.test(pat));
  
  let filteredWhere;
  if(onlyTagged && onlyUntagged) {
    filteredWhere = `WHERE FALSE`;
  } else if(onlyTagged) {
    filteredWhere = `WHERE EXISTS(SELECT 1 FROM mappings WHERE postid = id)`;
  } else if(onlyUntagged) {
    filteredWhere = `WHERE NOT EXISTS(SELECT 1 FROM mappings WHERE postid = id)`;
  } else {
    filteredWhere = ``;
  }
  
  let filtered: SQLStatement;
  if(onlyTagged && onlyUntagged) {
    filtered = SQL`(SELECT 0 AS id WHERE FALSE)`;
  } else if(whitelist.length > 0 && blacklist.length > 0) {
    filtered = SQL`(
      SELECT id
      FROM whitelist
      CROSS JOIN blacklist
      CROSS JOIN LATERAL unnest(whitelist.ids - blacklist.ids) id
      `.append(filteredWhere).append(`
    )`);
  } else if(whitelist.length > 0) {
    filtered = SQL`(
      SELECT id
      FROM whitelist
      CROSS JOIN LATERAL unnest(whitelist.ids) id
      `.append(filteredWhere).append(`
    )`);
  } else if(blacklist.length > 0) {
    filtered = SQL`(
      SELECT id
      FROM posts
      CROSS JOIN blacklist
      WHERE posts.id != ALL(blacklist.ids)
      `.append(filteredWhere).append(`
    )`);
  } else if(filteredWhere) {
    filtered = SQL`(
      SELECT id
      FROM posts
      `.append(filteredWhere).append(`
    )`);
  } else {
    filtered = SQL`(SELECT id FROM posts)`;
    from = SQL`FROM posts`;
  }
  
  if(rating === null) {
    ratingFilter = SQL`AND posts.rating IS NULL`;
  } else if(Array.isArray(rating)) {
    ratingFilter = SQL`AND posts.rating BETWEEN ${rating[0]} AND ${rating[1]}`;
  }
  
  const result = await db.queryFirst(SQL`
    WITH
      whitelist AS (
        SELECT intersection_agg(ids) as ids FROM (
          SELECT union_agg(tag_postids.postids) AS ids
          FROM unnest(${whitelist}::TEXT[]) WITH ORDINALITY x(pat, patid)
          LEFT JOIN tags ON tags.name LIKE pat OR tags.subtag LIKE pat
          INNER JOIN tag_postids ON tag_postids.tagid = tags.id
          GROUP BY patid
        ) ids
      ),
      blacklist AS (
        SELECT union_agg(tag_postids.postids) AS ids
        FROM unnest(${blacklist}::TEXT[]) pat
        LEFT JOIN tags ON tags.name LIKE pat OR tags.subtag LIKE pat
        INNER JOIN tag_postids ON tag_postids.tagid = tags.id
      ),
      filtered AS `.append(filtered).append(SQL`
    SELECT
      COALESCE(json_agg(id), '[]') as posts,
      (SELECT count(1) FROM filtered) as total,
      (
        SELECT
          COALESCE(json_object_agg(name, used), '{}')
        FROM (
          SELECT *
          FROM(
            SELECT
              tags.id,
              tags.name,
              tags.used,
              count(1) as count
            FROM (SELECT id FROM filtered LIMIT ${TAGS_SAMPLE_MAX}) filtered
            LEFT  JOIN mappings ON mappings.postid = filtered.id
            LEFT  JOIN tags     ON mappings.tagid = tags.id
            GROUP BY tags.id
          ) x
          WHERE id IS NOT NULL
          ORDER BY count DESC, id ASC
          LIMIT ${TAGS_COUNT}
        ) x
      ) AS tags
    FROM (
      SELECT posts.*
      `).append(from).append(`
      WHERE posts."${sort}" IS NOT NULL
      `).append(ratingFilter).append(`
      ORDER BY posts."${sort}" ${order}, posts.id ${order}
      `).append(SQL`
      LIMIT ${CACHE_SIZE}
      OFFSET ${offset}
    ) x
  `), client);
  
  if(Object.keys(postsCache).length >= configs.cacheRecords) {
    let minKey: string | null = null;
    let minDate = Date.now();
    
    for(const [key, val] of Object.entries(postsCache)) {
      if(minKey === null || minDate > val.lastUsed) {
        minKey = key;
        minDate = val.lastUsed;
      }
    }
    
    if(minKey !== null) delete postsCache[minKey];
  }
  
  return postsCache[hashed] = {
    ...result,
    lastUsed: Date.now(),
  };
}

export function clearCache() {
  postsCache = {};
}
