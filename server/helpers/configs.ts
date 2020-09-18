import * as fs from 'fs';

let configs: typeof import("../../configs.json");
try {
  configs = JSON.parse(fs.readFileSync("./configs.json").toString("utf-8"));
} catch(e) {
  configs = {
    port: 3939,
  };
}

export default configs;
