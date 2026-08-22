/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: {
          950: '#021510',
          900: '#042b1d',
          800: '#063B28',
          700: '#056B3A',
          600: '#0a8a4f',
          500: '#10b36a',
        },
        gold: {
          50: '#fff9e8',
          100: '#FFF4D6',
          200: '#ffe566',
          300: '#FFD21A',
          400: '#e8b800',
          500: '#c79a00',
        },
        pink: {
          400: '#ff3d99',
          500: '#F5007A',
          600: '#cc0066',
        },
        cream: {
          100: '#fff9e8',
          200: '#FFF4D6',
          300: '#f5e6c0',
        },
      },
      fontFamily: {
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.85' },
          '50%': { transform: 'scale(1.04)', opacity: '1' },
        },
        spinSlow: {
          to: { transform: 'rotate(360deg)' },
        },
        spinReverse: {
          to: { transform: 'rotate(-360deg)' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '33%': { transform: 'translate(8px, -10px)' },
          '66%': { transform: 'translate(-6px, 8px)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.7' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        hintSlide: {
          '0%': { transform: 'translateX(0)', opacity: '0.4' },
          '50%': { transform: 'translateX(14px)', opacity: '1' },
          '100%': { transform: 'translateX(0)', opacity: '0.4' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2' },
          '50%': { opacity: '0.9' },
        },
        starDrift: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(4px, -6px)' },
          '50%': { transform: 'translate(-3px, 4px)' },
          '75%': { transform: 'translate(5px, 2px)' },
        },
        meteor: {
          '0%': { transform: 'translate(0, 0) rotate(35deg)', opacity: '0' },
          '3%': { opacity: '0.9' },
          '15%': { transform: 'translate(-180px, 126px) rotate(35deg)', opacity: '0' },
          '100%': { transform: 'translate(-180px, 126px) rotate(35deg)', opacity: '0' },
        },
        sway1: {
          '0%, 100%': { transform: 'rotate(-1.5deg)' },
          '50%': { transform: 'rotate(1.5deg)' },
        },
        sway2: {
          '0%, 100%': { transform: 'rotate(1deg)' },
          '50%': { transform: 'rotate(-2deg)' },
        },
        sway3: {
          '0%, 100%': { transform: 'rotate(-0.8deg)' },
          '50%': { transform: 'rotate(1.2deg)' },
        },
        sway4: {
          '0%, 100%': { transform: 'rotate(0.6deg)' },
          '50%': { transform: 'rotate(-1.4deg)' },
        },
        waveBar: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
        mapPulse: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.7', transform: 'scale(1.4)' },
        },
        mapGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        mapBreath: {
          '0%, 100%': { filter: 'drop-shadow(0 0 8px rgba(255,210,26,0.15))' },
          '50%': { filter: 'drop-shadow(0 0 20px rgba(255,210,26,0.3))' },
        },
        statePulse: {
          '0%': { opacity: '0.6', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(1.15)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        breathe: 'breathe 4s ease-in-out infinite',
        'spin-slow': 'spinSlow 28s linear infinite',
        'spin-reverse': 'spinReverse 36s linear infinite',
        'float-y': 'floatY 6s ease-in-out infinite',
        drift: 'drift 14s ease-in-out infinite',
        'pulse-ring': 'pulseRing 2.4s ease-out infinite',
        shimmer: 'shimmer 3s linear infinite',
        'hint-slide': 'hintSlide 2.2s ease-in-out infinite',
        twinkle: 'twinkle 3s ease-in-out infinite',
        'star-drift': 'starDrift 18s ease-in-out infinite',
        meteor: 'meteor 14s ease-in infinite',
        'sway-1': 'sway1 8s ease-in-out infinite',
        'sway-2': 'sway2 11s ease-in-out infinite',
        'sway-3': 'sway3 14s ease-in-out infinite',
        'sway-4': 'sway4 10s ease-in-out infinite',
        'wave-bar': 'waveBar 0.9s ease-in-out infinite',
        'map-pulse': 'mapPulse 3s ease-in-out infinite',
        'map-glow': 'mapGlow 4s ease-in-out infinite',
        'map-breath': 'mapBreath 6s ease-in-out infinite',
        'state-pulse': 'statePulse 1.5s ease-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out both',
      },
    },
  },
  plugins: [],
};
