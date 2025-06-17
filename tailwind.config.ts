
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        stress: "#BFD7FF", // pastel-blauw accent stress
        background: "#F6F4F2",
        sidebar: "#E8E6E4",
      },
      borderRadius: {
        xl: "12px",
      },
      boxShadow: {
        card: "0 2px 8px 0 rgba(0,0,0,0.04)",
      },
      keyframes: {
        "fade-slide-in": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseaccent: {
          "0%": { boxShadow: "0 0 0 0 #BFD7FF47" },
          "70%": { boxShadow: "0 0 0 10px #BFD7FF05" },
          "100%": { boxShadow: "0 0 0 0 #BFD7FF00" },
        },
      },
      animation: {
        "fade-slide-in": "fade-slide-in 0.25s cubic-bezier(.4,0,.2,1)",
        "pulse-accent": "pulseaccent 1s",
      },
    },
  },
  plugins: [animate],
} satisfies Config;
