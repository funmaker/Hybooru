import http from "http";
import express from "express";
import PromiseRouter from "express-promise-router";
import authMiddleware from "../middlewares/authMiddleware";
import lockMiddleware from "../middlewares/lockMiddleware";
import HTTPError from "../helpers/HTTPError";
import * as db from "../helpers/db";
import * as dbImport from "../helpers/dbImport";
import * as postsController from "../controllers/posts";
import * as tagsController from "../controllers/tags";
import * as globalController from "../controllers/global";
import * as diagnosticsController from "../controllers/diagnostics";
import * as progress from "./progress";
import { DiagnosticsRequest, DiagnosticsResponse, ErrorResponse, PostsGetResponse, PostsSearchRequest, PostsSearchResponse, RegenDBRequest, RegenDBResponse, TagsSearchRequest, TagsSearchResponse } from "./apiTypes";

export const router = PromiseRouter();

router.get<{ id: string }, PostsGetResponse, any, any>("/post/:id", lockMiddleware, async (req, res) => {
  const id = parseInt(req.params.id);
  
  let result;
  if(!isNaN(id)) result = await postsController.get(parseInt(req.params.id));
  else result = null;
  
  res.json(result);
});

router.get<any, PostsSearchResponse, any, PostsSearchRequest>("/post", lockMiddleware, async (req, res) => {
  const result = await postsController.search({ ...req.query, tags: false });
  
  res.json(result);
});

router.get<any, TagsSearchResponse, any, TagsSearchRequest>("/tags", lockMiddleware, async (req, res) => {
  const result = await tagsController.search(req.query);
  
  res.json(result);
});

router.post<any, DiagnosticsResponse, any, DiagnosticsRequest>("/diagnostics", lockMiddleware, authMiddleware, async (req, res) => {
  const stats = await globalController.getStats();
  const benchmark = await db.dbLock.lock("Generating Benchmarks", async () => diagnosticsController.doBenchmark());
  
  res.json({
    benchmark,
    stats,
  });
});

router.post<any, RegenDBResponse, any, RegenDBRequest>("/regendb", lockMiddleware, authMiddleware, async (req, res) => {
  db.dbLock
    .lock("Regenerating Database", async () => await dbImport.rebuild())
    .catch(console.error);
  
  res.json({
    ok: true,
  });
});

router.use(progress.router);

router.use((_req, _res) => {
  throw new HTTPError(404);
});

router.use((err: Partial<HTTPError>, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if((err as any).code === 'ECONNABORTED') return;
  if((err as any).code === 'EBADCSRFTOKEN') err = new HTTPError(403, "Bad CSRF Token");
  if(err.HTTPcode !== 404) console.error(err);
  if(res.headersSent) return;
  
  const code = err.HTTPcode || 500;
  const headers = err.headers || {};
  const error: ErrorResponse = {
    code,
    message: err.publicMessage || http.STATUS_CODES[code] || "Something Happened",
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };
  res.status(code).header(headers).json({ _error: error });
});
