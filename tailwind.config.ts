import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1d2433",
        paper: "#fbfaf7",
        line: "#e4e0d8",
        mint: "#1f8a70",
        coral: "#d9634f"
      },
      boxShadow: {
        soft: "0 12px 32px rgba(29, 36, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
