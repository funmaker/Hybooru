/* eslint-disable @typescript-eslint/naming-convention */
import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const root = process.cwd();
const siteFolder = path.resolve(root, "./client/semantic");

const BABEL_OPTIONS = {
  presets: [
    ["@babel/preset-env", {
      targets: {
        browsers: "last 2 versions",
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
  target: 'web',
  context: root,
  entry: [
    '@babel/polyfill',
    './client.tsx',
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.scss'],
    modules: [root, 'node_modules'],
    alias: {
      "../../theme.config$": path.resolve(siteFolder, "./theme.config.less"),
    },
  },
  output: {
    path: path.join(root, 'dist'),
    filename: 'client.js',
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "style.css",
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
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          "sass-loader",
        ],
      }, {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
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
          MiniCssExtractPlugin.loader,
          "css-loader",
        ],
      },
    ],
  },
};
