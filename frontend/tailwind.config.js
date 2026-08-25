/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  // 'class' strategy: dark mode is activated by adding the 'dark' class to <html>
  // We control this manually via ThemeContext (stored in localStorage) so the user's
  // preference persists across sessions. The anti-FOUC script in index.html applies
  // the class before first paint.
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Vercel-inspired design tokens
        // Light: white backgrounds, gray-50 surfaces, gray-900 text
        // Dark: black backgrounds, gray-950/gray-900 surfaces, white text
        surface: {
          light: '#ffffff',
          dark: '#0a0a0a',
        },
        border: {
          light: '#e5e5e5',
          dark: '#262626',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
