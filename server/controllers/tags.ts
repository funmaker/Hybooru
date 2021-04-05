import SQL from "sql-template-strings";
import { TagsSearchResponse } from "../routes/apiTypes";
import * as db from "../helpers/db";
import HTTPError from "../helpers/HTTPError";
import { preparePattern } from "../helpers/utils";

const PAGE_SIZE = 50;

const SORTS = {
  id: "id",
  posts: "used",
};

export async function search({ query = "", sorting = "", page = 0, pageSize = PAGE_SIZE }): Promise<TagsSearchResponse> {
  if(pageSize > PAGE_SIZE) pageSize = PAGE_SIZE;
  
  let pattern = preparePattern(query);
  
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
  
  return await db.queryFirst(SQL`
    WITH filtered AS (
          SELECT *
          FROM tags
          WHERE name ILIKE ${pattern} OR subtag ILIKE ${pattern}
        )
    SELECT
      COALESCE(json_object_agg(name, used), '{}') AS tags,
      (SELECT count(1) FROM filtered)::INTEGER as total,
      ${pageSize}::INTEGER as "pageSize"
    FROM (
      SELECT *
      FROM filtered
      ORDER BY `.append(`filtered."${sort}" ${order}, filtered.id ${order}`).append(SQL`
      LIMIT ${pageSize}
      OFFSET ${page * pageSize}
    ) x
  `));
}
