export const tailwindConfig = {
  content: [
    "./templates/*.html",
    "./.workspace/*.html",
    "./.workspace/posts/*.html",
  ],
  theme: {
    extend: {
      backgroundImage: {
        checkIcon: `url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2-2a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e")`,
      },
      backgroundColor: {
        defaultBgDark: "#191919",
        defaultBg: "#FFFFFF",
        grayDark: "#777777",
        gray: "#77777753",
        brownDark: "#936b5a",
        brown: "#ce9a8385",
        orangeDark: "#b27142",
        orange: "#dfa17453",
        yellowDark: "#8b7f32",
        yellow: "#cdc17452",
        greenDark: "#458460",
        green: "#78d09e54",
        blueDark: "#597cb6",
        blue: "#7ea3de51",
        purpleDark: "#77509e",
        purple: "#b887ea51",
        pinkDark: "#b64c83",
        pink: "#ef77b559",
        redDark: "#b74745",
        red: "#c46c6a4f",
        calloutBgColor: "#e4e4e4a5",
        calloutBgColorDark: "#393939",
      },
    },
    colors: {
      white: "#D5D5D5",
      dark: "#191919",
      defaultDark: "#D5D5D5",
      gray: "#959595",
      brown: "#B9846E",
      orange: "#C37B47",
      yellow: "#C09146",
      green: "#50996F",
      blue: "#5E87C9",
      purple: "#9D68D3",
      pink: "#D15796",
      red: "#DF5452",
      blueCheckbox: "#1865e0",
    },
    fontFamily: {
      raleway: ["Raleway", "sans-serif"],
      merrinweather: ["Merriweather", "serif"],
    },
  },
  plugins: [],
};

export const colors = [
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
];

export const backgroundColors = [
  "gray_background",
  "brown_background",
  "orange_background",
  "yellow_background",
  "green_background",
  "blue_background",
  "purple_background",
  "pink_background",
  "red_background",
];

export const YT_REG_EXP =
  /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/)?([a-zA-Z0-9\-_]{11})/;
