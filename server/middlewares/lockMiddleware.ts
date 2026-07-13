import express from "express";
import * as db from "../helpers/db";
import HTTPError from "../helpers/HTTPError";

export default async function lockMiddleware(req: express.Request<any>, res: express.Response<any>, next: express.NextFunction) {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  if(db.dbLock.isLocked()) throw new HTTPError(503, db.dbLock.lockName ?? "Doing something", { "X-Hybooru-DbLock": "true" });
  else next();
}
