/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aurora: {
          bg: '#0B0F19',
          surface: '#1E293B',
          surfaceLight: '#263449',
          border: '#334155',
          borderLight: '#475569',
          cyan: '#06B6D4',
          purple: '#8B5CF6',
          pink: '#EC4899',
          emerald: '#10B981',
          amber: '#F59E0B',
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 15px -2px rgba(6, 182, 212, 0.4)',
        'neon-purple': '0 0 15px -2px rgba(139, 92, 246, 0.4)',
        'neon-pink': '0 0 15px -2px rgba(236, 72, 153, 0.4)',
        'aurora-glow': '0 0 25px -5px rgba(6, 182, 212, 0.25), 0 0 25px -5px rgba(139, 92, 246, 0.25)',
      },
      backgroundImage: {
        'aurora-gradient': 'radial-gradient(circle at 20% 20%, rgba(6, 182, 212, 0.12) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.12) 0%, transparent 40%), radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.08) 0%, transparent 50%)',
      }
    },
  },
  plugins: [],
}
