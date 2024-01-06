import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import postcss from "postcss/lib/postcss";

const tailwindConfig = {
  content: ["./templates/*.html"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export async function runPostcss(styles: string) {
  const tailwindPlugin = tailwindcss(tailwindConfig) as postcss.Plugin;

  return postcss([autoprefixer, tailwindPlugin]).process(styles, {
    from: "../styles/tailwind.css",
    to: "../styles/styles.css",
  }).css;
}
