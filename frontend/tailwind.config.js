/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0f2744',
          blue: '#1e3a8a',
          lightBlue: '#3b82f6',
          saffron: '#ea580c',
          gold: '#d97706',
          green: '#15803d',
          darkGreen: '#166534',
          cream: '#fefce8',
          slate: '#334155',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
