/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Light Mode Colors
        'l-bg-1': '#ffffff',
        'l-bg-2': '#f6f8fa',
        'l-bg-3': '#f1f3f4',
        'l-bg-hover': '#e1e4e8',
        'l-bg-active': '#d1d5da',
        'l-bg-selected': '#0366d6',
        'l-text-1': '#24292e',
        'l-text-2': '#586069',
        'l-text-3': '#6a737d',
        'l-text-inverse': '#ffffff',
        'l-border': '#d1d5da',
        'l-border-hover': '#c6cbd1',
        'l-border-active': '#959da5',
        'l-accent': '#0366d6',
        'l-accent-hover': '#0256cc',
        'l-accent-active': '#024ea3',
        'l-success': '#28a745',
        'l-warning': '#ffc107',
        'l-error': '#dc3545',
        'l-info': '#17a2b8',
        
        // Dark Mode Colors
        'd-bg-1': '#0d1117',
        'd-bg-2': '#161b22',
        'd-bg-3': '#21262d',
        'd-bg-hover': '#30363d',
        'd-bg-active': '#484f58',
        'd-bg-selected': '#1f6feb',
        'd-text-1': '#f0f6fc',
        'd-text-2': '#c9d1d9',
        'd-text-3': '#8b949e',
        'd-text-inverse': '#0d1117',
        'd-border': '#30363d',
        'd-border-hover': '#484f58',
        'd-border-active': '#6e7681',
        'd-accent': '#1f6feb',
        'd-accent-hover': '#388bfd',
        'd-accent-active': '#0969da',
        'd-success': '#3fb950',
        'd-warning': '#d29922',
        'd-error': '#f85149',
        'd-info': '#58a6ff',
        
        // Accent colors (mapped to l-accent and d-accent)
        'accent-1': '#0366d6', // Light mode accent
        'accent-2': '#0256cc', // Light mode accent hover
        'accent-3': '#024ea3', // Light mode accent active
        
        // Border colors (mapped to l-border and d-border)
        'border-l': '#d1d5da', // Light mode border
        'border-d': '#30363d', // Dark mode border
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 16px rgba(0, 0, 0, 0.15)',
        'strong': '0 8px 32px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [],
}
