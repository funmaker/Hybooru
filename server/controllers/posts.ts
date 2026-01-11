import SQL, { SQLStatement } from "sql-template-strings";
import objectHash from "node-object-hash";
import { PoolClient } from "pg";
import { Post, PostNote, PostSearchResults, PostSummary } from "../routes/apiTypes";
import * as db from "../helpers/db";
import HTTPError from "../helpers/HTTPError";
import { MIME_EXT, rangeRatingRegex } from "../helpers/consts";
import { preparePattern } from "../helpers/utils";
import configs from "../helpers/configs";

const MAX_PARTS = 40;
const TAGS_SAMPLE_MAX = 256;
const CACHE_SIZE = configs.posts.pageSize * configs.posts.cachePages;

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
  tags?: boolean;
  pageSize?: number;
  hashes?: boolean;
  blurhash?: boolean;
}

export async function search({ query = "", page = 0, tags: includeTags = false, hashes, blurhash, pageSize = configs.posts.pageSize }: SearchArgs, client?: PoolClient): Promise<PostSearchResults> {
  if(pageSize > configs.posts.pageSize) pageSize = configs.posts.pageSize;
  
  const key = getCacheKey(query);
  
  const cached = [];
  let start = page * pageSize;
  const end = page * pageSize + pageSize;
  let tags = {};
  let total = 0;
  
  while(start < end) {
    const cacheStart = Math.floor(start / CACHE_SIZE) * CACHE_SIZE;
    const cacheEnd = cacheStart + CACHE_SIZE;
    
    key.offset = cacheStart;
    const cachePage = await getCachedPosts(key, client);
    
    tags = cachePage.tags;
    total = cachePage.total;
    cached.push(...cachePage.posts.slice(start - cacheStart, end - cacheStart));
    
    start = cacheEnd;
  }
  
  let hashesSql = SQL``;
  
  if(hashes) {
    hashesSql = hashesSql.append(SQL`
      'md5', encode(md5, 'hex'),
    `);
  }
  
  if(blurhash) {
    hashesSql = SQL`
      'blurhash', blurhash,
      'width', width,
      'height', height,
    `;
  }
  
  const result = await db.queryFirst(SQL`
    SELECT
      COALESCE(json_agg(json_build_object(
        'id', id,
        'sha256', encode(sha256, 'hex'),
        'hash', encode(sha256, 'hex'),
        `.append(hashesSql).append(SQL`
        'mime', mime,
        'posted', format_date(posted),
        'size', size
      ) ORDER BY rn), '[]') as posts
    FROM unnest(${cached}::INTEGER[]) WITH ORDINALITY x(cached, rn)
    INNER JOIN posts ON id = cached
  `), client);
  
  result.pageSize = pageSize;
  if(includeTags) result.tags = tags;
  result.total = total;
  
  for(const post of result.posts) {
    if(post) post.extension = MIME_EXT[post.mime as keyof typeof MIME_EXT] || "";
  }
  
  return result;
}

export async function random(query: string | null = null): Promise<PostSummary | null> {
  let id: number | null;
  
  if(!query) {
    const post: { id: number } | null = await db.queryFirst(SQL`
      SELECT id
      FROM posts
      ORDER BY id
      OFFSET floor(random() * (SELECT posts FROM global))
      LIMIT 1
    `);
    
    id = post?.id || null;
  } else {
    const key = getCacheKey(query);

    key.offset = 0;
    const firstPage = await getCachedPosts(key);
    const total = firstPage.total;

    if(total === 0) {
      id = null;
    } else {
      // Pick a random position across the entire result set
      const randomPosition = Math.floor(Math.random() * total);

      // Calculate which cache page contains this position
      const cacheStart = Math.floor(randomPosition / CACHE_SIZE) * CACHE_SIZE;
      key.offset = cacheStart;
      const cachePage = await getCachedPosts(key);

      // Get the post at the random position within this page
      const indexInPage = randomPosition - cacheStart;
      id = cachePage.posts[indexInPage] || null;
    }
  }
  
  const post: PostSummary | null = await db.queryFirst(SQL`
    SELECT
      id,
      encode(sha256, 'hex') as sha256,
      encode(sha256, 'hex') as hash,
      mime,
      format_date(posted) AS posted
    FROM posts
    WHERE id = ${id}
  `);
  
  if(post) post.extension = MIME_EXT[post.mime as keyof typeof MIME_EXT] || "";
  
  return post;
}

export async function get(id: number): Promise<Post | null> {
  const post: Post | null = await db.queryFirst(SQL`
    SELECT
      posts.id,
      encode(posts.sha256, 'hex') AS sha256,
      encode(posts.sha256, 'hex') AS hash,
      encode(posts.md5, 'hex') AS md5,
      posts.size,
      posts.width,
      posts.height,
      posts.duration,
      posts.num_frames AS "nunFrames",
      posts.has_audio AS "hasAudio",
      posts.rating,
      posts.mime,
      posts.inbox,
      posts.trash,
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
          'sha256', encode(other.sha256, 'hex'),
          'hash', encode(other.sha256, 'hex'),
          'mime', other.mime,
          'posted', format_date(other.posted),
          'kind', relations.kind
        )) FILTER (WHERE relations.postid IS NOT NULL), '{}')
        FROM relations
        INNER JOIN posts other ON other.id = relations.other_postid
        WHERE relations.postid = posts.id
      ) AS relations,
      (
        SELECT COALESCE(array_agg(json_build_object(
          'label', notes.label,
          'note', notes.note,
          'rect', NULL
        )) FILTER (WHERE notes.postid IS NOT NULL), '{}')
        FROM notes
        WHERE notes.postid = posts.id
      ) AS notes
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
    
    post.notes = post.notes.flatMap(note => splitSubnotes(note) || [note]);
  }
  
  return post;
}

function splitSubnotes(note: PostNote) {
  const subNotes: PostNote[] = [];
  const subNoteRegex = /\n*(.*?)\n#! ([^\n]*)\n?/sg;
  
  try {
    let match;
    while((match = subNoteRegex.exec(note.note))) {
      const data = JSON.parse(match[2]);
      if(!Array.isArray(data)) throw new Error(`Expected array, got ${match[2]}`);
      
      let [left, top, width, height, postWidth, postHeight] = data;
      
      if(typeof left !== "number") left = 0;
      if(typeof top !== "number") top = 0;
      if(typeof width !== "number") width = 0;
      if(typeof height !== "number") height = 0;
      if(typeof postWidth !== "number") postWidth = 100;
      if(typeof postHeight !== "number") postHeight = 100;
      
      subNotes.push({
        label: null,
        note: match[1],
        rect: {
          left: left / postWidth * 100,
          top: top / postHeight * 100,
          width: width / postWidth * 100,
          height: height / postHeight * 100,
        },
      });
    }
  } catch(e) {
    console.error("Unable to parse note position data data.");
    console.error(e);
    return null;
  }
  
  return subNotes.length > 0 ? subNotes : null;
}

interface CacheKey {
  whitelist: string[];
  blacklist: string[];
  md5: string[];
  sha256: string[];
  sort: string;
  order: string;
  rating: undefined | null | [number, number];
  inbox: undefined | boolean;
  trash: undefined | boolean;
  offset: number;
}

function getCacheKey(query: string): CacheKey {
  const parts = query.split(" ")
                     .filter(p => !!p)
                     .map(preparePattern);
  
  if(parts.length > MAX_PARTS) throw new HTTPError(400, `Query can have only up to ${MAX_PARTS} parts.`);
  
  const whitelist = [];
  const blacklist = [];
  const sha256 = [];
  const md5 = [];
  let sort = SORTS.date;
  let order = "desc";
  let rating: undefined | null | [number, number] = undefined;
  let inbox: undefined | boolean;
  let trash: undefined | boolean;
  let match: RegExpMatchArray | null = null;
  
  for(let part of parts) {
    if(part.startsWith("system:") || part.startsWith("-system:")) {
      if(part === "system:archive" || part === "-system:inbox") inbox = false;
      else if(part === "system:inbox" || part === "-system:archive") inbox = true;
      else if(part === "-system:trash") trash = false;
      else if(part === "system:trash") trash = true;
    } else if(part.startsWith("-")) {
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
    } else if(part.startsWith("sha256:")) {
      let hash = part.slice(7);
      if(hash.startsWith("0x")) hash = hash.slice(2);
      if(hash.length % 2 !== 0) hash += "0";
      sha256.push(`\\x${hash}`);
    } else if(part.startsWith("md5:")) {
      let hash = part.slice(4);
      if(hash.startsWith("0x")) hash = hash.slice(2);
      if(hash.length % 2 !== 0) hash += "0";
      md5.push(`\\x${hash}`);
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
  
  return {
    whitelist,
    blacklist,
    sha256,
    md5,
    sort,
    order,
    rating,
    inbox,
    trash,
    offset: 0,
  };
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
  
  let { whitelist, blacklist, sha256, md5, sort, order, offset, rating, inbox, trash } = key;
  
  let extraWhere = SQL``;
  let from = SQL`
    FROM filtered
    INNER JOIN posts ON posts.id = filtered.id
  `;
  
  const onlyTagged = whitelist.length > 0 && whitelist.every(pat => blankPattern.test(pat));
  const onlyUntagged = blacklist.some(pat => blankPattern.test(pat));
  
  whitelist = whitelist.filter(pat => !blankPattern.test(pat));
  blacklist = blacklist.filter(pat => !blankPattern.test(pat));
  
  const whitelistParts: SQLStatement[] = [];
  if(whitelist.length > 0) {
    whitelistParts.push(SQL`
      SELECT union_agg(tag_postids.postids) AS ids
      FROM unnest(${whitelist}::TEXT[]) WITH ORDINALITY x(pat, patid)
      LEFT JOIN tags ON tags.name LIKE pat OR tags.subtag LIKE pat
      INNER JOIN tag_postids ON tag_postids.tagid = tags.id
      GROUP BY patid
    `);
  }
  
  if(sha256.length > 0) {
    whitelistParts.push(SQL`
      SELECT array_agg(id) AS ids
      FROM posts
      WHERE sha256 = ANY(${sha256}::bytea[])
    `);
  }
  
  if(md5.length > 0) {
    whitelistParts.push(SQL`
      SELECT array_agg(id) AS ids
      FROM posts
      WHERE md5 = ANY(${md5}::bytea[])
    `);
  }
  
  let whitelistCTE: SQLStatement | null;
  if(whitelistParts.length > 0) {
    const whitelistUnion = whitelistParts.reduce((acc, val) => acc.append(SQL`UNION ALL`).append(val));
    
    whitelistCTE = SQL`whitelist AS (
      SELECT intersection_agg(ids) as ids FROM (
        `.append(whitelistUnion).append(SQL`
      ) ids
    ),`);
  } else {
    whitelistCTE = null;
  }
  
  let blacklistCTE: SQLStatement | null;
  if(blacklist.length > 0) {
    blacklistCTE = SQL`blacklist AS (
      SELECT union_agg(tag_postids.postids) AS ids
      FROM unnest(${blacklist}::TEXT[]) pat
      LEFT JOIN tags ON tags.name LIKE pat OR tags.subtag LIKE pat
      INNER JOIN tag_postids ON tag_postids.tagid = tags.id
    ),`;
  } else {
    blacklistCTE = null;
  }
  
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
  
  let filteredCTE: SQLStatement;
  if(onlyTagged && onlyUntagged) {
    filteredCTE = SQL`filtered AS (SELECT 0 AS id WHERE FALSE)`;
  } else if(whitelistCTE && blacklistCTE) {
    filteredCTE = SQL`filtered AS (
      SELECT id
      FROM whitelist
      CROSS JOIN blacklist
      CROSS JOIN LATERAL unnest(whitelist.ids - blacklist.ids) id
      `.append(filteredWhere).append(`
    )`);
  } else if(whitelistCTE) {
    filteredCTE = SQL`filtered AS (
      SELECT id
      FROM whitelist
      CROSS JOIN LATERAL unnest(whitelist.ids) id
      `.append(filteredWhere).append(`
    )`);
  } else if(blacklistCTE) {
    filteredCTE = SQL`filtered AS (
      SELECT id
      FROM posts
      CROSS JOIN blacklist
      WHERE posts.id != ALL(blacklist.ids)
      `.append(filteredWhere).append(`
    )`);
  } else if(filteredWhere) {
    filteredCTE = SQL`filtered AS (
      SELECT id
      FROM posts
      `.append(filteredWhere).append(`
    )`);
  } else {
    filteredCTE = SQL`filtered AS (SELECT id FROM posts)`;
    from = SQL`FROM posts`;
  }
  
  if(rating === null) extraWhere = extraWhere.append(SQL` AND posts.rating IS NULL`);
  else if(Array.isArray(rating)) extraWhere = extraWhere.append(SQL` AND posts.rating BETWEEN ${rating[0]} AND ${rating[1]}`);
  
  if(inbox !== undefined) extraWhere = extraWhere.append(SQL` AND posts.inbox = ${inbox}`);
  if(trash !== undefined) extraWhere = extraWhere.append(SQL` AND posts.trash = ${trash}`);
  
  const result = await db.queryFirst(SQL`
    WITH
      `.append(whitelistCTE || SQL``).append(SQL`
      `).append(blacklistCTE || SQL``).append(SQL`
      `).append(filteredCTE).append(SQL`
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
          LIMIT ${configs.tags.searchSummary}
        ) x
      ) AS tags
    FROM (
      SELECT posts.*
      `).append(from).append(`
      WHERE posts."${sort}" IS NOT NULL
      `).append(extraWhere).append(`
      ORDER BY posts."${sort}" ${order}, posts.id ${order}
      `).append(SQL`
      LIMIT ${CACHE_SIZE}
      OFFSET ${offset}
    ) x
  `), client);
  
  if(Object.keys(postsCache).length >= configs.posts.cacheRecords) {
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
