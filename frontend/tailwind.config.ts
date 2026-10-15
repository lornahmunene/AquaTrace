import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Water blues
        aqua: {
          50: "#effaff",
          100: "#def3ff",
          200: "#b6e8ff",
          300: "#75d7ff",
          400: "#2cc3ff",
          500: "#00a9f4",
          600: "#0086d1",
          700: "#006aa9",
          800: "#035a8b",
          900: "#084b73",
        },
        // Leaf / crop greens
        leaf: {
          50: "#f1f8f3",
          100: "#dcefe2",
          200: "#b9dfc6",
          300: "#8ac8a2",
          400: "#55ab78",
          500: "#2f9159",
          600: "#1f7545",
          700: "#1a5d39",
          800: "#174a30",
          900: "#133d29",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(8, 75, 115, 0.04), 0 4px 16px rgba(8, 75, 115, 0.06)",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
