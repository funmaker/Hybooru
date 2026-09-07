/* eslint-disable @typescript-eslint/naming-convention */
import path from 'path';
import nodeExternals from 'webpack-node-externals';
import type webpack from "webpack";

const root = process.cwd();

export const pureESM = [
  "wouter",
  "chalk",
];

export const reactPresetOptions = {
  runtime: "automatic",
  development: false,
};

export const reactCompilerOptions = {
  panicThreshold: 'none',
};

export const babelOptions = {
  presets: [
    "@babel/preset-typescript",
    ["@babel/preset-react", reactPresetOptions],
    ["@babel/preset-env", {
      targets: {
        node: "current",
      },
    }],
  ] as Array<string | [string, ...any[]]>,
  plugins: [
    ['babel-plugin-react-compiler', reactCompilerOptions],
  ] as Array<string | [string, ...any[]]>,
};

// noinspection JSUnusedGlobalSymbols
export default {
  target: 'async-node',
  context: root,
  externals: [nodeExternals({
    allowlist: pureESM,
  })],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    modules: [root, 'node_modules'],
  },
  output: {
    path: path.join(root, 'dist'),
    filename: 'server.js',
    chunkFilename: '[contenthash].server.js',
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
  },
  node: {
    __filename: true,
    __dirname: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$|\.tsx$|\.js$|\.jsx$/,
        exclude: /(node_modules)/,
        use: [
          {
            loader: 'babel-loader',
            options: babelOptions,
          },
        ],
      }, {
        test: /\.handlebars$/,
        loader: 'handlebars-loader',
      }, {
        test: /\.css$|\.scss$|\.less$/,
        use: 'ignore-loader',
      }, {
        test: /\.sql$/i,
        use: 'raw-loader',
      },
    ],
  },
} satisfies webpack.Configuration as webpack.Configuration;
