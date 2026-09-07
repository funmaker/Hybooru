import path from "path";
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
import ForkTsCheckerWebpackPlugin from "fork-ts-checker-webpack-plugin";
import { merge } from "webpack-merge";
import { RunScriptWebpackPlugin } from 'run-script-webpack-plugin'; // https://github.com/ericclemmons/start-server-webpack-plugin/issues/40
import commons, { pureESM, reactCompilerOptions, reactPresetOptions } from "./server.commons";

reactCompilerOptions.panicThreshold = "all_errors";
reactPresetOptions.development = true;

const isWin = process.platform === "win32";
const root = process.cwd();

export default merge(commons, {
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
    ...commons.output,
    path: path.join(root, 'build'),
  },
  entry: [
    isWin ? './node_modules/webpack/hot/poll?1000' : './node_modules/webpack/hot/signal.js',
    './server.ts',
  ],
  watch: true,
  externals: [nodeExternals({
    allowlist: [
      isWin ? 'webpack/hot/poll?1000' : 'webpack/hot/signal',
      ...pureESM,
    ],
  })],
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new ForkTsCheckerWebpackPlugin(),
    new RunScriptWebpackPlugin({
      name: commons.output?.filename as (string | undefined) || "server.js",
      signal: !isWin,
      autoRestart: false,
    }),
  ],
});
