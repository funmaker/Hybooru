import pg, { Pool, PoolClient, QueryResultRow } from 'pg';
import SQL, { SQLStatement } from "sql-template-strings";
import chalk from "chalk";
import configs from "./configs";
import * as dbImport from "./dbImport";

pg.types.setTypeParser(20, Number); // Type Id 20 = BIGINT | BIGSERIAL

export const pool = new Pool(configs.db);

let initializationLock: Promise<void> | null = null;

export async function query<T extends QueryResultRow>(sql: SQLStatement, client: Pool | PoolClient = pool) {
  if(client === pool) await initializationLock;
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

export async function isInitialized() {
  const exists = await queryFirst(SQL`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'meta'
  `);
  
  if(!exists) return false;
  
  const result = await queryFirst<{ hash: number }>(SQL`SELECT hash FROM meta`);
  
  return result?.hash === dbImport.setupHash;
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
  initializationLock = dbImport.rebuild();
  
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
