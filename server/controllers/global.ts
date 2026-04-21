import SQL from "sql-template-strings";
import packageJSON from "../../package.json";
import { Config, Stats, ThumbnailsMode } from "../routes/apiTypes";
import * as db from "../helpers/db";
import configs from "../helpers/configs";

export async function getConfig(): Promise<Config> {
  const config = await db.queryFirstOrThrow<{
    thumbnailSize: [number, number];
    ratingStars: number | null;
    namespaceColors: Record<string, string>;
  }>(SQL`
    SELECT
      ARRAY[ global.thumbnail_width, global.thumbnail_height ] as "thumbnailSize",
      global.rating_stars as "ratingStars",
      CASE WHEN COUNT(namespaces.name) > 0
        THEN json_object_agg(COALESCE(namespaces.name, ''), namespaces.color)
        ELSE '{}'::JSON
      END as "namespaceColors"
    FROM global
    LEFT JOIN namespaces ON TRUE
    GROUP BY global.id
  `);
  
  return {
    ...config,
    appName: configs.appName,
    version: packageJSON.version,
    expectMotd: !!configs.tags.motd,
    untaggedQuery: configs.tags.untagged,
    maxPreviewSize: configs.posts.maxPreviewSize,
    passwordSet: !!configs.adminPassword,
    thumbnailsMode: configs.posts.thumbnailsMode as ThumbnailsMode,
  };
}

export async function getStats(): Promise<Stats> {
  const stats = await db.queryFirstOrThrow<{
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
  
  return stats;
}
