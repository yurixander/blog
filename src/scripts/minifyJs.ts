import fs from "fs";
import path from "path";
import {minify} from "terser";

const distFolder = "dist/";

fs.readdirSync(distFolder).forEach((file) => {
  if (path.extname(file) !== ".js") {
    return;
  }

  const filePath = path.join(distFolder, file);
  const code = fs.readFileSync(filePath, "utf8");

  void minify(code).then((minified) => {
    if (minified.code !== null && minified.code !== undefined) {
      fs.writeFileSync(filePath, minified.code);
    }
  });
});
