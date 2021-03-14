import PromiseRouter from "express-promise-router";
import path from "path";
import * as db from "../helpers/db";

export const router = PromiseRouter();


router.get<{ filename: string }>("/:filename", async (req, res) => {
  const root = path.resolve(db.findHydrusDB(), "client_files");
  
  let filename = req.params.filename;
  filename = `./${filename.substr(0, 3)}/${filename.substr(1)}`;
  
  res.sendFile(filename, { root });
});
