import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B0F1A",
        midnight: "#1A1F3A",
        neon: "#6C63FF"
      },
      boxShadow: {
        glow: "0 0 42px rgba(108, 99, 255, 0.32)",
        glass: "0 24px 80px rgba(0, 0, 0, 0.35)"
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseGlow: "pulseGlow 2.4s ease-in-out infinite",
        drawLine: "drawLine 2.2s ease-out both",
        shimmer: "shimmer 3s linear infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" }
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(108, 99, 255, 0)" },
          "50%": { boxShadow: "0 0 36px rgba(108, 99, 255, 0.45)" }
        },
        drawLine: {
          from: { strokeDashoffset: "340" },
          to: { strokeDashoffset: "0" }
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" }
        }
      }
    }
  },
  plugins: []
};

export default config;
