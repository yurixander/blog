/** @type {import('tailwindcss').Config} */
export default {
  content: ["./templates/*.html", "./.workspace/*.html"],
  theme: {
    extend: {
      backgroundImage: {
        checkIcon: `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e")`,
      },
      backgroundColor: {
        bgColorDefault: "#191919",
      },
    },
    fontFamily: {
      sans: ["sans-serif"],
    },
    colors: {
      default: "#D4D4D4",
      gray: "#959595",
      brown: "#B9846E",
      orange: "#C37B47",
      yellow: "#C09146",
      green: "#50996F",
      blue: "#5E87C9",
      purple: "#9D68D3",
      pink: "#D15796",
      red: "#DF5452",
      grayBg: "#777777",
      brownBg: "#936b5a",
      orangeBg: "#b27142",
      yellowBg: "#8b7f32",
      greenBg: "#458460",
      blueBg: "#597cb6",
      purpleBg: "#77509e",
      pinkBg: "#b64c83",
      redBg: "#b74745",
    },
  },
  plugins: [],
};
