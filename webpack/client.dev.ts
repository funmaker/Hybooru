import path from "path";
import webpack from 'webpack';
import ReactRefreshWebpackPlugin from "@pmmmwh/react-refresh-webpack-plugin";
import { merge } from "webpack-merge";
import commons, { babelOptions, reactCompilerOptions, reactPresetOptions } from "./client.commons";

reactCompilerOptions.panicThreshold = "all_errors";
reactPresetOptions.development = true;
babelOptions.plugins.splice(1, 0, require.resolve('react-refresh/babel'));

const root = process.cwd();

export default merge(commons, {
  mode: 'development',
  devtool: 'inline-source-map',
  output: {
    path: path.join(root, 'build'),
  },
  entry: [
    'webpack-hot-middleware/client',
    './client.tsx',
  ],
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin({
      overlay: { sockIntegration: "whm" },
    }),
  ],
});
