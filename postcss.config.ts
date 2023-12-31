import autoprefixer from "autoprefixer";
import cssnano from "cssnano";
import postcssImport from "postcss-import";
import tailwindcss from "tailwindcss";

export default {
  plugins: [
    postcssImport,
    autoprefixer,
    tailwindcss,
    cssnano({
      preset: "default",
    }),
  ],
};
