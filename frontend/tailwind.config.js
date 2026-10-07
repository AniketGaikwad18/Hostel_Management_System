/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        oat: {
          50: '#FAF7F0',
          100: '#F3EBDD',
          200: '#EBDDC7',
          300: '#E2D3BE',
          400: '#D5C4AA',
          500: '#C4B098',
        },
        navy: {
          DEFAULT: '#171A3A',
          50: '#2A2D52',
          100: '#1E2145',
          900: '#171A3A',
        },
        purple: {
          50: '#F6F2FC',
          100: '#EAE2F8',
          200: '#D8C7F3',
          300: '#C4A8EE',
          400: '#9B7ACC',
          500: '#7A5BBF',
          600: '#6046A8',
          700: '#4F378E',
          800: '#3E2B70',
          900: '#2F1E59',
        },
        tangerine: {
          50: '#FFFBF5',
          100: '#FFF0DD',
          200: '#FFE1BB',
          300: '#FFD199',
          400: '#F5A54D',
          500: '#F28C28',
          600: '#DE7716',
          700: '#B85E0D',
        },
        emergency: {
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          500: '#D93636',
          600: '#D93636',
          700: '#B91C1C',
        },
        safety: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          500: '#258A60',
          600: '#258A60',
          700: '#166E4C',
        },
        whatsapp: {
          DEFAULT: '#25D366',
          dark: '#128C7E',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        editorial: ['Plus Jakarta Sans', 'Georgia', 'serif'],
      },
      fontSize: {
        'editorial-xl': ['3.5rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '900' }],
        'editorial-lg': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.015em', fontWeight: '900' }],
        'editorial-md': ['1.75rem', { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '800' }],
      },
      boxShadow: {
        'editorial': '0 1px 2px rgba(23, 26, 58, 0.04)',
        'editorial-hover': '0 4px 12px rgba(23, 26, 58, 0.08)',
        'editorial-lg': '0 8px 24px rgba(23, 26, 58, 0.1)',
        'toast': '0 12px 40px rgba(23, 26, 58, 0.2)',
      },
      borderRadius: {
        'editorial': '2px',
      },
    },
  },
  plugins: [],
}
