import React from "react";
import chalk from "chalk";
import * as expressCore from "express-serve-static-core";
import ReactDOMServer from 'react-dom/server';
import { Router } from "wouter";
import { Theme } from "../../client/hooks/useTheme";
import App from "../../client/App";
import index from '../views/index.handlebars';
import HTTPError from "../helpers/HTTPError";
import configs from "../helpers/configs";
import { InitialData } from "../../types/api";
import * as globalController from "../controllers/global";

const removeTags = /[<>]/g;
const tagsToReplace: Record<string, string> = {
  '<': `\\u003C`,
  '>': `\\u003E`,
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

export interface SSROptions {
  title?: string;
  htmlRedirect?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogType?: string;
  ogImage?: OGImage;
  ogAudio?: OGAudio;
  ogVideo?: OGVideo;
  ogUrl?: string;
  ogSiteName?: string;
  noIndex?: boolean;
  soft404?: boolean;
}

declare module "express-serve-static-core" {
  export interface ResponseEx<ResBody> extends expressCore.Response<ResBody, any, any> {
    react: (initialData: ResBody, options?: SSROptions) => Response;
  }
}

export default function reactMiddleware(req: expressCore.RequestEx<any, any, any>, res: expressCore.ResponseEx<any>, next: expressCore.NextFunction) {
  res.react = (initialData, options) => {
    if(res.headersSent) return res;
    
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    
    (async () => {
      const theme = req.cookies.theme || Theme.AUTO;
      const config = await globalController.getConfig();
      const title = options?.title ? `${options?.title} | ${config.appName}` : config.appName;
      
      if(options?.noIndex) {
        res.header('X-Robots-Tag', 'noindex');
      }
      
      // noinspection JSUnreachableSwitchBranches
      switch(req.accepts(['html', 'json'])) {
        case "html": {
          if(options?.htmlRedirect) {
            res.redirect(options.htmlRedirect);
            break;
          }
          
          if(configs.honeypot?.enabled && req.ip) {
            config.honeyPot = { ip: req.ip };
          }
          
          const initialDataEx: InitialData = {
            ...initialData,
            _config: config,
            _theme: theme,
            _ssrError: false,
          };
          
          let reactContent: string;
          try {
            reactContent = ReactDOMServer.renderToString(
              <Router ssrPath={req.originalUrl}>
                <App initialData={initialDataEx} />
              </Router>,
            );
          } catch(e) {
            console.error(chalk.red.bold("Error during SSR!"));
            console.error(e);
            reactContent = "There was an error during Server Side Rendering.";
            initialDataEx._ssrError = true;
          }
          
          const initialDataJSON = JSON.stringify(initialDataEx).replace(removeTags, tag => tagsToReplace[tag] || tag);
          
          if(options?.soft404) res.status(404);
          
          res.send(index({
            reactContent,
            initialData: initialDataJSON,
            production: process.env.NODE_ENV === 'production',
            theme,
            title,
            appName: configs.appName,
            description: configs.appDescription,
            canonicalUrl: options?.canonicalUrl || `${req.protocol}://${req.get('host')}${req.originalUrl}`,
            ogTitle: options?.ogTitle || configs.appName,
            ogDescription: options?.ogDescription || configs.appDescription,
            ogType: options?.ogTitle || "website",
            ogImage: options?.ogImage,
            ogAudio: options?.ogAudio,
            ogVideo: options?.ogVideo,
            ogUrl: options?.ogUrl,
            ogSiteName: options?.ogSiteName || configs.appName,
            noIndex: options?.noIndex,
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
    })().catch(next);
    
    return res;
  };
  next();
}
