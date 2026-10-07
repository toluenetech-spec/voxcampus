import animate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // Palette recovered from the newer VoxCampus build so both versions can
      // share the same design tokens.
      colors: {
        aqua: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        aurora: {
          400: '#a78bfa',
          500: '#8b5cf6',
        },
        electric: {
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'system-ui', 'sans-serif'],
      },
      // One radius per surface class. Mixing radii at random is the single
      // biggest thing that makes a UI read as unfinished.
      borderRadius: {
        card: '1rem',
        panel: '1.25rem',
        sheet: '1.75rem',
      },
      // Shadows read from the CSS material variables so light and dark stay
      // in step without a `dark:` variant on every element.
      boxShadow: {
        material: 'inset 0 1px 0 0 var(--specular), var(--shadow-ambient), var(--shadow-contact)',
        'material-lg': 'inset 0 1px 0 0 var(--specular), 0 24px 60px -12px rgb(0 0 0 / 0.45), var(--shadow-contact)',
        contact: 'var(--shadow-contact)',
      },
      transitionTimingFunction: {
        material: 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
        'fade-in-up': 'fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
        marquee: 'marquee 30s linear infinite',
      },
    },
  },
  plugins: [animate],
};
