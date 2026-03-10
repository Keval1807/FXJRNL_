import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0e1117',
        bg2: '#151b25',
        bg3: '#1a2232',
        bg4: '#1f2a3c',
        bg5: '#243044',
        border: '#1e2d42',
        border2: '#263650',
        tx: '#c8d8f0',
        tx2: '#7a90b0',
        tx3: '#4a607a',
        tx4: '#2a3f55',
        green: '#00d4a0',
        blue: '#00b4e6',
        gold: '#f5a623',
        red: '#e64040',
        purple: '#9b6dff',
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
