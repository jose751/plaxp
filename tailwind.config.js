/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Color principal de Plaxp
        primary: '#6a48bf',
        // Color de fondo oscuro
        dark: {
          bg: '#13161b',         // Fondo principal oscuro
          card: '#1a1f27',       // Fondo de tarjetas/cards
          border: '#2a2f38',     // Bordes en modo oscuro
          hover: '#252a33',      // Hover en modo oscuro
        },
        // Colores neutros (grises actualizados)
        neutral: {
          100: '#FAFAFA',        // Fondo muy claro
          200: '#EAEAEA',        // Bordes suaves
          300: '#CFCFCF',        // Bordes normales
          500: '#7A7A7A',        // Texto secundario
          600: '#5C5C5C',        // Texto terciario
          700: '#3C3C3C',        // Texto normal
          900: '#1A1A1A',        // Texto principal/títulos
        },
        // Colores de estado
        success: '#10B981',      // Verde (éxito)
        warning: '#F59E0B',      // Amarillo/Naranja (advertencia)
        danger: '#EF4444',       // Rojo (error/peligro)
        info: '#3B82F6',         // Azul (información)
        // Colores de exportación
        excel: '#217346',        // Verde Excel
        pdf: '#DC2626',          // Rojo PDF
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.1)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.1)',
        'strong': '0 8px 24px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fadeInUp': {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fadeInLeft': {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'fadeInRight': {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.6s ease-out',
        'fadeInUp': 'fadeInUp 0.6s ease-out',
        'fadeInLeft': 'fadeInLeft 0.7s ease-out',
        'fadeInRight': 'fadeInRight 0.7s ease-out 0.2s both',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

