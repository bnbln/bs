/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'space-grotesk': ['var(--font-space-grotesk)', 'sans-serif'],
        'inter': ['var(--font-inter)', 'sans-serif'],
        'helvetica': ['Helvetica', 'sans-serif'],
        'vollkorn': ['Vollkorn', 'sans-serif'],
      },
      colors: {
        'blue': '#0000ff',
        'azure': '#172340',
        'orange': '#f18825',
      },
      spacing: {
        '363.55': '363.55px',
        '339.55': '339.55px',
      }
    },
  },
  plugins: [],
} 