/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        felt: {
          dark: '#0a2316',
          DEFAULT: '#114227',
          light: '#1b5e38',
          border: '#2a7c4c'
        },
        gold: {
          light: '#fef08a',
          DEFAULT: '#eab308',
          dark: '#ca8a04',
          accent: '#fbbf24'
        },
        okey: {
          red: '#ef4444',
          black: '#1e293b',
          blue: '#3b82f6',
          yellow: '#eab308',
          fake: '#8b5cf6'
        }
      },
      boxShadow: {
        'tile': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
        'tile-selected': '0 0 15px rgba(234, 179, 8, 0.8), 0 4px 6px -1px rgba(0,0,0,0.4)',
        'felt': 'inset 0 0 100px rgba(0, 0, 0, 0.7)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
