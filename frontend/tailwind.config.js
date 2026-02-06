/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'farm-green': '#22c55e',
        'farm-brown': '#92400e',
        'farm-sky': '#0ea5e9',
        'farm-sun': '#fbbf24',
      },
      animation: {
        'grow': 'grow 2s ease-in-out infinite',
        'rain': 'rain 0.5s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        grow: {
          '0%, 100%': { transform: 'scaleY(1)' },
          '50%': { transform: 'scaleY(1.1)' },
        },
        rain: {
          '0%': { transform: 'translateY(-10px)', opacity: 0 },
          '50%': { opacity: 1 },
          '100%': { transform: 'translateY(10px)', opacity: 0 },
        }
      }
    },
  },
  plugins: [],
}
