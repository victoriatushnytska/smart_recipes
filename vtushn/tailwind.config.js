/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'vtushn-green': '#00C896',
        'vtushn-dark': '#0A0A0A',
        'vtushn-card': '#1A1A1A',
      }
    },
  },
  plugins: [],
}