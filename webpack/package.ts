import * as fs from 'fs';

function tryRead(filename: string) {
  try {
    return JSON.parse(fs.readFileSync(filename).toString());
  } catch(err) {
    void err;
    return null;
  }
}

const pack = {
  ...tryRead("package.json"),
  scripts: {
    start: "node server.js",
  },
};
delete pack.devDependencies;

fs.writeFileSync("dist/package.json", JSON.stringify(pack, null, 4));


const configs = {
  port: 3939,
  ...tryRead("configs.json"),
  ...tryRead("dist/configs.json"),
};

fs.writeFileSync("dist/configs.json", JSON.stringify(configs, null, 4));
fs.copyFileSync("package-lock.json", "dist/package-lock.json");
