import SQL, { SQLStatement } from "sql-template-strings";
import { TagsSearchFullResults, TagsSearchRequest, TagsSearchResults } from "../routes/apiTypes";
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
export async function search(options: TagsSearchRequest): Promise<TagsSearchResults | TagsSearchFullResults> {
  const query = tagSearchQuery(options);
  
  const results = await db.queryFirstOrThrow<{
    tags: Array<{
      name: string;
      posts: number;
      siblings: string[];
      parents: string[];
    }>;
    total: number;
    pageSize: number;
  }>(query);
  
  if(options.full) {
    return results;
  } else {
    return {
      ...results,
      tags: Object.fromEntries(results.tags.map(tag => [tag.name, tag.posts])),
    };
  }
}

export function tagSearchQuery({ query = "", sorting, page = 0, pageSize = PAGE_SIZE }: TagsSearchRequest): SQLStatement {
  if(pageSize > PAGE_SIZE) pageSize = PAGE_SIZE;
  page = Math.max(0, Math.floor(page));
  
  const pattern = preparePattern(query.trim());
  
  let sort = SORTS.posts;
  let order = "desc";
  
  if(sorting) {
    if(sorting.endsWith("_asc")) {
      order = "asc";
      sorting = sorting.slice(0, -4);
    }
    if(sorting.endsWith("_desc")) {
      order = "desc";
      sorting = sorting.slice(0, -5);
    }
    if(!(sorting in SORTS)) throw new HTTPError(400, `Invalid sorting: ${sorting}, expected: ${Object.keys(SORTS).join(", ")}`);
    sort = SORTS[sorting as keyof typeof SORTS];
  }
  
  let filteredCTE: SQLStatement;
  if(pattern) {
    filteredCTE = SQL`
      filtered AS (
        SELECT DISTINCT
          COALESCE(tag_siblings.betterid, tags.id) AS id
        FROM tags
        LEFT JOIN tag_siblings ON tag_siblings.tagid = tags.id
        WHERE tags.name LIKE ${pattern}
           OR tags.subtag LIKE ${pattern}
      )
    `;
  } else {
    filteredCTE = SQL`
      filtered AS (
        SELECT
          tags.id AS id
        FROM tags
        LEFT JOIN tag_siblings ON tag_siblings.tagid = tags.id
        WHERE tag_siblings.betterid IS NULL
      )
    `;
  }
  
  return SQL`
    WITH `.append(filteredCTE)
          .append(SQL`
    SELECT
      COALESCE(json_agg(json_build_object(
        'name', name,
        'posts', used,
        'siblings', (
          SELECT COALESCE(json_agg(siblings.name), '[]')
          FROM tag_siblings
          LEFT JOIN tags siblings ON tagid = siblings.id
          WHERE betterid = x.id
        ),
        'parents', (
          SELECT COALESCE(json_agg(parents.name), '[]')
          FROM tag_parents
          LEFT JOIN tags parents ON parentid = parents.id
          WHERE tagid = x.id
        )
      )), '[]') AS tags,
      (SELECT count(1) FROM filtered)::INTEGER as total,
      ${pageSize}::INTEGER as "pageSize"
    FROM (
      SELECT tags.*
      FROM filtered
      INNER JOIN tags ON tags.id = filtered.id
      ORDER BY `).append(`tags."${sort}" ${order}, tags.id ${order}`).append(SQL`
      LIMIT ${pageSize}
      OFFSET ${page * pageSize}
    ) x
  `);
}
