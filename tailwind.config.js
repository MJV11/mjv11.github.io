import * as flowbite from 'flowbite-react/tailwind';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html',
    flowbite.content(),
  ],
  theme: {
    extend: {
      fontFamily: {
        'tusker': ['Tusker Grotesk', 'sans-serif'],
        'google-sans-code': ['Google Sans Code', 'monospace'],
      },
      colors: {
        'bronze': '#f3dbc7',
      },
    },
  },
  plugins: [
    require('flowbite/plugin'),
  ],
}
