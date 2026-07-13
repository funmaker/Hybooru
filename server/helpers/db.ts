import pg, { Pool, PoolClient, QueryResultRow } from 'pg';
import SQL, { SQLStatement } from "sql-template-strings";
import chalk from "chalk";
import configs from "./configs";
import * as dbImport from "./dbImport";
import DbLock from "./dbLock";

pg.types.setTypeParser(20, Number); // Type Id 20 = BIGINT | BIGSERIAL

export const pool = new Pool(configs.db);
export const dbLock = new DbLock();

export async function query<T extends QueryResultRow>(sql: SQLStatement, client: Pool | PoolClient = pool) {
  return client.query<T>(sql);
}

export async function queryAll<T extends QueryResultRow>(sql: SQLStatement, client: Pool | PoolClient = pool) {
  const { rows } = await query<T>(sql, client);
  return rows;
}

export async function queryFirst<T extends QueryResultRow>(sql: SQLStatement, client: Pool | PoolClient = pool) {
  const { rows } = await query<T>(sql, client);
  return rows.length > 0 ? rows[0] : null;
}

export async function queryFirstOrThrow<T extends QueryResultRow>(sql: SQLStatement, client: Pool | PoolClient = pool) {
  const result = await queryFirst<T>(sql, client);
  if(!result) throw new Error("Query returned no rows");
  return result;
}

export async function isInitialized(client: Pool | PoolClient = pool) {
  const exists = await queryFirst(SQL`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'meta'
  `, client);
  
  if(!exists) return false;
  
  const result = await queryFirst<{ hash: number }>(SQL`SELECT hash FROM meta`, client);
  
  return result?.hash === dbImport.setupHash;
}

export async function arePresetsUpToDate(client: Pool | PoolClient = pool) {
  const configPresets = configs.tags.sortPresets;
  if(!configPresets) return true;
  
  const dbPresets = await queryAll<{
    name: string;
    namespaces: string[];
  }>(SQL`
    SELECT name, namespaces
    FROM sort_presets
  `, client);
  
  if(dbPresets.length !== Object.keys(configPresets).length) return false;
  else return dbPresets.every(({ name, namespaces }) =>
    !!configPresets[name]
    && configPresets[name].length === namespaces.length
    && configPresets[name].every((namespace, id) => namespace === namespaces[id]),
  );
}

export function findHydrusDB() {
  let dbPath = configs.hydrusDbPath;
  
  if(!dbPath) {
    const appData = dbPath = (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share"));
    dbPath = `${appData}/hydrus/db`;
  }
  
  return dbPath;
}

dbLock.lock("Initialization", async () => {
  if(!await isInitialized(pool)) {
    console.log(chalk.bold.yellow("Database update detected, rebuilding..."));
    await dbImport.rebuild();
  }
  if(!await arePresetsUpToDate(pool)) {
    console.log(chalk.bold.yellow("Tag sort presets change detected, reindexing..."));
    await dbImport.indexPresets();
  }
}).catch((err) => {
  console.error("Unable to initialize DB!");
  console.error(err);
  process.exit(1);
});
