import React from 'react';
import { Link } from 'react-router-dom';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-b from-black via-neutral-950 to-neutral-950 py-16 md:py-20 lg:py-32 px-4 sm:px-6 lg:px-12 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" style={{ animation: 'slow-glow 12s ease-in-out infinite' }}></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px]" style={{ animation: 'slow-glow 15s ease-in-out infinite 2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/3 rounded-full blur-[150px]" style={{ animation: 'slow-glow 18s ease-in-out infinite 4s' }}></div>
      </div>

      <div className="container-custom px-4 sm:px-6 relative z-10">
        {/* Content - Centered at Top */}
        <div className="max-w-5xl mx-auto text-center space-y-6 md:space-y-8 mb-12 md:mb-16">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 backdrop-blur-xl border border-white/10 shadow-lg hover:shadow-xl hover:border-white/20 transition-all duration-700 group cursor-pointer relative overflow-hidden"
            style={{
              opacity: 0,
              filter: 'blur(3px)',
              animation: 'soft-fade-blur 1s ease-out 0.1s forwards'
            }}
          >
            {/* Plaxp Logo */}
            <img
              src="home-page/icono.png"
              alt="Plaxp"
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain relative z-10 transition-all duration-700 group-hover:scale-105"
            />

            {/* Text */}
            <span className="text-white font-semibold text-sm sm:text-base whitespace-nowrap relative z-10">
              Sistema integral de gestión académica
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
            <span
              className="inline-block"
              style={{
                opacity: 0,
                filter: 'blur(4px)',
                animation: 'soft-fade-blur 0.5s ease-out 0.25s forwards'
              }}
            >
              Simplifica la gestión de tu
            </span>
            <span
              className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500 mt-1 sm:mt-2"
              style={{
                opacity: 0,
                filter: 'blur(4px)',
                animation: 'soft-fade-blur 0.5s ease-out 0.4s forwards',
                backgroundSize: '200% 100%'
              }}
            >
              institución educativa
            </span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-neutral-300 leading-relaxed max-w-3xl mx-auto"
            style={{
              opacity: 0,
              filter: 'blur(4px)',
              animation: 'soft-fade-blur 0.5s ease-out 0.55s forwards'
            }}
          >
            Plaxp unifica la gestión administrativa, académica y financiera de tu institución en una sola plataforma inteligente.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 justify-center"
            style={{
              opacity: 0,
              filter: 'blur(2px)',
              animation: 'soft-fade-blur 0.5s ease-out 0.7s forwards'
            }}
          >
            <Link
              to="/schedule-demo"
              className="btn-primary group text-center justify-center relative overflow-hidden transition-all duration-500"
            >
              <span className="relative z-10">
                Solicita una demo
                <span className="inline-block ml-2 transition-transform duration-500 group-hover:translate-x-1">→</span>
              </span>
            </Link>
            <a
              href="#caracteristicas"
              className="btn-secondary text-center group relative overflow-hidden transition-all duration-500"
            >
              <span className="relative z-10">Más información</span>
            </a>
          </div>
        </div>

        {/* Hero Image - Dashboard */}
        <div
          className="relative mx-auto"
          style={{
            maxWidth: '80%',
            opacity: 0,
            filter: 'blur(8px)',
            animation: 'soft-fade-blur 1.3s ease-out 0.85s forwards'
          }}
        >
          {/* Subtle Glow */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-[100px]"
            style={{ animation: 'slow-glow 10s ease-in-out infinite' }}
          ></div>

          {/* Dashboard Image */}
          <div className="relative" style={{ animation: 'gentle-float 8s ease-in-out infinite' }}>
            <img
              src="home-page/dashboard.png"
              alt="Dashboard de Plaxp"
              className="w-full h-auto relative z-10 transition-all duration-1000 hover:scale-[1.01]"
              style={{
                display: 'block',
                maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0) 95%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 50%, rgba(0,0,0,0.6) 80%, rgba(0,0,0,0) 95%)'
              }}
            />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes soft-fade-in {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes soft-fade-blur {
          0% {
            opacity: 0;
            filter: blur(8px);
            transform: translateY(12px);
          }
          100% {
            opacity: 1;
            filter: blur(0px);
            transform: translateY(0);
          }
        }

        @keyframes slow-glow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.05);
          }
        }

        @keyframes gentle-float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </section>
  );
};
