import type { Config } from "tailwindcss";

/**
 * AAA dark / glassmorphism design system.
 * Palette extracted from the inspiration mockups: deep navy backgrounds,
 * electric violet + cyan accents, neon green for positive deltas.
 */
const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          900: "#070a12",
          800: "#0b0f1c",
          700: "#101626",
          600: "#161e33",
        },
        glass: "rgba(255,255,255,0.04)",
        line: "rgba(255,255,255,0.08)",
        brand: {
          DEFAULT: "#7c5cff",
          400: "#9b86ff",
          500: "#7c5cff",
          600: "#6336ff",
        },
        cyan: { DEFAULT: "#27d6ff", 500: "#27d6ff" },
        good: "#34e0a1",
        bad: "#ff5c7c",
        warn: "#ffb24c",
        ink: {
          100: "#eef2ff",
          300: "#aab3d4",
          500: "#6b76a0",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: { xl2: "1.25rem" },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.45)",
        glow: "0 0 24px rgba(124,92,255,0.35)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)",
        "radial-brand":
          "radial-gradient(1200px 600px at 20% -10%, rgba(124,92,255,0.18), transparent 60%), radial-gradient(900px 500px at 100% 0%, rgba(39,214,255,0.12), transparent 55%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up .4s ease both",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
