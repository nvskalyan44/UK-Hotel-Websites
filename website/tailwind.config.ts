import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        bg: {
          0: "#0d0604",
          1: "#1a0a05",
          2: "#2a1208",
          3: "#3a1c0d",
        },
        brand: {
          50: "#fff1e6",
          100: "#ffd8b3",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
        },
        ink: {
          DEFAULT: "#fff5e8",
          dim: "#e6d4bd",
          muted: "rgba(255, 235, 210, 0.6)",
          faint: "rgba(255, 235, 210, 0.35)",
        },
      },
      maxWidth: {
        container: "1320px",
      },
      borderRadius: {
        card: "24px",
        "card-sm": "16px",
        input: "14px",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideRight: {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        pop: {
          "0%": { transform: "scale(0.9) translateX(-50%)", opacity: "0" },
          "100%": { transform: "scale(1) translateX(-50%)", opacity: "1" },
        },
        spin: {
          to: { transform: "rotate(360deg)" },
        },
        pulse: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(234, 88, 12, 0.4)" },
          "50%": { boxShadow: "0 0 0 14px rgba(234, 88, 12, 0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 180ms ease",
        slideRight: "slideRight 240ms cubic-bezier(0.16, 1, 0.3, 1)",
        pop: "pop 240ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        spin: "spin 0.7s linear infinite",
        pulse: "pulse 2s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
