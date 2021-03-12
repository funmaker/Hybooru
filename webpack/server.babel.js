/* eslint-disable @typescript-eslint/naming-convention */
import path from 'path';
import nodeExternals from 'webpack-node-externals';

const root = process.cwd();

const BABEL_OPTIONS = {
  presets: [
    ["@babel/preset-env", {
      targets: {
        node: "current",
      },
    }],
    "@babel/preset-react",
  ],
  plugins: [
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-proposal-class-properties",
  ],
};

// noinspection JSUnusedGlobalSymbols
export default {
  mode: 'production',
  target: 'async-node',
  context: root,
  devtool: 'source-map',
  externals: [nodeExternals()],
  entry: './server.ts',
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.sql'],
    modules: [root, 'node_modules'],
  },
  output: {
    path: path.join(root, 'dist'),
    filename: 'server.js',
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
  },
  node: {
    __filename: true,
    __dirname: true,
  },
  plugins: [],
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
        test: /\.sql$/,
        loader: 'raw-loader',
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
