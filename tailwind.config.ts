import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#0B3D2E",
          50: "#E7F0EC",
          100: "#C7DED4",
          600: "#0F4E3A",
          700: "#0B3D2E",
          800: "#082B20",
          900: "#051C15",
        },
        cream: "#FAF8F3",
        lime: {
          DEFAULT: "#C6F432",
          dark: "#A9D91F",
          soft: "#EAFBBE",
        },
        charcoal: "#1A1A1A",
        ink: "#111512",
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0 4px 24px -8px rgba(11, 61, 46, 0.15)",
        "card-lg": "0 12px 40px -12px rgba(11, 61, 46, 0.25)",
        glow: "0 0 0 3px rgba(198, 244, 50, 0.35)",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
