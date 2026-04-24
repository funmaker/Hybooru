import http from "http";
import express from "express";
import PromiseRouter from "express-promise-router";
import authMiddleware from "../middlewares/authMiddleware";
import configs from "../helpers/configs";
import HTTPError from "../helpers/HTTPError";
import * as db from "../helpers/db";
import * as postsController from "../controllers/posts";
import * as tagsController from "../controllers/tags";
import * as globalController from "../controllers/global";
import * as diagnosticsController from "../controllers/diagnostics";
import { PostsGetResponse, PostsSearchRequest, PostsSearchResponse, RegenDBRequest, RegenDBResponse, TagsSearchRequest, TagsSearchResponse } from "./apiTypes";

export const router = PromiseRouter();

router.get<{ id: string }, PostsGetResponse, any, any>("/post/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  
  let result;
  if(!isNaN(id)) result = await postsController.get(parseInt(req.params.id));
  else result = null;
  
  res.json(result);
});

router.get<any, PostsSearchResponse, any, PostsSearchRequest>("/post", async (req, res) => {
  const result = await postsController.search({ ...req.query, tags: false });
  
  res.json(result);
});

router.get<any, TagsSearchResponse, any, TagsSearchRequest>("/tags", async (req, res) => {
  const result = await tagsController.search(req.query);
  
  res.json(result);
});

router.get<any, any, any, any>("/diagnostics", authMiddleware, async (req, res) => {
  const benchmark = await diagnosticsController.doBenchmark();
  const stats = await globalController.getStats();
  
  res.json({
    benchmark,
    stats,
  });
});

router.post<any, RegenDBResponse, any, RegenDBRequest>("/regendb", authMiddleware, async (req, res) => {
  await db.initialize();
  
  res.json({
    ok: true,
  });
});

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
  const error = {
    code,
    message: err.publicMessage || http.STATUS_CODES[code] || "Something Happened",
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };
  res.status(code).header(headers).json({ _error: error });
});
