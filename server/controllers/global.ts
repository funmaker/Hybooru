import SQL from "sql-template-strings";
import packageJSON from "../../package.json";
import { Config, Stats, ThumbnailsMode } from "../routes/apiTypes";
import * as db from "../helpers/db";
import configs from "../helpers/configs";

export async function getConfig(): Promise<Config> {
  const config: Config = {
    thumbnailSize: [128, 128],
    ratingStars: configs.rating?.enabled ? configs.rating.stars : null,
    namespaceColors: {},
    appName: configs.appName,
    version: packageJSON.version,
    expectMotd: !!configs.tags.motd,
    untaggedQuery: configs.tags.untagged,
    maxPreviewSize: configs.posts.maxPreviewSize,
    passwordSet: !!configs.adminPassword,
    thumbnailsMode: configs.posts.thumbnailsMode as ThumbnailsMode,
    busy: true,
    sortPresets: configs.tags.sortPresets ? Object.keys(configs.tags.sortPresets) : [],
  };
  
  if(!db.dbLock.isLocked()) {
    const dbConfig = await db.queryFirstOrThrow<{
      thumbnailSize: [number, number];
      ratingStars: number | null;
      namespaceColors: Record<string, string>;
    }>(SQL`
      SELECT
        ARRAY[ global.thumbnail_width, global.thumbnail_height ] as "thumbnailSize",
        CASE WHEN COUNT(namespaces.name) > 0
          THEN json_object_agg(COALESCE(namespaces.name, ''), namespaces.color)
          ELSE '{}'::JSON
        END as "namespaceColors"
      FROM global
      LEFT JOIN namespaces ON TRUE
      GROUP BY global.id
    `);
    
    config.thumbnailSize = dbConfig.thumbnailSize;
    config.namespaceColors = dbConfig.namespaceColors;
    config.busy = false;
  }
  
  return config;
}

export async function getStats(noLock?: boolean): Promise<Stats> {
  return await db.queryFirstOrThrow<{
    posts: number;
    tags: number;
    mappings: number;
    needsTags: number;
  }>(SQL`
    SELECT
      posts,
      tags,
      mappings,
      needs_tags as "needsTags"
    FROM global
  `);
}
