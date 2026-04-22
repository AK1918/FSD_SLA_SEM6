/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#10b981", // Emerald 500
        secondary: "#059669", // Emerald 600
        accent: "#f59e0b", // Amber 500
      }
    },
  },
  plugins: [],
}
