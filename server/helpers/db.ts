import path from "path";
import YAML from 'yaml';
import { Pool, PoolClient } from 'pg';
import SQL, { SQLStatement } from "sql-template-strings";
import chalk from "chalk";
import Database from "better-sqlite3";
import * as postsController from "../controllers/posts";
import configs from "./configs";
import setupSQL from "./dbImport/setup.sql";
import indexesSQL from "./dbImport/indexes.sql";
import * as dbImport from "./dbImport";
import { preparePattern } from "./utils";

export const pool = new Pool(configs.db);

const setupHash = hashCode(setupSQL + indexesSQL);
let initializationLock: Promise<void> | null = null;

export async function query(sql: SQLStatement, client: Pool | PoolClient = pool) {
  if(client === pool) await initializationLock;
  return client.query(sql);
}

export async function queryAll(sql: SQLStatement, client: Pool | PoolClient = pool) {
  if(client === pool) await initializationLock;
  const { rows } = await client.query(sql);
  return rows;
}

export async function queryFirst(sql: SQLStatement, client: Pool | PoolClient = pool) {
  if(client === pool) await initializationLock;
  const { rows } = await client.query(sql);
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
    console.log(chalk.cyan.bold("\nInitializing Database!\n"));
    const startTime = Date.now();
    
    const postgres = await pool.connect();
    await postgres.query("BEGIN");
    
    try {
      await postgres.query(setupSQL);
      
      postsController.clearCache();
      
      const dbPath = findHydrusDB();
      
      const hydrus = new Database(path.resolve(dbPath, "client.db"), { readonly: true });
      await hydrus.exec(`ATTACH '${path.resolve(dbPath, "client.mappings.db")}' AS mappings`);
      await hydrus.exec(`ATTACH '${path.resolve(dbPath, "client.master.db")}' AS master`);
      
      await new dbImport.Posts(hydrus, postgres).start();
      await new dbImport.Urls(hydrus, postgres).start();
      await new dbImport.Tags(hydrus, postgres).start();
      await new dbImport.Mappings(hydrus, postgres).start();
      
      dbImport.printProgress(false, "Importing options... ");
      
      let { options } = hydrus.prepare('SELECT options FROM options').get();
      (global as any).YAML_SILENCE_WARNINGS = true;
      options = YAML.parse(options);
      
      const namespaceColours: Record<string, [number, number, number]> = options.namespace_colours;
      
      const namespaces = Object.entries(namespaceColours)
                               .map(([name, color], id) => ({
                                 id,
                                 name,
                                 color: "#" + (color[0] * 256 * 256 + color[1] * 256 + color[2]).toString(16).padStart(6, "0"),
                               }));
      
      await postgres.query(SQL`
        INSERT INTO namespaces(id, name, color)
        SELECT id, name, color
        FROM json_to_recordset(${JSON.stringify(namespaces)})
          AS x(
            id INTEGER,
            name TEXT,
            color TEXT
          )
      `);
      
      dbImport.printProgress(false, "Applying blacklist...");
      
      const blacklist = configs.tags.blacklist.map(pat => preparePattern(pat));
      
      await postgres.query(SQL`
        DELETE FROM posts
        USING unnest(${blacklist}::TEXT[]) pat
        INNER JOIN tags ON tags.name LIKE pat OR tags.subtag LIKE pat
        INNER JOIN mappings ON mappings.tagid = tags.id
        WHERE mappings.postid = posts.id
      `);
      
      dbImport.printProgress(false, "Removing ignored tags...");
      
      const ignored = configs.tags.ignore.map(pat => preparePattern(pat));
      
      await postgres.query(SQL`
        DELETE FROM tags
        USING unnest(${ignored}::TEXT[]) pat
        WHERE tags.name LIKE pat OR tags.subtag LIKE pat
      `);
      
      dbImport.printProgress(false, "Indexing");
      
      const stmts = (indexesSQL as string).split(";").map(s => s.trim()).filter(s => s);
      dbImport.printProgress([0, stmts.length], "Indexing");
      
      let id = 0;
      for(const stmt of stmts) {
        await postgres.query(stmt);
        id++;
        dbImport.printProgress([id, stmts.length], "Indexing");
      }
      
      dbImport.printProgress(false, "Counting tags usage...");
      
      await postgres.query(SQL`
        UPDATE tags
        SET used = stats.count
        FROM (
          SELECT mappings.tagid as id, COUNT(1) as count
          FROM mappings
          GROUP BY mappings.tagid
        ) stats
        WHERE stats.id = tags.id
      `);
      
      dbImport.printProgress(false, "Calculating statistics...");
      
      const untagged = await postsController.search({ query: configs.tags.untagged, client: postgres });
      
      await postgres.query(SQL`
        INSERT INTO global(thumbnail_width, thumbnail_height, posts, tags, mappings, needs_tags)
        SELECT
          ${options.thumbnail_dimensions[0]} AS thumbnail_width,
          ${options.thumbnail_dimensions[1]} AS thumbnail_height,
          (SELECT COUNT(1) FROM posts) AS posts,
          (SELECT COUNT(1) FROM tags) AS tags,
          (SELECT COUNT(1) FROM mappings) AS mappings,
          ${untagged.total} AS needs_tags
      `);
      
      dbImport.printProgress(false, "Finalizing...");
      
      await postgres.query(SQL`UPDATE meta SET hash = ${setupHash}`);
      await postgres.query(SQL`COMMIT`);
      
      dbImport.printProgress(true, "Finalizing...");
      
      console.log(`${chalk.bold.green("\nDatabase rebuild completed")} in ${dbImport.elapsed(startTime)}\n`);
    } catch(e) {
      await postgres.query("ROLLBACK");
      throw e;
    } finally {
      postgres.release();
    }
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
