import path from "path";
import PromiseRouter from "express-promise-router";
import * as db from "../helpers/db";
import configs from "../helpers/configs";
import HTTPError from "../helpers/HTTPError";

export const router = PromiseRouter();

router.get<{ filename: string }>("/:filename", async (req, res, next) => {
  let root = path.resolve(db.findHydrusDB(), "client_files");
  if(req.params.filename.startsWith("t") && configs.thumbnailsPathOverride) root = configs.thumbnailsPathOverride;
  else if(configs.filesPathOverride) root = configs.filesPathOverride;
  
  let filename = req.params.filename;
  filename = `./${filename.substr(0, 3)}/${filename.substr(1)}`;
  
  res.sendFile(filename, { root }, err => {
    if(err && (err as any).code === 'ENOENT') next(new HTTPError(404));
    else if(err) next(err);
  });
});
