import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#667085",
        soft: "#f4f6f8",
        line: "#e6eaf0"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
