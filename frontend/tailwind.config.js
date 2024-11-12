export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // or 'media' if you want to respect system preferences
  theme: {
    extend: {
      fontFamily: {
        'poppins': ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

const styles = {
  '.animate-bounce-short': {
    animation: 'bounce 1s infinite',
    transform: 'translateY(-5%)',
    animationDuration: '2s'
  }
};
