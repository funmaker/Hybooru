import * as expressCore from "express-serve-static-core";
import * as db from "../helpers/db";
import HTTPError from "../helpers/HTTPError";

export default async function lockMiddleware(req: expressCore.RequestEx<any, any, any>, res: expressCore.ResponseEx<any>, next: expressCore.NextFunction) {
  if(db.dbLock.isLocked()) throw new HTTPError(503, db.dbLock.lockName ?? "Doing something", { "X-Hybooru-DbLock": "true" });
  else next();
}
