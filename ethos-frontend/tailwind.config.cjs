/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
      extend: {
        fontFamily: {
          inter: ['Inter', 'sans-serif'],
          roboto: ['Roboto', 'sans-serif'],
        },
        colors: {
          primary: "#111827",
          accent: "#4F46E5",
          soft: "#F3F4F6",
          "soft-dark": "#1f2937",
        },
        borderRadius: {
          xl: "1rem",
          "2xl": "1.5rem",
        },
      },
    },
    plugins: [],
  }
