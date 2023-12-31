import postcssImport from "postcss-import"
import autoprefixer from "autoprefixer"
import tailwindcss from "tailwindcss"
import cssnano from "cssnano"

export default {
  plugins: [
    postcssImport,
    autoprefixer,
    tailwindcss,
    cssnano({
      preset: "default",
    }),
  ],
}
