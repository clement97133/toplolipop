/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Palette principale — Or chaud du logo
        brand: {
          50:  '#FDF8EC',
          100: '#FAF0CC',
          200: '#F5DF99',
          300: '#EEC955',
          400: '#E8B020',
          500: '#D4961A',  // accent principal
          600: '#B07A13',  // boutons
          700: '#8C610F',
          800: '#6A480B',
          900: '#1A2567',  // navy pour textes sombres
        },
        // Marine profond du logo — bottom nav, headers
        navy: {
          50:  '#EFF1FA',
          100: '#D8DCF0',
          200: '#B1BADE',
          300: '#7D8EC9',
          400: '#4F63B4',
          500: '#2E4299',
          600: '#243580',
          700: '#1A2567',
          800: '#101849',
          900: '#080D2E',
        },
        // Fond crème chaud
        cream: {
          50:  '#FFFDF9',
          100: '#FDF8EE',
          200: '#F9EDDA',
          300: '#F3DEC0',
          400: '#EACDA1',
        },
        // Vert palmes du logo
        palm: {
          500: '#2E7D52',
          600: '#235F3F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:         '0 1px 4px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 6px 20px 0 rgb(0 0 0 / 0.10)',
        'card-gold':  '0 4px 16px 0 rgb(212 150 26 / 0.18)',
        modal:        '0 25px 50px -12px rgb(0 0 0 / 0.30)',
        nav:          '0 -2px 20px 0 rgb(26 37 103 / 0.22)',
        btn:          '0 2px 8px 0 rgb(176 122 19 / 0.35)',
        stat:         '0 2px 12px 0 rgb(212 150 26 / 0.15)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'fade-in':  'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.22s ease-out',
        'pop-in':   'popIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                               to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        popIn:   { from: { opacity: '0', transform: 'scale(0.88)' },      to: { opacity: '1', transform: 'scale(1)' } },
      },
    },
  },
  plugins: [],
}
