/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Soft sage green — Foodly's primary color
        primary: {
          50: "#f2f7f2",
          100: "#e0ece0",
          200: "#c2d9c3",
          300: "#9cc09e",
          400: "#72a476",
          500: "#4f8a55",
          600: "#3d7042",
          700: "#325936",
          800: "#2a472d",
          900: "#233b27",
        },
        // Warm cream background
        cream: {
          50: "#fffdf9",
          100: "#fdf8ef",
          200: "#f8efdd",
        },
        // Friendly accent orange for CTAs / highlights
        accent: {
          400: "#ff9f5b",
          500: "#ff8a3d",
          600: "#f2721f",
        },
      },
      fontFamily: {
        sans: ["'Nunito'", "'Segoe UI'", "system-ui", "sans-serif"],
        display: ["'Quicksand'", "'Nunito'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 4px 14px rgba(43, 71, 45, 0.08)",
        "card-hover": "0 10px 24px rgba(43, 71, 45, 0.14)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
};


