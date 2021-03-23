import path from "path";
import YAML from 'yaml';
import { Pool } from 'pg';
import SQL, { SQLStatement } from "sql-template-strings";
import chalk from "chalk";
import sqlite3 from "sqlite3";
import * as sqlite from "sqlite";
import * as postsController from "../controllers/posts";
import configs from "./configs";
import setupSQL from "./setup.sql";
import * as dbImport from "./dbImport";

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
    console.log(chalk.cyan.bold("\n\nInitializing Database!\n"));
    const startTime = Date.now();
    
    await query(setupSQL, true);
    
    const dbPath = findHydrusDB();
    
    const hydrus = await sqlite.open({ filename: path.resolve(dbPath, "client.db"), driver: sqlite3.Database, mode: sqlite3.OPEN_READONLY });
    await hydrus.exec(`ATTACH '${path.resolve(dbPath, "client.mappings.db")}' AS mappings`);
    await hydrus.exec(`ATTACH '${path.resolve(dbPath, "client.master.db")}' AS master`);
    
    await new dbImport.Posts(hydrus).start();
    await new dbImport.Tags(hydrus).start();
    await new dbImport.Mappings(hydrus).start();
    await new dbImport.Urls(hydrus).start();
    
    dbImport.printProgress(false, "Importing options... ");
    
    let { options } = await hydrus.get(SQL`SELECT options FROM options`);
    (global as any).YAML_SILENCE_WARNINGS = true;
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
    
    dbImport.printProgress(false, "Applying blacklist...");
    
    await query(SQL`
      DELETE FROM posts
      USING unnest(${configs.tags.blacklist}::TEXT[]) pat
      INNER JOIN tags ON tags.name ILIKE pat OR tags.subtag ILIKE pat
      INNER JOIN mappings ON mappings.tagid = tags.id
      WHERE mappings.postid = posts.id
    `, true);
    
    dbImport.printProgress(false, "Removing ignored tags...");
    
    await query(SQL`
      DELETE FROM tags
      USING unnest(${configs.tags.ignore}::TEXT[]) pat
      WHERE tags.name ILIKE pat OR tags.subtag ILIKE pat
    `, true);
    
    dbImport.printProgress(false, "Counting tags usage...");
    
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
    
    dbImport.printProgress(false, "Removing unused tags...");
    
    await query(SQL`DELETE FROM tags WHERE used = -1`, true);
    
    dbImport.printProgress(false, "Calculating statistics...");
    
    const untagged = await postsController.search({ query: configs.tags.untagged, noLock: true });
    
    await query(SQL`
      INSERT INTO global(thumbnail_width, thumbnail_height, posts, tags, mappings, needs_tags)
      SELECT
        ${options.thumbnail_dimensions[0]} AS thumbnail_width,
        ${options.thumbnail_dimensions[1]} AS thumbnail_height,
        (SELECT COUNT(1) FROM posts) AS posts,
        (SELECT COUNT(1) FROM tags) AS tags,
        (SELECT COUNT(1) FROM mappings) AS mappings,
        ${untagged.total} AS needs_tags
    `, true);
    
    dbImport.printProgress(false, "Finalizing...");
    
    await query(SQL`UPDATE meta SET hash = ${setupHash}`, true);
    
    dbImport.printProgress(true, "Finalizing...");
    
    console.log(`${chalk.bold.green("\nDatabase rebuild completed")} in ${dbImport.elapsed(startTime)}\n`);
  })();
  
  await initializationLock;
  initializationLock = null;
}


(async () => {
  if(!await isInitialized()) {
    console.log(chalk.bold.yellow("Database update detected, rebuilding..."));
    await initialize();
  }
})().catch(err => {
  console.error("Unable to initialize DB!");
  console.error(err);
  process.exit(1);
});
