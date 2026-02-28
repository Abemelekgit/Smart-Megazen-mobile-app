/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        optimal:      '#10b981',
        risk:         '#f59e0b',
        critical:     '#ef4444',
        offline:      '#64748b',
        'cyber-blue': '#06b6d4',
      },
    },
  },
  plugins: [],
};
