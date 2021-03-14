import PromiseRouter from "express-promise-router";
import * as api from "./api";
import * as files from "./files";
import * as pages from "./pages";

export const router = PromiseRouter();

router.use("/api", api.router);
router.use("/files", files.router);
router.use("/", pages.router);

