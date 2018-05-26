import webpackClientDevConfig from "../../webpack/client.dev.babel";
import webpack from "webpack";
import webpackHotMiddleware from "webpack-hot-middleware";
import webpackDevMiddleware from "webpack-dev-middleware";
import express from "express";
import colors from 'colors/safe';

let cachedRouter = null; // Cache for Server Side Hot Module Replacement

export const mount = () => {
	if(cachedRouter) return cachedRouter;
	
	const router = cachedRouter = express.Router();
	
	console.log(`\nWebpack Hot Middleware has been ${colors.bold.yellow("enabled")}!`);
	const compiler = webpack(webpackClientDevConfig);
	
	router.use(webpackDevMiddleware(compiler, {
		logLevel: 'warn',
		publicPath: webpackClientDevConfig.output.publicPath
	}));
	
	router.use(webpackHotMiddleware(compiler, {
		log: console.log,
		path: '/__webpack_hmr',
		heartbeat: 10 * 1000
	}));
	
	return router;
};

