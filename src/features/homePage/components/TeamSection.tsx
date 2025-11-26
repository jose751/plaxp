import React, { useState, useEffect } from 'react';

interface TeamMember {
  name: string;
  role: string;
  description: string;
  image: string;
}

const teamMembers: TeamMember[] = [
  {
    name: 'José Guevara Ibarra',
    role: 'Co-founder & CEO',
    description: 'Más de 4 años uniendo diseño y funcionalidad. Certificado en redes y sistemas operativos, transforma ideas en productos modernos y eficientes.',
    image: 'fundadores/JoseLuis.jpg'
  },
  {
    name: 'Yesler Lorio Pérez',
    role: 'Co-founder & CTO',
    description: 'Más de 4 años de experiencia. Especialista en despliegue de aplicaciones, servidores y Ciberseguridad. Garantiza la disponibilidad e integridad de tus datos.',
    image: 'fundadores/YeslerLorio.jpg'
  },
  {
    name: 'Donald Ariel Benavides',
    role: 'Chief Financial Officer',
    description: 'Empresario, educador y visionario financiero. Dirige la estrategia económica de la empresa, potenciando su crecimiento inteligente y sostenido.',
    image: 'fundadores/DonaldAriel.jpg'
  },
  {
    name: 'Dexter Franklin',
    role: 'Head of Business Strategy',
    description: 'Administrador de empresas y CEO experto en ventas y marketing. Lidera el crecimiento comercial y la captación de clientes con inteligencia estratégica.',
    image: 'fundadores/DexterFranklin.jpg'
  }
];

export const TeamSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [_direction, setDirection] = useState<'next' | 'prev'>('next');

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      handleNext();
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const handleNext = () => {
    if (isAnimating) return;
    setDirection('next');
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev + 1) % teamMembers.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setDirection('prev');
    setIsAnimating(true);
    setCurrentIndex((prev) => (prev - 1 + teamMembers.length) % teamMembers.length);
    setTimeout(() => setIsAnimating(false), 600);
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentIndex) return;
    setDirection(index > currentIndex ? 'next' : 'prev');
    setIsAnimating(true);
    setCurrentIndex(index);
    setTimeout(() => setIsAnimating(false), 600);
  };

  return (
    <section id="equipo" className="relative py-16 md:py-20 overflow-hidden scroll-mt-16">
      {/* Animated Background with Gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-black"></div>

      {/* Animated Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl"
          style={{ animation: 'float-slow 20s ease-in-out infinite' }}
        ></div>
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full blur-3xl"
          style={{ animation: 'float-slow 25s ease-in-out infinite reverse' }}
        ></div>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gradient-to-br from-pink-500/10 to-primary/10 rounded-full blur-3xl"
          style={{ animation: 'float-slow 30s ease-in-out infinite' }}
        ></div>
      </div>

      <div className="container-custom px-4 sm:px-6 relative z-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <div
            className="inline-flex items-center gap-2 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-primary/10 px-4 py-2 rounded-full mb-4"
            style={{ animation: 'fade-in-up 0.6s ease-out' }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-40"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500 font-semibold text-sm">
              Nuestro Equipo
            </span>
          </div>

          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3"
            style={{ animation: 'fade-in-up 0.6s ease-out 0.1s both' }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-neutral-100 to-white">
              Líderes en innovación educativa
            </span>
          </h2>
        </div>

        {/* Carousel Container Wrapper */}
        <div className="relative">
          {/* Navigation Arrows - Outside cards container */}
          <button
            onClick={handlePrev}
            disabled={isAnimating}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 group disabled:opacity-50 disabled:cursor-not-allowed z-40"
          >
            <div className="relative w-12 h-12 md:w-14 md:h-14">
              <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-full opacity-10 group-hover:opacity-40 blur-sm transition-opacity duration-300"></div>
              <div className="relative w-full h-full bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-neutral-300/30 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </div>
          </button>

          <button
            onClick={handleNext}
            disabled={isAnimating}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 group disabled:opacity-50 disabled:cursor-not-allowed z-40"
          >
            <div className="relative w-12 h-12 md:w-14 md:h-14">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full opacity-10 group-hover:opacity-40 blur-sm transition-opacity duration-300"></div>
              <div className="relative w-full h-full bg-neutral-900/80 backdrop-blur-xl border border-neutral-700/50 rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                <svg className="w-6 h-6 text-neutral-300/30 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>

          {/* Cards Container */}
          <div className="relative max-w-4xl mx-auto mb-16">
            <div className="relative">
              {teamMembers.map((member, index) => {
                const isActive = index === currentIndex;
                const isPrev = index === (currentIndex - 1 + teamMembers.length) % teamMembers.length;
                const isNext = index === (currentIndex + 1) % teamMembers.length;

                let position = 'hidden';
                let opacity = 0;
                let scale = 0.8;
                let zIndex = 0;

                if (isActive) {
                  position = 'center';
                  opacity = 1;
                  scale = 1;
                  zIndex = 20;
                } else if (isPrev) {
                  position = 'left';
                  opacity = 0.2;
                  scale = 0.9;
                  zIndex = 10;
                } else if (isNext) {
                  position = 'right';
                  opacity = 0.2;
                  scale = 0.9;
                  zIndex = 10;
                }

                return (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-700 ease-out ${position === 'hidden' ? 'pointer-events-none' : ''}`}
                    style={{
                      opacity,
                      transform: `scale(${scale}) ${
                        position === 'left' ? 'translateX(-100%)' :
                        position === 'right' ? 'translateX(100%)' :
                        'translateX(0)'
                      }`,
                      zIndex,
                    }}
                  >
                  {/* Card with Advanced Glassmorphism */}
                  <div className="relative group">
                    {/* Glow Effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-3xl blur-xl opacity-0 group-hover:opacity-15 transition-opacity duration-700"></div>

                    {/* Main Card */}
                    <div className="relative bg-neutral-900/70 backdrop-blur-2xl rounded-3xl overflow-hidden border border-neutral-700/50 shadow-2xl">
                      <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8 p-8 md:p-10">
                        {/* Image with Advanced Effects */}
                        <div className="relative flex-shrink-0 group/image">
                          <div className="relative w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56">
                            {/* Animated gradient border */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-primary via-purple-500 to-pink-500 rounded-full opacity-30 blur-md group-hover/image:blur-lg group-hover/image:opacity-50 transition-all duration-500"></div>

                            {/* Image container */}
                            <div className="relative w-full h-full rounded-full overflow-hidden ring-4 ring-neutral-800/50">
                              <img
                                src={member.image}
                                alt={member.name}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover/image:scale-110"
                              />

                              {/* Gradient overlay on hover */}
                              <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-500"></div>
                            </div>

                            {/* Floating particles effect */}
                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-2xl animate-pulse"></div>
                            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-pink-500/20 to-primary/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                          </div>
                        </div>

                        {/* Content with Fade In Animation */}
                        <div className="flex-1 text-center sm:text-left space-y-3">
                          <div className="space-y-2">
                            <h3 className="text-2xl md:text-3xl font-bold">
                              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-white">
                                {member.name}
                              </span>
                            </h3>

                            <p className="text-base md:text-lg font-semibold">
                              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-500 to-pink-500">
                                {member.role}
                              </span>
                            </p>
                          </div>

                          <p className="text-sm md:text-base text-neutral-300 leading-relaxed max-w-lg">
                            {member.description}
                          </p>

                          {/* Social Icon with Gradient */}
                          <div className="flex gap-3 justify-center sm:justify-start pt-2">
                            <button className="relative group/btn w-10 h-10 rounded-xl overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 opacity-10 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                              <div className="relative w-full h-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-neutral-300 group-hover/btn:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Decorative gradient line at bottom */}
                      <div className="h-1 bg-gradient-to-r from-primary/60 via-purple-500/60 to-pink-500/60"></div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Spacer for absolute positioned cards */}
            <div className="h-[420px] sm:h-[340px] md:h-[360px]"></div>
          </div>
        </div>
      </div>

      {/* Dots Indicator - Completely outside carousel wrapper */}
      <div className="flex justify-center gap-2 mt-8">
          {teamMembers.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              disabled={isAnimating}
              className={`relative transition-all duration-500 rounded-full overflow-hidden ${
                index === currentIndex ? 'w-12' : 'w-3'
              } h-3`}
            >
              {index === currentIndex ? (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-purple-500/80 to-pink-500/80 animate-gradient-x"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/40 via-purple-500/40 to-pink-500/40 blur-sm"></div>
                </>
              ) : (
                <div className="absolute inset-0 bg-neutral-700 hover:bg-gradient-to-r hover:from-primary/30 hover:to-purple-500/30 transition-all duration-300"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }

        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </section>
  );
};
