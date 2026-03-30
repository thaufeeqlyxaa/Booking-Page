import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        sage: '#111111',
        mist: '#6f6f6f',
        sand: '#efefef',
        sunset: '#d4d4d4',
        horizon: '#efefef'
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      },
      boxShadow: {
        'soft-lg': '0 20px 45px rgba(0, 0, 0, 0.12)'
      }
    }
  },
  plugins: []
};

export default config;
