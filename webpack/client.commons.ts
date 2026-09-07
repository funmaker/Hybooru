import path from 'path';
import type webpack from "webpack";

const root = process.cwd();

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
        browsers: "last 2 versions",
      },
    }],
  ] as Array<string | [string, ...any[]]>,
  plugins: [
    ['babel-plugin-react-compiler', reactCompilerOptions],
  ] as Array<string | [string, ...any[]]>,
};

// noinspection JSUnusedGlobalSymbols
export default {
  target: 'web',
  context: root,
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.css'],
    modules: [root, 'node_modules'],
  },
  output: {
    path: path.join(root, 'dist'),
    filename: 'client.js',
    chunkFilename: '[contenthash].server.js',
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
        test: /\.scss$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: { url: false },
          },
          "sass-loader",
        ],
      }, {
        test: /\.css$/,
        use: [
          "style-loader",
          {
            loader: "css-loader",
            options: {
              url: false,
            },
          },
        ],
      },
    ],
  },
} satisfies webpack.Configuration as webpack.Configuration;
