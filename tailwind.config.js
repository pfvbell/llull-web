/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
      './src/components/**/*.{js,ts,jsx,tsx,mdx}',
      './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
      extend: {
        fontFamily: {
          sans: ['var(--font-geist-sans)'],
          mono: ['var(--font-geist-mono)'],
          garamond: ['var(--font-eb-garamond)', 'Georgia', 'serif'],
        },
        colors: {
          beige: {
            50: '#FAF7F2',  // Very light beige for background
            100: '#F5F0E5',
            200: '#EBE2D3',
            300: '#DCCFB8',
            400: '#C9B799',
            500: '#B69E7B',
          },
          green: {
            // Forest greens for titles
            700: '#2D6A4F',
            600: '#40916C',
            500: '#52B788',
            400: '#74C69D',
            300: '#95D5B2',
          }
        },
        animation: {
          'spin-slow': 'spin 6s linear infinite',
          'spin-reverse-slow': 'spin-reverse 6s linear infinite',
        },
        keyframes: {
          'spin-reverse': {
            from: {
              transform: 'rotate(0deg)',
            },
            to: {
              transform: 'rotate(-360deg)',
            },
          }
        },
      },
    },
    plugins: [],
  } 