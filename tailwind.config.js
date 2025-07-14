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
          'bounce': 'bounce 1s infinite',
          'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        backdropBlur: {
          'lg': '16px',
        },
        borderRadius: {
          'xl': '0.75rem',
          '2xl': '1rem',
          '3xl': '1.5rem',
        },
      },
    },
    plugins: [
      function({ addUtilities }) {
        const newUtilities = {
          '.animate-in': {
            'animation-fill-mode': 'both',
          },
          '.slide-in-from-bottom-4': {
            'animation-name': 'slideInFromBottom',
            'animation-duration': '0.5s',
            'animation-timing-function': 'ease-out',
          },
          '.slide-in-from-left-4': {
            'animation-name': 'slideInFromLeft',
            'animation-duration': '0.5s',
            'animation-timing-function': 'ease-out',
          },
          '@keyframes slideInFromBottom': {
            '0%': {
              'transform': 'translateY(1rem)',
              'opacity': '0',
            },
            '100%': {
              'transform': 'translateY(0)',
              'opacity': '1',
            },
          },
          '@keyframes slideInFromLeft': {
            '0%': {
              'transform': 'translateX(-1rem)',
              'opacity': '0',
            },
            '100%': {
              'transform': 'translateX(0)',
              'opacity': '1',
            },
          },
        }
        addUtilities(newUtilities)
      }
    ],
  }