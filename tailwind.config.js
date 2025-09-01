/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'matte-black': '#1a1a1a',
        'glass-bg': 'rgba(41, 41, 41, 0.5)', // A darker, more solid glass
        'glass-border': 'rgba(255, 255, 255, 0.1)',
        'primary': {
          DEFAULT: '#3b82f6', // blue-600
          'hover': '#2563eb', // blue-700
        },
        'text-primary': '#e5e7eb', // gray-200
        'text-secondary': '#9ca3af', // gray-400
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        'xl': '16px',
      },
    },
  },
  plugins: [],
}
