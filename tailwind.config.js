/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neo: {
          red: '#ef4444',
          yellow: '#f59e0b',
          green: '#22c55e',
          blue: '#1d4ed8',
          'blue-light': '#3b82f6',
          bg: '#f8f9fa',
        },
      },
    },
  },
  plugins: [],
}
