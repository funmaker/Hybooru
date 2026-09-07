import { merge } from "webpack-merge";
import commons from "./server.commons";

// noinspection JSUnusedGlobalSymbols
export default merge(commons, {
  mode: 'production',
  devtool: 'source-map',
  entry: './server.ts',
});
