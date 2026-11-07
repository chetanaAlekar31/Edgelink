import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--cs-background)",
        foreground: "var(--cs-foreground)",
        surface: "var(--cs-surface)",
        muted: "var(--cs-muted)",
        accent: "var(--cs-accent)",
        sidebar: "var(--cs-sidebar)",
        border: "var(--cs-border)",
      },
      borderRadius: {
        DEFAULT: "var(--cs-radius)",
      },
      fontFamily: {
        heading: "var(--cs-font-heading)",
        body: "var(--cs-font-body)",
      },
      boxShadow: {
        card: "var(--cs-shadow)",
      },
    },
  },
  plugins: [],
};

export default config;
