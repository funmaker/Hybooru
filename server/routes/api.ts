import http from "http";
import express from "express";
import PromiseRouter from "express-promise-router";
import HTTPError from "../helpers/HTTPError";
import * as db from "../helpers/db";
import * as postsController from "../controllers/posts";
import { PostsGetResponse, PostsSearchRequest, PostsSearchResponse, RegenDBResponse } from "./apiTypes";

export const router = PromiseRouter();

router.get<any, RegenDBResponse>("/regendb", async (req, res) => {
  await db.initialize();
  
  res.json({});
});

router.get<any, PostsSearchResponse, any, Partial<PostsSearchRequest>>("/search", async (req, res) => {
  const result = await postsController.search(req.query.query, req.query.page, !req.query.page);
  
  res.json(result);
});

router.get<{ id: string }, PostsGetResponse, any, any>("/post/:id", async (req, res) => {
  const result = await postsController.get(parseInt(req.params.id));
  
  res.json(result);
});

router.use((_req, _res) => {
  throw new HTTPError(404);
});

router.use((err: Partial<HTTPError>, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  
  const code = err.HTTPcode || 500;
  const result = {
    code,
    message: err.publicMessage || http.STATUS_CODES[code],
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };
  res.status(code).json(result);
});
