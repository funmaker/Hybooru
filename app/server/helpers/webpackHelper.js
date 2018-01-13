import webpack from "webpack";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpackHotMiddleware from "webpack-hot-middleware";
import webpackConfig from "../../webpack.dev.config.js";

const webpackCompiler = webpack(webpackConfig);

export function useWebpackMiddleware(app) {
    app.use(webpackDevMiddleware(webpackCompiler, {
        publicPath: webpackConfig.output.publicPath,
        stats: {
            colors: true,
            chunks: false,
            'errors-only': true
        },
				hot: true,
				headers: { 'Access-Control-Allow-Origin': '*' }
    }));
    app.use(webpackHotMiddleware(webpackCompiler, {
        log: console.log
    }));
 
    return app
}