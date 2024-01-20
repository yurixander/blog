import fs from "fs";
import path from "path";
import {minify} from "terser";

function MinifyJsCode(): void {
  const distFolder = "dist/";

  fs.readdirSync(distFolder).forEach((file) => {
    if (path.extname(file) === ".js") {
      const filePath = path.join(distFolder, file);
      const code = fs.readFileSync(filePath, "utf8");

      void minify(code).then((minified) => {
        if (minified.code !== null && minified.code !== undefined) {
          fs.writeFileSync(filePath, minified.code);
        }
      });
    }
  });
}

MinifyJsCode();
