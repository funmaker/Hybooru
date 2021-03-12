import PromiseRouter from "express-promise-router";
import * as statsController from "../controllers/stats";
import * as api from "./api";
import { IndexPageData } from "./apiTypes";

export const router = PromiseRouter();

router.use("/api", api.router);

router.get<any, IndexPageData>('/', async (req, res) => {
  const stats = await statsController.getStats();
  
  res.react<IndexPageData>({ stats });
});
