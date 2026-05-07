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
        // Quizlet ref palette
        "q-gray": {
          100: "#FFFFFF",
          200: "#F6F7FB",
          300: "#EDEFF4",
          400: "#D9DDE8",
          500: "#939BB4",
          600: "#586380",
          700: "#2E3856",
          800: "#282E3E",
          900: "#1A1D28",
        },
        "q-twilight": {
          100: "#EDEFFF",
          200: "#DBDFFF",
          300: "#A8B1FF",
          400: "#7583FF",
          500: "#4255FF",
          600: "#423ED8",
          700: "#1F1C8B",
        },
        "q-mint": {
          100: "#E6FCF4",
          400: "#59E8B5",
          500: "#18AE79",
          600: "#12815A",
        },
        "q-cherry": {
          300: "#FF7873",
          400: "#DA4543",
          500: "#B00020",
        },
        "q-sherbert": {
          300: "#FFC38C",
          400: "#FF983A",
          500: "#CC4E00",
        },
        "q-sunset": {
          300: "#FFDC62",
          400: "#FFCD1F",
        },
        // Semantic aliases for Tailwind classes
        bg:        "#F6F7FB",
        surface:   "#FFFFFF",
        border:    "#EDEFF4",
        accent:    "#4255FF",
        "accent-hover": "#423ED8",
        "accent-light": "#EDEFFF",
        "accent-danger": "#B00020",
        "score-low":  "#B00020",
        "score-mid":  "#FF983A",
        "score-high": "#18AE79",
        "text-primary":   "#282E3E",
        "text-secondary": "#586380",
        "text-muted":     "#939BB4",
        "text-disabled":  "#D9DDE8",
      },
      fontFamily: {
        sans:    ["HurmeGeometricSans2", "sans-serif"],
        display: ["HurmeGeometricSans2", "sans-serif"],
      },
      fontSize: {
        // Quizlet type scale
        "q-h1":  ["44px", { lineHeight: "56px", fontWeight: "700" }],
        "q-h2":  ["32px", { lineHeight: "40px", fontWeight: "700" }],
        "q-h3":  ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "q-h4":  ["20px", { lineHeight: "28px", fontWeight: "700" }],
        "q-h5":  ["16px", { lineHeight: "24px", fontWeight: "700" }],
        "q-sh1": ["24px", { lineHeight: "36px", fontWeight: "600" }],
        "q-sh2": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "q-sh3": ["16px", { lineHeight: "24px", fontWeight: "600" }],
        "q-sh4": ["14px", { lineHeight: "20px", fontWeight: "600" }],
        "q-sh5": ["12px", { lineHeight: "16px", fontWeight: "600" }],
        "q-b1":  ["24px", { lineHeight: "32px", fontWeight: "400" }],
        "q-b2":  ["20px", { lineHeight: "28px", fontWeight: "400" }],
        "q-b3":  ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "q-b4":  ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "q-b5":  ["12px", { lineHeight: "16px", fontWeight: "400" }],
      },
      spacing: {
        // Quizlet spacing scale
        "q-2":  "2px",
        "q-4":  "4px",
        "q-6":  "6px",
        "q-8":  "8px",
        "q-10": "10px",
        "q-12": "12px",
        "q-16": "16px",
        "q-20": "20px",
        "q-24": "24px",
        "q-32": "32px",
        "q-48": "48px",
        "q-64": "64px",
      },
      borderRadius: {
        "q-sm":   "4px",
        "q-md":   "8px",
        "q-12":   "12px",
        "q-lg":   "16px",
        "q-xl":   "24px",
        "q-xxl":  "32px",
        "q-full": "200px",
        // Keep legacy aliases
        sm:  "4px",
        DEFAULT: "12px",
        lg:  "16px",
        xl:  "24px",
      },
      boxShadow: {
        "q-sm": "0 2px 4px 0 #282E3E1A",
        "q-md": "0 4px 16px 0 #282E3E1A",
        "q-lg": "0 4px 32px 0 #282E3E1A",
        // Keep legacy
        sm:  "0 2px 4px 0 #282E3E1A",
        DEFAULT: "0 4px 16px 0 #282E3E1A",
        lg:  "0 4px 32px 0 #282E3E1A",
      },
      animation: {
        "pulse-danger": "pulse-danger 1s ease-in-out infinite",
      },
      keyframes: {
        "pulse-danger": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
