/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#111827',
          premium: '#000000',
        },
        secondary: {
          DEFAULT: '#6b7280',
        },
        accent: {
          DEFAULT: '#1e293b', 
        },
        surface: {
          DEFAULT: '#ffffff',
          hover: '#f9fafb',
          muted: '#f3f4f6',
        },
        sidebar: {
          DEFAULT: '#0f172a', // Dark Navy Blue
          item: '#94a3b8',
          active: '#ffffff',
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        '4xl': '2.5rem',
      },
      boxShadow: {
        'premium': '0 4px 15px -1px rgba(0, 0, 0, 0.05), 0 2px 8px -1px rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
