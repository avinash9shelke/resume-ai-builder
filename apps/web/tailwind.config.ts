import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui-core/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Arial", "Helvetica", "sans-serif"],
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(-50%)" },
          to: { transform: "translateX(0%)" },
        },
        "card-flip-in": {
          "0%": { transform: "rotateY(-90deg) scale(0.92)", opacity: "0" },
          "60%": { transform: "rotateY(4deg) scale(1)", opacity: "1" },
          "100%": { transform: "rotateY(0deg) scale(1)", opacity: "1" },
        },
      },
      animation: {
        marquee: "marquee 32s linear infinite",
        "card-flip-in": "card-flip-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
      },
    },
  },
  plugins: [],
};
export default config;
