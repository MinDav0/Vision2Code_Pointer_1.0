import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light Mode - Background Colors
        'l-bg-1': 'var(--color-l-bg-1)',
        'l-bg-2': 'var(--color-l-bg-2)',
        'l-bg-3': 'var(--color-l-bg-3)',
        'l-bg-hover': 'var(--color-l-bg-hover)',

        // Light Mode - Text Colors
        'l-text-1': 'var(--color-l-text-1)',
        'l-text-2': 'var(--color-l-text-2)',
        'l-text-3': 'var(--color-l-text-3)',
        'l-text-inv': 'var(--color-l-text-inv)',

        // Dark Mode - Background Colors
        'd-bg-1': 'var(--color-d-bg-1)',
        'd-bg-2': 'var(--color-d-bg-2)',
        'd-bg-3': 'var(--color-d-bg-3)',
        'd-bg-hover': 'var(--color-d-bg-hover)',

        // Dark Mode - Text Colors
        'd-text-1': 'var(--color-d-text-1)',
        'd-text-2': 'var(--color-d-text-2)',
        'd-text-3': 'var(--color-d-text-3)',
        'd-text-inv': 'var(--color-d-text-inv)',

        // Accent Colors
        'accent-1': 'var(--color-accent-1)',
        'accent-2': 'var(--color-accent-2)',
        'accent-success': 'var(--color-accent-success)',
        'accent-warning': 'var(--color-accent-warning)',
        'accent-danger': 'var(--color-accent-danger)',

        // Border Colors
        'border-l': 'var(--color-border-l)',
        'border-d': 'var(--color-border-d)',

        // Shadow Colors
        'shadow-l': 'var(--color-shadow-l)',
        'shadow-d': 'var(--color-shadow-d)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
