import * as fs from 'fs';

let configs;
try {
	configs = JSON.parse(fs.readFileSync("./configs.json").toString("utf-8"));
} catch(e) {
	configs = {};
}

export default configs;
