import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        surface: '#1e293b',
        border: '#334155',
        text: '#f1f5f9',
        'text-muted': '#cbd5e1',
        danger: '#ef4444',
        success: '#10b981',
        bg: '#0f172a',
      },
    },
  },
  plugins: [],
}
export default config
