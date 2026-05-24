import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: '#1a1a2e',
          deep: '#16213e',
          mid: '#0f3460',
          electric: '#533483',
        },
        accent: {
          red: '#e63946',
          orange: '#f77f00',
          blue: '#457b9d',
          cyan: '#48cae4',
        },
        success: '#2d6a4f',
        gray: {
          1: '#f8f8f6',
          2: '#ededeb',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        'gradient-accent': 'linear-gradient(135deg, #e63946 0%, #f77f00 100%)',
        'gradient-hero': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #533483 100%)',
        'gradient-card': 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
        'gradient-text': 'linear-gradient(90deg, #e63946 0%, #f77f00 50%, #e63946 100%)',
        'gradient-blue': 'linear-gradient(135deg, #457b9d 0%, #48cae4 100%)',
        'gradient-success': 'linear-gradient(135deg, #2d6a4f 0%, #40916c 100%)',
      },
    },
  },
  plugins: [],
};
export default config;
