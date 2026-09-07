import * as http from 'http';
import * as expressCore from 'express-serve-static-core';
import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import morgan from 'morgan';
import { ErrorResponse, InitialData } from "../types/api";
import { qsStringify } from "../client/helpers/utils";
import reactMiddleware from "./middlewares/reactMiddleware";
import HTTPError from "./helpers/HTTPError";
import configs from "./helpers/configs";
import { router } from "./routes";
import "./helpers/db";

const app = express();

app.set("trust proxy", configs.proxy);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(compression());
app.use('/static', express.static('static'));
app.use('/robots.txt', express.static('static/robots.txt'));
if(process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
  app.use(require('./helpers/webpackHelper').mount());
} else {
  app.use('/client.js', express.static('client.js'));
  app.use('/client.js.LICENSE.txt', express.static('client.js.LICENSE.txt'));
  app.use('/style.css', express.static('style.css'));
}

app.use(reactMiddleware);

app.use('/', router);

app.use((req, res, next) => {
  next(new HTTPError(404));
});

app.use((err: Partial<HTTPError>, req: expressCore.RequestEx<any, any, any>, res: expressCore.ResponseEx<Pick<InitialData, "_error">>, _next: expressCore.NextFunction) => {
  if((err as any).code === 'ECONNABORTED') return;
  if((err as any).code === 'EBADCSRFTOKEN') err = new HTTPError(403, "Bad CSRF Token");
  if(err.HTTPcode !== 404) console.error(err);
  if(res.headersSent) return;
  
  const code = err.HTTPcode || 500;
  const headers = err.headers || {};
  const error: ErrorResponse = {
    code,
    message: err.publicMessage || http.STATUS_CODES[code] || "Something Happened",
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  };
  const htmlRedirect = headers["X-Hybooru-DbLock"] === "true" ? `/lock${qsStringify({ redirect: req.originalUrl })}` : undefined;
  
  res.status(code).header(headers).react({ _error: error }, { htmlRedirect });
});

export default app;
