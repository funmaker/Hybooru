import React from "react";
import chalk from "chalk";
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from "react-router";
import express from "express";
import { Theme } from "../../client/hooks/useTheme";
import App from "../../client/App";
import index from '../views/index.handlebars';
import HTTPError from "../helpers/HTTPError";
import configs from "../helpers/configs";
import { AnySSRPageData } from "../routes/apiTypes";

const removeTags = /[&<>]/g;
const tagsToReplace: Record<string, string> = {
  '<': `\u003C`,
};

export interface OGImage {
  url: string;
  type: string;
  width: number;
  height: number;
  alt: string;
}

export interface OGVideo {
  url: string;
  type: string;
  width: number;
  height: number;
  duration: number;
}

export interface OGAudio {
  url: string;
  type: string;
}

export interface Options {
  title?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogImage?: OGImage;
  ogAudio?: OGAudio;
  ogVideo?: OGVideo;
  ogUrl?: string;
  ogSiteName?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Response {
      react: <Data>(initialData: Data, options?: Options) => Response;
    }
  }
}

export default function reactMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  res.react = (initialData, options) => {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    
    const theme = req.cookies.theme || Theme.AUTO;
    const title = options?.title ? `${options?.title} | ${req.config.appName}` : req.config.appName;
    
    // noinspection JSUnreachableSwitchBranches
    switch(req.accepts(['html', 'json'])) {
      case "html": {
        const initialDataEx: AnySSRPageData = {
          ...initialData,
          _config: req.config,
          _csrf: req.csrfToken(),
          _theme: theme,
          _ssrError: false,
        };
        
        let reactContent: string;
        try {
          reactContent = ReactDOMServer.renderToString(
            <StaticRouter location={req.originalUrl} context={{}}>
              <App initialData={initialDataEx} />
            </StaticRouter>,
          );
        } catch(e) {
          console.error(chalk.red.bold("Error during SSR!"));
          console.error(e);
          reactContent = "There was an error during Server Side Rendering.";
          initialDataEx._ssrError = true;
        }
        
        const initialDataJSON = JSON.stringify(initialDataEx).replace(removeTags, tag => tagsToReplace[tag] || tag);
        
        res.send(index({
          reactContent,
          initialData: initialDataJSON,
          production: process.env.NODE_ENV === 'production',
          theme,
          title,
          appName: configs.appName,
          description: configs.appDescription,
          ogTitle: options?.ogTitle || configs.appName,
          ogDescription: options?.ogDescription || configs.appDescription,
          ogType: options?.ogTitle || "website",
          ogImage: options?.ogImage,
          ogAudio: options?.ogAudio,
          ogVideo: options?.ogVideo,
          ogUrl: options?.ogUrl || `${req.protocol}://${req.get('host')}${req.originalUrl}`,
          ogSiteName: options?.ogSiteName || configs.appName,
        }));
        break;
      }
      
      case "json":
        res.json({
          ...initialData,
          _title: title,
        });
        break;
      
      default:
        throw new HTTPError(406);
    }
    
    return res;
  };
  next();
}
