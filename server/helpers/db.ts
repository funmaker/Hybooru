import { Pool, PoolClient } from 'pg';
import SQL, { SQLStatement } from "sql-template-strings";
import chalk from "chalk";
import configs from "./configs";
import * as dbImport from "./dbImport";

export const pool = new Pool(configs.db);

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

export async function isInitialized() {
  const exists = await queryFirst(SQL`
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'meta'
  `);
  
  if(!exists) return false;
  
  const { hash } = await queryFirst(SQL`SELECT hash FROM meta`);
  
  return hash === dbImport.setupHash;
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
