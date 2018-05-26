import * as fs from 'fs';

const tryRead = filename => {
	try {
		return JSON.parse(fs.readFileSync(filename).toString());
	} catch(e) {
		return null;
	}
};

const pack = {
	...tryRead("package.json"),
	scripts: {
		start: "node server.js",
	},
};
delete pack.devDependencies;

fs.writeFileSync("dist/package.json", JSON.stringify(pack, null, 4));


let configs;

configs = {
	pocer: {
		port: 3000,
	},
	...tryRead("configs.json"),
	...tryRead("dist/configs.json"),
};

fs.writeFileSync("dist/configs.json", JSON.stringify(configs, null, 4));
