/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  // 기존 커스텀 CSS(app.css)와 충돌하지 않도록 Tailwind 초기화(preflight) 비활성화
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        // DESIGN-bmw-m.md 토큰
        canvas: '#000000',
        ink: '#ffffff',
        body: '#bbbbbb',
        muted: '#7e7e7e',
        hairline: '#3c3c3c',
        'hairline-strong': '#262626',
        'surface-card': '#1a1a1a',
        'surface-elevated': '#262626',
        'surface-soft': '#0d0d0d',
        'm-blue-light': '#0066b1',
        'm-blue-dark': '#1c69d4',
        'm-red': '#e22718',
      },
      maxWidth: {
        content: '1440px',
      },
      letterSpacing: {
        machined: '1.5px',
      },
    },
  },
  plugins: [],
}
