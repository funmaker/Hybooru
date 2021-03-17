import http from "http";
import express from "express";
import PromiseRouter from "express-promise-router";
import configs from "../helpers/configs";
import HTTPError from "../helpers/HTTPError";
import * as db from "../helpers/db";
import * as postsController from "../controllers/posts";
import * as tagsController from "../controllers/tags";
import { PostsGetResponse, PostsSearchRequest, PostsSearchResponse, RegenDBRequest, RegenDBResponse, TagsSearchRequest, TagsSearchResults } from "./apiTypes";

export const router = PromiseRouter();

router.post<any, RegenDBResponse, RegenDBRequest>("/regendb", async (req, res) => {
  if(typeof configs.adminPassword !== "string") throw new HTTPError(400, "Admin password has not been set in configs.json");
  if(req.body.password !== configs.adminPassword) throw new HTTPError(400, "Invalid Password");
  
  await db.initialize();
  
  res.json({});
});

router.get<{ id: string }, PostsGetResponse, any, any>("/post/:id", async (req, res) => {
  const result = await postsController.get(parseInt(req.params.id));
  
  res.json(result);
});

router.get<any, PostsSearchResponse, any, Partial<PostsSearchRequest>>("/post", async (req, res) => {
  const result = await postsController.search({ ...req.query, includeTags: false });
  
  res.json(result);
});

router.get<any, TagsSearchResults, any, Partial<TagsSearchRequest>>("/tags", async (req, res) => {
  const result = await tagsController.search(req.query);
  
  res.json(result);
});

router.use((_req, _res) => {
  throw new HTTPError(404);
});

router.use((err: Partial<HTTPError>, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  
  const code = err.HTTPcode || 500;
  const error = {
    code,
    message: err.publicMessage || http.STATUS_CODES[code],
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };
  res.status(code).json({ error });
});
