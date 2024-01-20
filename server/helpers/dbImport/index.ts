import path from "path";
import chalk from "chalk";
import SqliteDatabase, { Database } from "better-sqlite3";
import YAML from "yaml";
import SQL, { SQLStatement } from "sql-template-strings";
import { PoolClient } from "pg";
import * as postsController from "../../controllers/posts";
import { Relation } from "../../routes/apiTypes";
import { preparePattern } from "../utils";
import { findHydrusDB, pool } from "../db";
import { ServiceID } from "../consts";
import configs from "../configs";
import { elapsed, printProgress } from "./pretty";
import indexesSQL from "./indexes.sql";
import setupSQL from "./setup.sql";
import Posts from "./posts";
import Tags from "./tags";
import Mappings from "./mappings";
import Urls from "./urls";
import Notes from "./notes";
import TagParents from "./tagParents";
import TagSiblings from "./tagSiblings";

const MIN_HYDRUS_VER = 545;

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

export const setupHash = hashCode(setupSQL + indexesSQL);

export async function rebuild() {
  console.log(chalk.cyan.bold("\nRebuilding Database!\n"));
  const startTime = Date.now();
  
  const postgres = await pool.connect();
  await postgres.query("BEGIN");
  
  try {
    await postgres.query(setupSQL);
    
    postsController.clearCache();
    
    const dbPath = findHydrusDB();
    const resolveRelations = configs.tags.resolveRelations;
    
    const hydrus = new SqliteDatabase(path.resolve(dbPath, "client.db"), { readonly: true });
    await hydrus.exec(`ATTACH '${path.resolve(dbPath, "client.mappings.db")}' AS mappings`);
    await hydrus.exec(`ATTACH '${path.resolve(dbPath, "client.master.db")}' AS master`);
    
    const { version } = hydrus.prepare('SELECT version FROM version;').get();
    if(version < MIN_HYDRUS_VER) throw new Error(`Unsupported Hydrus version(min: v${MIN_HYDRUS_VER}, current: v${version}), Update Hydrus to the newest version.`);
    
    const filesServices = findFilesServices(hydrus);
    const ratingsService = findRatingsService(hydrus);
    const mappingsServices = findMappingsServices(hydrus);
    
    await new Posts(hydrus, postgres, ratingsService).startEach(filesServices);
    await new Urls(hydrus, postgres).start();
    await new Notes(hydrus, postgres).start();
    await new Tags(hydrus, postgres).start();
    await new Mappings(hydrus, postgres).startEach(mappingsServices);
    
    if(resolveRelations) await new TagParents(hydrus, postgres, mappingsServices).start();
    if(resolveRelations) await new TagSiblings(hydrus, postgres, mappingsServices).start();
    
    const options = await importOptions(hydrus, postgres);
    
    await resolveFileRelations(hydrus, postgres);
    if(resolveRelations) await normalizeTagRelations(postgres);
    
    if(configs.tags.blacklist && configs.tags.blacklist.length > 0) await applyBlacklist(postgres);
    if(configs.tags.whitelist && configs.tags.whitelist.length > 0) await applyWhitelist(postgres);
    if(configs.tags.ignore.length > 0) await removeIgnored(postgres);
    
    if(resolveRelations) await applyTagParents(postgres);
    await createIndexes(postgres);
    if(resolveRelations) await applyTagSiblings(postgres);
    await countUsage(postgres);
    await calculateStatistics(postgres, options, ratingsService);
    
    printProgress(false, "Finalizing...");
    hydrus.close();
    await postgres.query(SQL`UPDATE meta SET hash = ${setupHash}`);
    await postgres.query(SQL`COMMIT`);
    printProgress(true, "Finalizing...");
    
    console.log(`${chalk.bold.green("\nDatabase rebuild completed")} in ${elapsed(startTime)}\n`);
  } catch(e) {
    await postgres.query("ROLLBACK");
    throw e;
  } finally {
    postgres.release();
  }
}

export interface Service {
  id: number;
  name: string;
  trash: boolean;
}

function findFilesServices(hydrus: Database) {
  let services: Service[] = hydrus.prepare(`
    SELECT
      service_id AS id,
      name,
      service_type = ${ServiceID.LOCAL_FILE_TRASH_DOMAIN} AS trash
    FROM services
    WHERE service_type = ${ServiceID.LOCAL_FILE_DOMAIN}
       OR service_type = ${ServiceID.FILE_REPOSITORY}
       OR service_type = ${ServiceID.LOCAL_FILE_TRASH_DOMAIN}
   `).all();
  if(services.length === 0) throw new Error("Unable to locate any file services!");
  
  if(configs.posts.services) {
    for(const desired of configs.posts.services) {
      if(typeof desired === "string") {
        if(services.every(s => s.name !== desired)) throw new Error(`Unable to locate file service with name '${desired}'`);
      } else {
        if(services.every(s => s.id !== desired)) throw new Error(`Unable to locate file service with id '${desired}'`);
      }
    }
    
    services = services.filter(s => configs.posts.services?.includes(s.name) || configs.posts.services?.includes(s.id));
  }
  
  return services;
}

function findRatingsService(hydrus: Database) {
  if(configs.rating && configs.rating.enabled) {
    if(configs.rating.serviceName !== null) {
      const service: { id: number; type: number } | undefined = hydrus.prepare(`SELECT service_id AS id, service_type AS type FROM services WHERE name = ?`).get(configs.rating.serviceName);
      
      if(!service) throw new Error(`There is no rating service ${configs.rating.serviceName}!`);
      else if(service.type !== ServiceID.LOCAL_RATING_NUMERICAL) throw new Error(`Service ${configs.rating.serviceName} is not a numerical rating service!`);
      else return service.id;
    } else {
      const service: { id: number } | undefined = hydrus.prepare(`SELECT service_id AS id FROM services WHERE service_type = ?`).get(ServiceID.LOCAL_RATING_NUMERICAL);
      
      if(!service) {
        console.error(chalk.yellow("Unable to locate any numerical rating service! Rating disabled."));
        configs.rating = null;
      } else {
        return service.id;
      }
    }
  }
  
  return null;
}

function findMappingsServices(hydrus: Database) {
  let services: Service[] = hydrus.prepare(`SELECT service_id AS id, name FROM services WHERE service_type = ${ServiceID.LOCAL_TAG} OR service_type = ${ServiceID.TAG_REPOSITORY}`).all();
  if(services.length === 0) throw new Error("Unable to locate any tag services!");
  
  if(configs.tags.services) {
    for(const desired of configs.tags.services) {
      if(typeof desired === "string") {
        if(services.every(s => s.name !== desired)) throw new Error(`Unable to locate tag service with name '${desired}'`);
      } else {
        if(services.every(s => s.id !== desired)) throw new Error(`Unable to locate tag service with id '${desired}'`);
      }
    }
    
    services = services.filter(s => configs.tags.services?.includes(s.name) || configs.tags.services?.includes(s.id));
  }
  
  return services.map(service => service.id);
}

async function importOptions(hydrus: Database, postgres: PoolClient) {
  printProgress(false, "Importing options... ");
  
  let { options } = hydrus.prepare('SELECT options FROM options').get();
  (global as any).YAML_SILENCE_WARNINGS = true;
  options = YAML.parse(options);
  (global as any).YAML_SILENCE_WARNINGS = false;
  
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
  
  printProgress(true, "Importing options... ");
  
  return options;
}

async function resolveFileRelations(hydrus: Database, postgres: PoolClient) {
  printProgress(false, "Resolving file relations...");
  
  const groups: Array<{
    mediaId: number;
    bestPostId: number;
    duplicates: string | null;
    alternatives: string | null;
  }> = hydrus.prepare(`
    SELECT
      duplicate_files.media_id AS "mediaId", duplicate_files.king_hash_id AS "bestPostId",
      group_concat(duplicate_file_members.hash_id) AS duplicates,
      (
        SELECT group_concat(alts.hash_id)
        FROM duplicate_file_members alts
        INNER JOIN alternate_file_group_members afgm1 ON afgm1.media_id = alts.media_id
        INNER JOIN alternate_file_group_members afgm2 ON afgm2.alternates_group_id = afgm1.alternates_group_id AND afgm1.media_id != afgm2.media_id
        WHERE afgm2.media_id = duplicate_files.media_id
      ) AS alternatives
    FROM duplicate_files
    LEFT JOIN duplicate_file_members ON duplicate_files.media_id == duplicate_file_members.media_id
    GROUP BY duplicate_files.media_id
    HAVING count(1) > 1 OR alternatives IS NOT NULL
  `).all();
  
  const relations: Array<{ post: number; other: number; kind: Relation }> = [];
  
  for(const group of groups) {
    if(!group.duplicates) continue;
    
    const duplicates = group.duplicates.split(",").map(dup => parseInt(dup));
    const alternatives = group.alternatives?.split(",").map(dup => parseInt(dup)) || [];
    
    for(const post of duplicates) {
      for(const other of duplicates) {
        if(post === other) continue;
        
        relations.push({
          post,
          other,
          kind: other === group.bestPostId ? Relation.DUPLICATE_BEST : Relation.DUPLICATE,
        });
      }
      
      for(const other of alternatives) {
        relations.push({
          post,
          other,
          kind: Relation.ALTERNATE,
        });
      }
    }
  }
  
  await postgres.query(SQL`
    INSERT INTO relations(postid, other_postid, kind)
    SELECT (relation->>'post')::INTEGER, (relation->>'other')::INTEGER, relation->>'kind'
    FROM unnest(${relations}::JSON[]) relation
  `);
  
  printProgress(true, "Resolving file relations...");
}

async function normalizeTagRelations(postgres: PoolClient) {
  printProgress([0, 6], "Normalizing tags");
  
  const siblingsLoops = await postgres.query(SQL`
    WITH RECURSIVE paths(tagid, visited) AS (
        SELECT DISTINCT tag_siblings.betterid, ARRAY[tag_siblings.tagid]
        FROM tag_siblings
      UNION ALL
        SELECT tag_siblings.betterid, paths.visited || paths.tagid
        FROM paths
        INNER JOIN tag_siblings ON tag_siblings.tagid = paths.tagid
        WHERE paths.tagid != ALL(paths.visited)
    ), loops(tagid, visited) AS (
      SELECT *
      FROM paths
      WHERE tagid = visited[1] AND tagid <= ALL(visited)
      ORDER BY tagid
    )
    DELETE FROM tag_siblings
    USING loops
    WHERE tag_siblings.tagid = loops.tagid AND tag_siblings.betterid = loops.visited[array_upper(loops.visited, 1)]
    RETURNING loops.visited || loops.tagid AS path
  `);
  
  printProgress([1, 6], "Normalizing tags");
  
  await postgres.query(SQL`
    WITH RECURSIVE roots(tagid, rootid) AS (
        SELECT DISTINCT betterid, betterid
        FROM tag_siblings
        WHERE NOT EXISTS(SELECT 1 FROM tag_siblings ts2 WHERE ts2.tagid = tag_siblings.betterid)
      UNION ALL
        SELECT DISTINCT tag_siblings.tagid, roots.rootid
        FROM roots
        INNER JOIN tag_siblings ON tag_siblings.betterid = roots.tagid
    ),
    bad_siblings AS (
      DELETE FROM tag_siblings
      USING roots
      WHERE tag_siblings.tagid = roots.tagid
        AND tag_siblings.betterid != roots.rootid
      RETURNING tag_siblings.tagid, roots.rootid
    )
    INSERT INTO tag_siblings(tagid, betterid)
    TABLE bad_siblings
    ON CONFLICT DO NOTHING
  `);
  
  printProgress([2, 6], "Normalizing tags");
  
  await postgres.query(SQL`
    WITH bad_parents AS (
      DELETE FROM tag_parents
      USING tag_siblings
      WHERE tag_siblings.tagid = tag_parents.tagid
      RETURNING tag_siblings.betterid, tag_parents.parentid
    )
    INSERT INTO tag_parents(tagid, parentid)
    TABLE bad_parents
    ON CONFLICT DO NOTHING
  `);
  
  printProgress([3, 6], "Normalizing tags");
  
  await postgres.query(SQL`
    WITH bad_parents AS (
      DELETE FROM tag_parents
      USING tag_siblings
      WHERE tag_siblings.tagid = tag_parents.parentid
      RETURNING tag_parents.tagid, tag_siblings.betterid
    )
    INSERT INTO tag_parents(tagid, parentid)
    TABLE bad_parents
    ON CONFLICT DO NOTHING
  `);
  
  printProgress([4, 6], "Normalizing tags");
  
  await postgres.query(SQL`
    WITH bad_maps AS (
      DELETE FROM mappings
      USING tag_siblings
      WHERE tag_siblings.tagid = mappings.tagid
      RETURNING mappings.postid, tag_siblings.betterid
    )
    INSERT INTO mappings(postid, tagid)
    SELECT postid, betterid FROM bad_maps
    ON CONFLICT DO NOTHING
  `);
  
  printProgress([5, 6], "Normalizing tags");
  
  const parentLoops = await postgres.query(SQL`
    WITH RECURSIVE paths(tagid, visited) AS (
        SELECT DISTINCT tag_parents.parentid, ARRAY[tag_parents.tagid]
        FROM tag_parents
      UNION ALL
        SELECT tag_parents.parentid, paths.visited || paths.tagid
        FROM paths
        INNER JOIN tag_parents ON tag_parents.tagid = paths.tagid
        WHERE paths.tagid != ALL(paths.visited)
    ), loops(tagid, visited) AS (
      SELECT *
      FROM paths
      WHERE tagid = visited[1] AND tagid <= ALL(visited)
      ORDER BY tagid
    )
    DELETE FROM tag_parents
    USING loops
    WHERE tag_parents.tagid = loops.tagid AND tag_parents.parentid = loops.visited[array_upper(loops.visited, 1)]
    RETURNING loops.visited || loops.tagid AS path
  `);
  
  printProgress([6, 6], "Normalizing tags");
  
  if(siblingsLoops.rows.length > 0) {
    console.error(`${chalk.bold.yellow("Warning!")} Detected ${siblingsLoops.rows.length} loops in tag siblings!`);
    
    if(configs.tags.reportLoops) {
      console.error();
      
      const mapped = await postgres.query(SQL`
        SELECT string_agg(COALESCE(tags.name, 'null'), ' <- ' ORDER BY path_el.id) AS path
        FROM jsonb_array_elements(${JSON.stringify(siblingsLoops.rows.map(row => row.path))}) WITH ORDINALITY paths(path, pathid),
             jsonb_array_elements(paths.path) WITH ORDINALITY path_el(tagid, id)
        LEFT JOIN tags ON tags.id = path_el.tagid::INTEGER
        GROUP BY paths.pathid
      `);
      
      for(const loop of mapped.rows) console.error(chalk.gray(loop.path));
      
      console.error(chalk.bold("\nLast relation of these chains has been ignored.\n"));
    }
  }
  
  if(parentLoops.rows.length > 0) {
    console.error(`${chalk.bold.yellow("Warning!")} Detected ${parentLoops.rows.length} loops in tag parents!`);
    
    if(configs.tags.reportLoops) {
      console.error();
      
      const mapped = await postgres.query(SQL`
        SELECT string_agg(COALESCE(tags.name, 'null'), ' <- ' ORDER BY path_el.id) AS path
        FROM jsonb_array_elements(${JSON.stringify(parentLoops.rows.map(row => row.path))}) WITH ORDINALITY paths(path, pathid),
             jsonb_array_elements(paths.path) WITH ORDINALITY path_el(tagid, id)
        LEFT JOIN tags ON tags.id = path_el.tagid::INTEGER
        GROUP BY paths.pathid
      `);
      
      for(const loop of mapped.rows) console.error(chalk.gray(loop.path));
      
      console.error(chalk.bold("\nLast relation of these chains has been ignored.\n"));
    }
  }
}

async function applyBlacklist(postgres: PoolClient) {
  printProgress(false, "Applying blacklist...");
  
  const blacklist = configs.tags.blacklist?.map(pat => preparePattern(pat)) || [];
  const tags = blacklist.filter(pattern => !pattern.startsWith("system:"));
  const system = blacklist.filter(pattern => pattern.startsWith("system:"));
  
  if(tags.length > 0) {
    await postgres.query(SQL`
      DELETE FROM posts
      USING unnest(${tags}::TEXT[]) pat
      INNER JOIN tags ON tags.name LIKE pat OR tags.subtag LIKE pat
      INNER JOIN mappings ON mappings.tagid = tags.id
      WHERE mappings.postid = posts.id
    `);
  }
  
  const systemFlags: SQLStatement[] = [];
  if(system.includes("system:inbox")) systemFlags.push(SQL`posts.inbox`);
  if(system.includes("system:archive")) systemFlags.push(SQL`NOT posts.inbox`);
  if(system.includes("system:trash")) systemFlags.push(SQL`posts.trash`);
  const systemWhere = systemFlags.reduce((acc: null | SQLStatement, val) => (acc ? acc.append(" OR ") : SQL`WHERE `).append(val), null);
  
  if(systemWhere) {
    await postgres.query(SQL`
    DELETE FROM posts
    `.append(systemWhere));
  }
  
  printProgress(true, "Applying blacklist...");
}

async function applyWhitelist(postgres: PoolClient) {
  printProgress(false, "Applying whitelist...");
  
  const whitelist = configs.tags.whitelist?.map(pat => preparePattern(pat)) || [];
  const tags = whitelist.filter(pattern => !pattern.startsWith("system:"));
  const system = whitelist.filter(pattern => pattern.startsWith("system:"));
  
  if(tags.length > 0) {
    await postgres.query(SQL`
      DELETE FROM posts
      WHERE NOT EXISTS(
        SELECT 1
        FROM unnest(${tags}::TEXT[]) pat
        INNER JOIN tags ON tags.name LIKE pat OR tags.subtag LIKE pat
        INNER JOIN mappings ON mappings.tagid = tags.id
        WHERE mappings.postid = posts.id
      )
    `);
  }
  
  const systemFlags: SQLStatement[] = [];
  if(system.includes("system:inbox")) systemFlags.push(SQL`NOT posts.inbox`);
  if(system.includes("system:archive")) systemFlags.push(SQL`posts.inbox`);
  if(system.includes("system:trash")) systemFlags.push(SQL`NOT posts.trash`);
  const systemWhere = systemFlags.reduce((acc: null | SQLStatement, val) => (acc ? acc.append(" OR ") : SQL`WHERE `).append(val), null);
  
  if(systemWhere) {
    await postgres.query(SQL`
    DELETE FROM posts
    `.append(systemWhere));
  }
  
  
  printProgress(true, "Applying whitelist...");
}

async function removeIgnored(postgres: PoolClient) {
  printProgress(false, "Removing ignored tags...");
  
  const ignored = configs.tags.ignore.map(pat => preparePattern(pat));
  
  const result = await postgres.query<{ id: number }>(SQL`
    DELETE FROM tags
    USING unnest(${ignored}::TEXT[]) pat
    WHERE tags.name LIKE pat OR tags.subtag LIKE pat
    RETURNING id
  `);
  
  await postgres.query(SQL`
    DELETE FROM tags
    USING unnest(${result.rows.map(row => row.id)}::INTEGER[]) deleted
    LEFT JOIN tag_siblings ON tag_siblings.tagid = deleted
    WHERE tag_siblings.betterid = tags.id
  `);
  
  await postgres.query(SQL`
    DELETE FROM tags
    USING unnest(${result.rows.map(row => row.id)}::INTEGER[]) deleted
    LEFT JOIN tag_siblings ON tag_siblings.betterid = deleted
    WHERE tag_siblings.tagid = tags.id
  `);
  
  printProgress(true, "Removing ignored tags...");
}

async function applyTagParents(postgres: PoolClient) {
  printProgress(false, "Resolving tag parents...");
  
  await postgres.query(SQL`
    WITH RECURSIVE ancestors(tagid, ancestorid) AS (
        SELECT tagid, parentid
        FROM tag_parents
      UNION ALL
        SELECT tag_parents.tagid, ancestors.ancestorid
        FROM ancestors
        INNER JOIN tag_parents ON tag_parents.parentid = ancestors.tagid
    )
    INSERT INTO mappings(postid, tagid)
    SELECT mappings.postid, ancestors.ancestorid
    FROM mappings
    INNER JOIN ancestors ON mappings.tagid = ancestors.tagid
    ON CONFLICT DO NOTHING
  `);
  
  printProgress(true, "Resolving tag parents...");
}

async function createIndexes(postgres: PoolClient) {
  printProgress(false, "Indexing");
  
  const stmts = (indexesSQL as string).split(";").map(s => s.trim()).filter(s => s);
  printProgress([0, stmts.length], "Indexing");
  
  let id = 0;
  for(const stmt of stmts) {
    await postgres.query(stmt);
    id++;
    printProgress([id, stmts.length], "Indexing");
  }
}

async function applyTagSiblings(postgres: PoolClient) {
  printProgress(false, "Resolving tag siblings...");
  
  await postgres.query(SQL`
    INSERT INTO tag_postids
    SELECT tag_siblings.tagid, tag_postids.postids
    FROM tag_siblings
    INNER JOIN tag_postids ON tag_postids.tagid = tag_siblings.betterid
  `);
  
  printProgress(true, "Resolving tag siblings...");
}

async function countUsage(postgres: PoolClient) {
  printProgress(false, "Counting tags usage...");
  
  await postgres.query(SQL`
    UPDATE tags
    SET used = icount(tag_postids.postids)
    FROM tag_postids
    WHERE tag_postids.tagid = tags.id
  `);
  
  printProgress(true, "Counting tags usage...");
}

async function calculateStatistics(postgres: PoolClient, options: any, ratingsService: number | null) {
  printProgress(false, "Calculating statistics...");
  
  const untagged = await postsController.search({ query: configs.tags.untagged }, postgres);
  
  let stars = configs.rating?.stars || null;
  if(ratingsService === null) stars = null;
  
  await postgres.query(SQL`
    INSERT INTO global(thumbnail_width, thumbnail_height, posts, tags, mappings, needs_tags, rating_stars)
    SELECT
      ${options.thumbnail_dimensions[0]} AS thumbnail_width,
      ${options.thumbnail_dimensions[1]} AS thumbnail_height,
      (SELECT COUNT(1) FROM posts) AS posts,
      (SELECT COUNT(1) FROM tags) AS tags,
      (SELECT COUNT(1) FROM mappings) AS mappings,
      ${untagged.total} AS needs_tags,
      ${stars} AS rating_stars
  `);
  
  printProgress(true, "Calculating statistics...");
}
