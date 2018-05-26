const fs = require('fs');

const pack = JSON.parse(fs.readFileSync("package.json").toString());

delete pack.devDependencies;

pack.scripts = {
	"start": "node server.bundle.js",
};

fs.writeFileSync("dist/package.json", JSON.stringify(pack, null, 4));
