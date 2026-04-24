import express from "express";
import HTTPError from "../helpers/HTTPError";
import configs from "../helpers/configs";

export default function authMiddleware(req: express.Request<any>, res: express.Response<any>, next: express.NextFunction) {
  if(typeof configs.adminPassword !== "string") throw new HTTPError(400, "Admin password has not been set in configs.json");
  if(req.body?.password === configs.adminPassword) return next();
  
  const authorization = req.headers["authorization"];
  
  if(!authorization || !authorization.startsWith("Basic ")) {
    throw new HTTPError(401, "Not Authorized", {
      "WWW-Authenticate": 'Basic realm="hybooru"', // eslint-disable-line @typescript-eslint/naming-convention
    });
  }
  
  const base64Credentials = authorization.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [username, password] = credentials.split(":");
  
  if(password === configs.adminPassword) return next();
  else throw new HTTPError(401, "Invalid password");
}
