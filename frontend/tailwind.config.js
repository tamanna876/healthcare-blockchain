/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: "#f2fbff",
          100: "#dff6ff",
          200: "#bcecff",
          300: "#8addff",
          400: "#4fbeff",
          500: "#1a9aff",
          600: "#1077e6",
          700: "#0d5db4",
          800: "#0b4c8b",
          900: "#0a3d6b"
        }
      },
      boxShadow: {
        soft: '0 12px 24px rgba(15, 23, 42, 0.08)',
      },
      borderRadius: {
        xl: '1.2rem',
      },
    }
  },
  plugins: []
};
