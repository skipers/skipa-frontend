/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'sk-orange': '#FF7A00',
        'sk-red': '#EA002C',
        'sk-navy': '#1A1A2E',
        'sk-orange-light': 'rgba(255, 122, 0, 0.1)',
      },
      fontFamily: {
        pretendard: ['Pretendard', 'Noto Sans KR', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

