import path from "path";
import YAML from 'yaml';
import { Pool } from 'pg';
import SQL, { SQLStatement } from "sql-template-strings";
import chalk from "chalk";
import sqlite3 from "sqlite3";
import * as sqlite from "sqlite";
import configs from "./configs";
import setupSQL from "./setup.sql";
import { ServiceID } from "./consts";

export const pool = new Pool(configs.db);

const setupHash = hashCode(setupSQL);
let initializationLock: Promise<void> | null = null;

export async function query(sql: SQLStatement, noLock = false) {
  if(!noLock) await initializationLock;
  return pool.query(sql);
}

export async function queryAll(sql: SQLStatement, noLock = false) {
  if(!noLock) await initializationLock;
  const { rows } = await pool.query(sql);
  return rows;
}

export async function queryFirst(sql: SQLStatement, noLock = false) {
  if(!noLock) await initializationLock;
  const { rows } = await pool.query(sql);
  return rows[0] || null;
}

// https://stackoverflow.com/a/7616484
function hashCode(s: string) {
  let hash = 0;
  
  for(let i = 0; i < s.length; i++) {
    const chr = s.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  
  return hash;
}

export async function isInitialized() {
  const exists = await queryFirst(SQL`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'meta'
  `);
  
  if(!exists) return false;
  
  const { hash } = await queryFirst(SQL`SELECT hash FROM meta`);
  
  return hash === setupHash;
}

export function findHydrusDB() {
  let dbPath = configs.hydrusDbPath;
  
  if(!dbPath) {
    const appData = dbPath = (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share"));
    dbPath = `${appData}/hydrus/db`;
  }
  
  return dbPath;
}

export async function initialize() {
  if(initializationLock) return await initializationLock;
  
  initializationLock = (async () => {
    console.log("Initializing Database!");
    await query(setupSQL, true);
    
    const dbPath = findHydrusDB();
    
    const hydrus = await sqlite.open({ filename: path.resolve(dbPath, "client.db"), driver: sqlite3.Database, mode: sqlite3.OPEN_READONLY });
    await hydrus.exec(`ATTACH '${path.resolve(dbPath, "client.mappings.db")}' AS mappings`);
    await hydrus.exec(`ATTACH '${path.resolve(dbPath, "client.master.db")}' AS master`);
    
    {
      const posts = await hydrus.all(SQL`
        SELECT
          current_files.hash_id AS id,
          hashes.hash,
          files_info.size,
          files_info.width,
          files_info.height,
          files_info.duration,
          files_info.num_frames,
          files_info.has_audio,
          local_ratings.rating,
          files_info.mime,
          current_files.timestamp as posted
        FROM current_files
          LEFT JOIN services ON services.service_id = current_files.service_id
          LEFT JOIN files_info ON files_info.hash_id = current_files.hash_id
          LEFT JOIN hashes ON hashes.hash_id = current_files.hash_id
          LEFT JOIN local_ratings ON local_ratings.hash_id = current_files.hash_id
        WHERE services.service_type = ${ServiceID.LOCAL_FILE_DOMAIN} AND services.name != 'repository updates'
      `);
      
      for(const post of posts) {
        post.hash = post.hash.toString("base64");
      }
      
      await query(SQL`
        INSERT INTO posts(id, hash, size, width, height, duration, num_frames, has_audio, rating, mime, posted)
        SELECT id, decode(hash, 'base64') as hash, size, width, height, duration, num_frames, has_audio, rating, mime, to_timestamp(posted) AT TIME ZONE 'UTC'
        FROM json_to_recordset(${JSON.stringify(posts)})
          AS x(
            id INTEGER,
            hash TEXT,
            size INTEGER,
            width INTEGER,
            height INTEGER,
            duration FLOAT,
            num_frames INTEGER,
            has_audio BOOLEAN,
            rating FLOAT,
            mime INTEGER,
            posted INTEGER
          )
      `, true);
    }
    
    {
      const urls = await hydrus.all(SQL`
        SELECT
          urls.url_id AS id,
          url_map.hash_id AS postid,
          urls.url
        FROM urls
          INNER JOIN url_map ON url_map.url_id = urls.url_id
      `);
      
      await query(SQL`
        INSERT INTO urls(id, postid, url)
        SELECT x.id, x.postid, x.url
        FROM json_to_recordset(${JSON.stringify(urls)})
          AS x(
            id INTEGER,
            postid INTEGER,
            url TEXT
          )
          INNER JOIN posts ON posts.id = x.postid
      `, true);
    }
    
    {
      const tags = await hydrus.all(SQL`
        SELECT
          tags.tag_id AS id,
          CASE WHEN namespaces.namespace IS NOT NULL AND namespaces.namespace != ''
            THEN namespaces.namespace || ':' || subtags.subtag
            ELSE subtags.subtag
          END AS name,
          subtags.subtag
        FROM tags
          INNER JOIN subtags ON subtags.subtag_id = tags.subtag_id
          INNER JOIN namespaces ON namespaces.namespace_id = tags.namespace_id
      `);
      
      await query(SQL`
        INSERT INTO tags(id, name, subtag, used)
        SELECT id, REPLACE(name, ' ', '_'), REPLACE(subtag, ' ', '_'), -1
        FROM json_to_recordset(${JSON.stringify(tags)})
          AS x(
            id INTEGER,
            name TEXT,
            subtag TEXT
          )
      `, true);
    }
    
    {
      const mappings = await hydrus.all(SQL`
        SELECT
          current_mappings_7.hash_id as postid,
          current_mappings_7.tag_id as tagid
        FROM current_mappings_7
      `);
      
      await query(SQL`
        INSERT INTO mappings(postid, tagid)
        SELECT x.postid, x.tagid
        FROM json_to_recordset(${JSON.stringify(mappings)})
          AS x(
            postid INTEGER,
            tagid INTEGER
          )
          INNER JOIN posts ON posts.id = x.postid
          INNER JOIN tags ON tags.id = x.tagid
      `, true);
    }
    
    {
      let { options } = await hydrus.get(SQL`SELECT options FROM options`);
      options = YAML.parse(options);
      const namespaceColours: Record<string, [number, number, number]> = options.namespace_colours;
      
      const namespaces = Object.entries(namespaceColours)
                               .map(([name, color], id) => ({
                                 id,
                                 name,
                                 color: "#" + (color[0] * 256 * 256 + color[1] * 256 + color[2]).toString(16).padStart(6, "0"),
                               }));
      
      await query(SQL`
        INSERT INTO namespaces(id, name, color)
        SELECT id, name, color
        FROM json_to_recordset(${JSON.stringify(namespaces)})
          AS x(
            id INTEGER,
            name TEXT,
            color TEXT
          )
      `, true);
      
      await query(SQL`
        DELETE FROM posts
        USING unnest(${configs.tags.blacklist}::TEXT[]) pat
        INNER JOIN tags ON tags.name ILIKE pat OR tags.subtag ILIKE pat
        INNER JOIN mappings ON mappings.tagid = tags.id
        WHERE mappings.postid = posts.id
      `, true);
      
      await query(SQL`
        DELETE FROM tags
        USING unnest(${configs.tags.ignore}::TEXT[]) pat
        WHERE tags.name ILIKE pat OR tags.subtag ILIKE pat
      `, true);
      
      await query(SQL`
        UPDATE tags
        SET used = stats.count
        FROM (
          SELECT mappings.tagid as id, COUNT(1) as count
          FROM mappings
          GROUP BY mappings.tagid
        ) stats
        WHERE stats.id = tags.id
      `, true);
      
      await query(SQL`DELETE FROM tags WHERE used = -1`, true);
      
      await query(SQL`
        INSERT INTO global(thumbnail_width, thumbnail_height, posts, tags, mappings, needs_tags)
        SELECT
          ${options.thumbnail_dimensions[0]} AS thumbnail_width,
          ${options.thumbnail_dimensions[1]} AS thumbnail_height,
          (SELECT COUNT(1) FROM posts) AS posts,
          (SELECT COUNT(1) FROM tags) AS tags,
          (SELECT COUNT(1) FROM mappings) AS mappings,
          (
            SELECT COUNT(1)
            FROM mappings
            INNER JOIN tags ON tags.id = mappings.tagid AND tags.name = 'fm:needs_tags'
          ) AS needs_tags
      `, true);
    }
    
    await query(SQL`UPDATE meta SET hash = ${setupHash}`, true);
  })();
  
  await initializationLock;
  initializationLock = null;
}


(async () => {
  if(!await isInitialized()) {
    console.log(chalk.bold.yellow("Database update detected, rebuilding..."));
    await initialize();
    console.log(chalk.bold.green("Database rebuild completed."));
  }
})().catch(err => {
  console.error("Unable to initialize DB!");
  console.error(err);
  process.exit(1);
});
