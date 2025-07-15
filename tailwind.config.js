/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './pages/**/*.{js,ts,jsx,tsx,mdx}',
      './components/**/*.{js,ts,jsx,tsx,mdx}',
      './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        animation: {
          'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        fontFamily: {
          'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        },
        screens: {
          'xs': '475px',
          'sm': '640px',
          'md': '768px',
          'lg': '1024px',
          'xl': '1280px',
          '2xl': '1536px',
          '3xl': '1920px',
        },
        spacing: {
          '18': '4.5rem',
          '88': '22rem',
        },
      },
    },
    plugins: [],
  }