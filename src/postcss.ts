import postcss from "postcss/lib/postcss";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import postcssImport from "postcss-import";
import cssnano from "cssnano";
import fs from "fs";
import * as path from "path";
import {tailwindConfig} from "./constants.js";

const folder = path.resolve(".workspace/styles");

export async function runPostcss(): Promise<void> {
  const css = fs.readFileSync("styles/tailwind.css", "utf8");
  const tailwindInputPath = "./styles/tailwind.css";
  const postCssOutputPath = "./.workspace/styles/styles.css";

  await postcss([
    autoprefixer,
    postcssImport(),
    tailwindcss(tailwindConfig),
    cssnano({
      preset: "default",
    }),
  ])
    .process(css, {from: tailwindInputPath, to: postCssOutputPath})
    .then((result) => {
      fs.mkdir(folder, {recursive: true}, (error) => {
        if (error != null) {
          throw error;
        } else {
          fs.writeFileSync(".workspace/styles/styles.css", result.css);
        }
      });
    });
}
