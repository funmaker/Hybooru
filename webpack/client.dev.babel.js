/* eslint-disable @typescript-eslint/naming-convention */
import path from "path";
import webpack from 'webpack';

const root = process.cwd();
const siteFolder = path.resolve(root, "./client/semantic");

const BABEL_OPTIONS = {
  presets: [
    ["@babel/preset-env", {
      targets: {
        browsers: "last 2 versions",
      },
    }],
    ["@babel/preset-react", {
      development: true,
    }],
  ],
  plugins: [
    'react-hot-loader/babel',
    "@babel/plugin-proposal-object-rest-spread",
    "@babel/plugin-proposal-class-properties",
  ],
};

// noinspection JSUnusedGlobalSymbols
export default {
  mode: 'development',
  target: 'web',
  context: root,
  devtool: 'source-map',
  entry: [
    '@babel/polyfill',
    'webpack-hot-middleware/client',
    './client.tsx',
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss'],
    modules: [root, 'node_modules'],
    alias: {
      "react-dom": '@hot-loader/react-dom',
      "../../theme.config$": path.resolve(siteFolder, "./theme.config.less"),
    },
  },
  output: {
    publicPath: '/',
    filename: 'client.js',
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
  },
  optimization: {
    noEmitOnErrors: true,
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
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
        test: /\.scss$/,
        use: [
          "style-loader",
          "css-loader",
          "sass-loader",
        ],
      }, {
        test: /\.less$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              url: false,
            },
          },
          {
            loader: "less-loader",
            options: {
              lessOptions: {
                globalVars: {
                  siteFolder,
                },
              },
            },
          },
        ],
      }, {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
};
