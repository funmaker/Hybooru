import SQL from "sql-template-strings";
import { TagsSearchFullResults, TagsSearchRequest, TagsSearchResponse, TagsSearchResults } from "../routes/apiTypes";
import * as db from "../helpers/db";
import HTTPError from "../helpers/HTTPError";
import { preparePattern } from "../helpers/utils";

const PAGE_SIZE = 50;

const SORTS = {
  id: "id",
  posts: "used",
};


export async function search(options: TagsSearchRequest & { full: false }): Promise<TagsSearchResults>;
export async function search(options: TagsSearchRequest & { full: true }): Promise<TagsSearchFullResults>;
export async function search(options: TagsSearchRequest): Promise<TagsSearchResults | TagsSearchFullResults>;
export async function search({ query = "", sorting, page = 0, pageSize = PAGE_SIZE, full = false }: TagsSearchRequest): Promise<TagsSearchResults | TagsSearchFullResults> {
  if(pageSize > PAGE_SIZE) pageSize = PAGE_SIZE;
  
  let pattern = preparePattern(query.trim());
  
  let sort = SORTS.posts;
  let order = "desc";
  
  if(sorting) {
    if(sorting.endsWith("\\_asc")) {
      order = "asc";
      sorting = sorting.slice(0, -5);
    }
    if(sorting.endsWith("\\_desc")) {
      order = "desc";
      sorting = sorting.slice(0, -6);
    }
    if(!(sorting in SORTS)) throw new HTTPError(400, `Invalid sorting: ${sorting}, expected: ${Object.keys(SORTS).join(", ")}`);
    sort = SORTS[sorting as keyof typeof SORTS];
  }
  
  if(pattern === "") pattern = "%";
  
  const results: TagsSearchFullResults = await db.queryFirst(SQL`
    WITH filtered AS (
          SELECT DISTINCT ON (id)
            COALESCE(better.id, tags.id) AS id,
            COALESCE(better.name, tags.name) AS name,
            COALESCE(better.subtag, tags.subtag) AS subtag,
            COALESCE(better.used, tags.used) AS used
          FROM tags
          LEFT JOIN tag_siblings ON tag_siblings.tagid = tags.id
          LEFT JOIN tags better ON tag_siblings.betterid = better.id
          WHERE tags.name LIKE ${pattern} OR tags.subtag LIKE ${pattern}
        )
    SELECT
      COALESCE(json_agg(json_build_object(
        'name', name,
        'posts', used,
        'siblings', siblings,
        'parents', parents
      )), '[]') AS tags,
      (SELECT count(1) FROM filtered)::INTEGER as total,
      ${pageSize}::INTEGER as "pageSize"
    FROM (
      SELECT
        filtered.id,
        filtered.name,
        filtered.subtag,
        filtered.used,
        (
          SELECT COALESCE(json_agg(siblings.name), '[]')
          FROM tag_siblings
          LEFT JOIN tags siblings ON tagid = siblings.id
          WHERE betterid = filtered.id
        ) siblings,
        (
          SELECT COALESCE(json_agg(parents.name), '[]')
          FROM tag_parents
          LEFT JOIN tags parents ON parentid = parents.id
          WHERE tagid = filtered.id
        ) parents
      FROM filtered
      ORDER BY `.append(`filtered."${sort}" ${order}, filtered.id ${order}`).append(SQL`
      LIMIT ${pageSize}
      OFFSET ${page * pageSize}
    ) x
  `));
  
  if(full) {
    return results;
  } else {
    return {
      ...results,
      tags: Object.fromEntries(results.tags.map(tag => [tag.name, tag.posts])),
    };
  }
}
