import express from "express";
import { Config } from "../routes/apiTypes";
import * as globalController from "../controllers/global";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      config: Config;
    }
  }
}

export default async function configMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  req.config = await globalController.getConfig();
  
  next();
}
