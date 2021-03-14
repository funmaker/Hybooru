import SQL from "sql-template-strings";
import { Stats } from "../routes/apiTypes";
import * as db from "../helpers/db";

export async function getStats(): Promise<Stats> {
  const stats = await db.queryFirst(SQL`
    SELECT
      posts,
      tags,
      mappings,
      needs_tags as "needsTags"
    FROM global
  `);
  
  if(!stats) throw new Error("Globals couldn't be fetched!");
  
  return stats;
}
