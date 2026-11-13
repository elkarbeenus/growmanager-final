/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Inter Display', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Deep professional greens
        // Chlorophyll – Blattgrün mit Gelbstich (Aktionen, aktive Elemente)
        primary: {
          50: '#f4fdec',
          100: '#e5fad2',
          200: '#ccf4a8',
          300: '#aeea78',
          400: '#93dd53',
          500: '#78c63a',
          600: '#5ea42b',
          700: '#487f25',
          800: '#3a6422',
          900: '#30521f',
          950: '#162d0b',
        },
        // Crisp lime accent
        // Minze – Wachstum / Erfolg
        accent: {
          50: '#effdf8',
          100: '#d8fbee',
          200: '#b2f5dd',
          300: '#7cebc6',
          400: '#47d9ab',
          500: '#22bf92',
          600: '#169a77',
          700: '#157b61',
          800: '#16624f',
          900: '#155143',
        },
        // Warm amber for harvest / stretch
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Dark surface grays (slate-tinted)
        // Zelt bei Nacht – pflaumen-getönte Dunkeltöne (wie Mylar im LED-Licht)
        ink: {
          50: '#f8f6fa',
          100: '#efecf3',
          200: '#ddd8e4',
          300: '#c1bacc',
          400: '#9a91a8',
          500: '#736a82',
          600: '#544c62',
          700: '#3a3445',
          800: '#2a2532',
          850: '#211d28',
          900: '#18151e',
          950: '#0e0c12',
        },
        // LED-Violett – Licht, Hinweise, Tour
        led: {
          200: '#ddd0ff',
          300: '#c6b0ff',
          400: '#ad8cff',
          500: '#9268f5',
          600: '#7a4fe0',
        },
      },
      boxShadow: {
        glow: '0 0 28px -6px rgba(147, 221, 83, 0.55)',
        'glow-led': '0 0 28px -6px rgba(173, 140, 255, 0.55)',
        card: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.45), 0 12px 32px -16px rgba(0,0,0,0.7)',
      },
      backgroundImage: {
        spectrum: 'linear-gradient(90deg, #7a4fe0 0%, #4f7dff 22%, #47d9ab 45%, #93dd53 62%, #f5b544 80%, #ff5d6c 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
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
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
    },
  },
  plugins: [],
};
