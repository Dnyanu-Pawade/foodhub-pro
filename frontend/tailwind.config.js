/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary:  { DEFAULT: '#f97316', dark: '#ea580c' },
        secondary:{ DEFAULT: '#1e293b' }
      }
    }
  },
  plugins: []
}
