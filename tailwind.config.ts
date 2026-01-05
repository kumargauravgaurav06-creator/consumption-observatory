import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",        // <--- This line is critical
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        'pulse-dark': '#050505',
        'emerald': { 400: '#34d399', 500: '#10b981' },
        'cyan': { 400: '#22d3ee', 500: '#06b6d4' },
      },
    },
  },
  plugins: [],
};
export default config;
