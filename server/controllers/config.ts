import SQL from "sql-template-strings";
import { Config } from "../routes/apiTypes";
import * as db from "../helpers/db";
import configs from "../helpers/configs";

export async function getConfig(): Promise<Config> {
  const config = await db.queryFirst(SQL`
    SELECT
      ARRAY[ global.thumbnail_width, global.thumbnail_height ] as "thumbnailSize",
      json_object_agg(namespaces.name, namespaces.color) as "namespaceColors"
    FROM global
    CROSS JOIN namespaces
    GROUP BY global.id
  `);
  
  if(!config) throw new Error("Globals couldn't be fetched!");
  
  return {
    ...config,
    appName: configs.appName,
  };
}
