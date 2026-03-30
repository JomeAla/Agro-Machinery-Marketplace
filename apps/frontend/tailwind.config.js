/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          DEFAULT: '#0a0f0d',
          50: '#f0f4f1',
          100: '#131f19',
          200: '#1a2c24',
          300: '#162219',
        },
        accent: {
          DEFAULT: '#00e676',
          dim: '#00c853',
          glow: 'rgba(0, 230, 118, 0.15)',
        },
        gold: {
          DEFAULT: '#f5c842',
          dim: '#d4a933',
        },
        forest: {
          DEFAULT: '#1B4332',
          light: '#2D6A4F',
          muted: '#40916C',
        },
        earth: {
          DEFAULT: '#8B6F47',
          light: '#C9A96E',
        },
        cream: {
          DEFAULT: '#faf8f5',
          dark: '#f0ece4',
        },
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
