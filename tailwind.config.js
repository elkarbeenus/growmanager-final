const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;
const scale = (name, steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]) =>
  Object.fromEntries(steps.map((s) => [s, v(`${name}-${s}`)]));

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Inter Display', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      // Farben kommen aus CSS-Variablen (src/themes.css) – so wechselt das Theme sofort, ohne Neustart.
      colors: {
        white: v('white'),
        primary: scale('primary'),
        accent: scale('accent'),
        warning: scale('warning'),
        error: scale('error'),
        led: scale('led'),
        ink: scale('ink', [50, 100, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950]),
      },
      boxShadow: {
        glow: '0 0 28px -6px rgb(var(--c-primary-400) / 0.55)',
        'glow-led': '0 0 28px -6px rgb(var(--c-led-400) / 0.55)',
        card: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.45), 0 12px 32px -16px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        spectrum: 'var(--spectrum)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        'drop-in': 'dropIn 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
        'bubble-in': 'bubbleIn 0.32s cubic-bezier(0.34, 1.4, 0.64, 1) both',
        'typing': 'typing 1s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        dropIn: {
          '0%': { opacity: '0', transform: 'translate(-50%, -24px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0) scale(1)' },
        },
        bubbleIn: {
          '0%': { opacity: '0', transform: 'scale(0.85)', transformOrigin: 'bottom left' },
          '100%': { opacity: '1', transform: 'scale(1)', transformOrigin: 'bottom left' },
        },
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.45' },
          '30%': { transform: 'translateY(-3px)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
    },
  },
  plugins: [],
};
