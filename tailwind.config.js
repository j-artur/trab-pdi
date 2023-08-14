const defaultTheme = require("tailwindcss/defaultTheme");

const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter var", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [
    require("@tailwindcss/container-queries"),
    plugin(function ({ addComponents }) {
      addComponents({
        "@keyframes open-vertical": {
          from: { height: "0" },
          to: { height: "var(--kb-collapsible-content-height)" },
        },
        "@keyframes close-vertical": {
          from: { height: "var(--kb-collapsible-content-height)" },
          to: { height: "0" },
        },

        ".open-vertical": {
          animation: "open-vertical 300ms ease-out",
        },
        ".close-vertical": {
          animation: "close-vertical 300ms ease-in",
        },

        "@keyframes rotate-180": {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(180deg)" },
        },
        "@keyframes rotate-0": {
          from: { transform: "rotate(180deg)" },
          to: { transform: "rotate(0deg)" },
        },
        ".rotate-180": {
          animation: "rotate-180 300ms ease-out",
        },
        ".rotate-0": {
          animation: "rotate-0 300ms ease-in",
        },
      });
    }),
  ],
};
