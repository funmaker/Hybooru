import webpack from "webpack";
import webpackHotMiddleware from "webpack-hot-middleware";
import webpackDevMiddleware from "webpack-dev-middleware";
import express from "express";
import chalk from 'chalk';
import webpackClientDevConfig from "../../webpack/client.dev.babel";

let cachedRouter: express.Router | null = null; // Cache for Server Side Hot Module Replacement

export const mount = () => {
  if(cachedRouter) return cachedRouter;
  
  const router = cachedRouter = express.Router();
  
  console.log(`\nWebpack Hot Middleware has been ${chalk.bold.yellow("enabled")}!`);
  const compiler = webpack(webpackClientDevConfig);
  
  router.use(webpackDevMiddleware(compiler as any, {
    publicPath: webpackClientDevConfig.output?.publicPath as string,
  }));
  
  router.use(webpackHotMiddleware(compiler as any, {
    log: console.log,
    path: '/__webpack_hmr',
    heartbeat: 10 * 1000,
  }));
  
  return router;
};

