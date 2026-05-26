/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // We will define custom colors for dark mode and light mode matching the web admin panel
        darkbg: '#0c0e12',
        darkcard: '#161920',
        darkborder: '#2a2d33',
        brandPurple: '#8b5cf6',
      }
    },
  },
  plugins: [],
}
