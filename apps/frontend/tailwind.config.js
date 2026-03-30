/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#FDFBF7',
          dark: '#F5F0E8',
        },
        forest: {
          DEFAULT: '#1B4332',
          light: '#2D6A4F',
          muted: '#40916C',
          50: '#f0fdf4',
          100: '#dcfce7',
        },
        earth: {
          DEFAULT: '#8B6F47',
          light: '#C9A96E',
        },
        charcoal: '#1A1A1A',
        slate: '#4A4A4A',
        mist: '#E8E4DC',
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
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
    },
  },
  plugins: [],
};
