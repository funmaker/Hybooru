/* eslint-disable @typescript-eslint/naming-convention */
import path from 'path';
import webpack from 'webpack';
import nodeExternals from 'webpack-node-externals';
import StartServerPlugin from 'start-server-webpack-plugin';

const root = process.cwd();
const isWin = process.platform === "win32";

const BABEL_OPTIONS = {
  presets: [
    ["@babel/preset-env", {
      targets: {
        node: "current",
      },
    }],
    ["@babel/preset-react", {
      development: true,
    }],
  ],
  plugins: [
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-proposal-class-properties",
  ],
};

// noinspection JSUnusedGlobalSymbols
export default {
  mode: 'development',
  target: 'async-node',
  context: root,
  watch: true,
  devtool: 'source-map',
  externals: [nodeExternals({
    allowlist: [isWin ? 'webpack/hot/poll?1000' : 'webpack/hot/signal'],
  })],
  entry: [
		isWin ? 'webpack/hot/poll?1000' : 'webpack/hot/signal',
		'./server.ts',
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    modules: [root, 'node_modules'],
    alias: {
      "react-dom": '@hot-loader/react-dom',
    },
  },
  output: {
    path: path.join(root, 'build'),
    filename: 'server.js',
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
  },
  node: {
    __filename: true,
    __dirname: true,
  },
  optimization: {
    noEmitOnErrors: true,
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new StartServerPlugin({
      name: 'server.js',
      signal: !isWin,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts$|\.tsx$/,
        exclude: /(node_modules)/,
        use: [
          {
            loader: 'babel-loader',
            options: BABEL_OPTIONS,
          }, {
            loader: 'ts-loader',
          },
        ],
      }, {
        test: /\.js$|\.jsx$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        options: BABEL_OPTIONS,
      }, {
        test: /\.handlebars$/,
        loader: 'handlebars-loader',
      }, {
        test: /\.css$|\.scss$|\.less$/,
        use: 'ignore-loader',
      },
    ],
  },
};
