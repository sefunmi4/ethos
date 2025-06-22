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
          primary: 'var(--color-primary)',
          secondary: 'var(--color-secondary)',
          accent: 'var(--color-accent)',
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error: 'var(--color-error)',
          soft: 'var(--color-soft)',
          'soft-dark': 'var(--color-soft-dark)',
          background: 'var(--color-background)',
          surface: 'var(--color-surface)',
          'accent-muted': 'var(--color-accent-muted)',
          'board-bg': 'var(--color-board-bg)',
          'info-background': 'var(--info-background)',
        },
        borderRadius: {
          xl: "1rem",
          "2xl": "1.5rem",
        },
      },
    },
    plugins: [],
  }
