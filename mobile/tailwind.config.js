/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Smart-Megazen Design Tokens
        'slate-900':   '#0f172a',
        'slate-800':   '#1e293b',
        'slate-700':   '#334155',
        'slate-600':   '#475569',
        'slate-400':   '#94a3b8',
        'slate-200':   '#e2e8f0',

        // Status Colors
        optimal:       '#10b981', // Emerald
        'optimal-dim': '#064e3b',
        risk:          '#f59e0b', // Amber
        'risk-dim':    '#78350f',
        critical:      '#ef4444', // Red
        'critical-dim':'#7f1d1d',
        offline:       '#64748b', // Slate

        // Accent
        'cyber-blue':  '#06b6d4', // Cyan-500
        'cyber-dim':   '#164e63',
      },
      fontFamily: {
        mono: ['SpaceMono-Regular'],
      },
    },
  },
  plugins: [],
};
