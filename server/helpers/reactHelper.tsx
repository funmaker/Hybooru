import React from "react";
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from "react-router";
import express from "express";
import index from '../views/index.handlebars';
import App from "../../client/App";
import * as globalController from "../controllers/global";
import HTTPError from "./HTTPError";

const removeTags = /[&<>]/g;
const tagsToReplace: Record<string, string> = {
  '&': "&amp;",
  '<': "&lt;",
  '>': "&gt;",
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Response {
      react: <Data>(initialData: Data) => Response;
    }
  }
}

export function reactMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  res.react = initialData => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    
    // noinspection JSUnreachableSwitchBranches
    switch(req.accepts(['html', 'json'])) {
      case "html": {
        (async () => {
          const initialDataEx = {
            ...initialData,
            _config: await globalController.getConfig(),
          };
          
          const initialDataJSON = JSON.stringify(initialDataEx).replace(removeTags, tag => tagsToReplace[tag] || tag);
          
          res.send(index({
            reactContent: ReactDOMServer.renderToString(
              <StaticRouter location={req.originalUrl} context={{}}>
                <App initialData={initialDataEx} />
              </StaticRouter>,
            ),
            initialData: initialDataJSON,
            production: process.env.NODE_ENV === 'production',
            appName: initialDataEx._config.appName,
          }));
        })().catch(next);
        break;
      }
      
      case "json":
        res.json(initialData);
        break;
      
      default:
        throw new HTTPError(406);
    }
    
    return res;
  };
  next();
}
