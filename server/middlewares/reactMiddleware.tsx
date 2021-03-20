import React from "react";
import ReactDOMServer from 'react-dom/server';
import { StaticRouter } from "react-router";
import express from "express";
import index from '../views/index.handlebars';
import App from "../../client/App";
import HTTPError from "../helpers/HTTPError";
import configs from "../helpers/configs";

const removeTags = /[&<>]/g;
const tagsToReplace: Record<string, string> = {
  '&': "&amp;",
  '<': "&lt;",
  '>': "&gt;",
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
    
    const title = options?.title ? `${options?.title} | ${req.config.appName}` : req.config.appName;
    
    // noinspection JSUnreachableSwitchBranches
    switch(req.accepts(['html', 'json'])) {
      case "html": {
        const initialDataEx = {
          ...initialData,
          _config: req.config,
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
          title,
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
          _title: title,
          ...initialData,
        });
        break;
      
      default:
        throw new HTTPError(406);
    }
    
    return res;
  };
  next();
}
