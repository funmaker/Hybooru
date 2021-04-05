import path from "path";
import PromiseRouter from "express-promise-router";
import * as db from "../helpers/db";
import HTTPError from "../helpers/HTTPError";

export const router = PromiseRouter();


router.get<{ filename: string }>("/:filename", async (req, res, next) => {
  const root = path.resolve(db.findHydrusDB(), "client_files");
  
  let filename = req.params.filename;
  filename = `./${filename.substr(0, 3)}/${filename.substr(1)}`;
  
  res.sendFile(filename, { root }, err => err && next(err));
});
