/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gray: {
          900: '#0f172a', // Deep background
          800: '#1e293b', // Card background
        },
        primary: '#22d3ee', // Cyan accent
        secondary: '#f472b6', // Pink accent
        success: '#4ade80',
        danger: '#f43f5e',
      }
    },
  },
  plugins: [],
}
