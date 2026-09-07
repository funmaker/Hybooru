import express from "express";
import * as api from "./api";
import * as files from "./files";
import * as pages from "./pages";

export const router = express.Router();

router.use("/api", api.router);
router.use("/files", files.router);
router.use("/", pages.router);

