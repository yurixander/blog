import autoprefixer from "autoprefixer";
import postcss from "postcss";
import tailwindcss from "tailwindcss";
import {todo} from "./util.js";

export async function runPostcss(styles: string) {
  // TODO: Use actual paths.
  todo();

  return postcss([tailwindcss, autoprefixer]).process(styles, {
    from: "path/to/input.css",
    to: "path/to/output.css",
  });
}
