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

export async function runPostcss(styles: string): Promise<string> {
  const tailwindPlugin = tailwindcss(tailwindConfig) as postcss.Plugin;

  const tailwindInputPath = "./styles/tailwind.css";
  const postCssOutputPath = "./.workspace/styles/styles.css";

  const process = await postcss([autoprefixer, tailwindPlugin]).process(
    styles,
    {
      from: tailwindInputPath,
      to: postCssOutputPath,
    }
  );
  return process.css;
}
