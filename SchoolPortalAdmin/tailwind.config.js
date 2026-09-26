/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./node_modules/@mui/material/**/*.js", // Include MUI components
  ],
  theme: {
    extend: {
      animation: {
        'slide-down': 'slide-down 0.3s ease-out',
      },
      keyframes: {
        'slide-down': {
          '0%': { opacity: 0, transform: 'translateY(-10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

