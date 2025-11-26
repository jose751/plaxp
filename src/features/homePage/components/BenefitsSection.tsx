import React from 'react';
import { useInView } from 'react-intersection-observer';

export const BenefitsSection: React.FC = () => {
  const { ref: headerRef, inView: headerInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const { ref: cardsRef, inView: cardsInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const benefits = [
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      ),
      title: 'Confiabilidad y Seguridad',
      description: 'Tu información siempre protegida con seguridad empresarial, respaldos automáticos y rendimiento sólido.'
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
        </svg>
      ),
      title: 'Productividad y Fluidez',
      description: 'Una plataforma moderna, rápida e intuitiva diseñada para trabajar sin fricción en múltiples sedes.'
    },
    {
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
        </svg>
      ),
      title: 'Inteligencia y Conectividad',
      description: 'Toma mejores decisiones con análisis en tiempo real e integra tus herramientas favoritas.'
    }
  ];

  return (
    <section id="beneficios" className="section-padding bg-[#000000] scroll-mt-16 relative overflow-hidden">
      {/* Background decorative elements - Optimized */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-glow-soft will-change-transform" />
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-glow-soft will-change-transform" style={{ animationDelay: '3s' }} />
      </div>

      <div className="container-custom px-4 sm:px-6 relative">
        {/* Section Header */}
        <div
          ref={headerRef}
          className="max-w-3xl mx-auto text-center mb-16 md:mb-20"
        >
          <h2
            className={`text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-5 md:mb-6 tracking-tight transition-all duration-1000 ${
              headerInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            ¿Por qué elegir{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
              Plaxp
            </span>
            ?
          </h2>
          <p
            className={`text-lg sm:text-xl text-neutral-400 leading-relaxed transition-all duration-1000 ${
              headerInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
            style={{
              transitionDelay: '150ms',
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            Una plataforma diseñada para instituciones modernas
          </p>
        </div>

        {/* Benefits Grid */}
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group relative will-change-transform"
              style={{
                transition: 'opacity 800ms cubic-bezier(0.16, 1, 0.3, 1), transform 800ms cubic-bezier(0.16, 1, 0.3, 1)',
                transitionDelay: `${index * 150}ms`,
                opacity: cardsInView ? 1 : 0,
                transform: cardsInView
                  ? 'translateY(0) scale(1)'
                  : 'translateY(40px) scale(0.95)',
              }}
            >
              {/* Glow background effect - Optimized */}
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 will-change-opacity" />

              {/* Card */}
              <div className="relative h-full bg-gradient-to-br from-neutral-800/60 via-neutral-800/40 to-neutral-900/60 backdrop-blur-xl rounded-2xl p-8 border border-neutral-700/50 group-hover:border-primary/50 transition-all duration-500 shadow-xl shadow-black/20 group-hover:shadow-2xl group-hover:shadow-primary/10 group-hover:-translate-y-2">
                {/* Inner glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/0 via-transparent to-purple-500/0 group-hover:from-primary/10 group-hover:to-purple-500/10 transition-all duration-500" />

                {/* Shine effect on hover - Optimized */}
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                  {/* Moving shine */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>

                {/* Content */}
                <div className="relative space-y-5">
                  {/* Icon */}
                  <div className="relative inline-flex">
                    <div className="absolute inset-0 bg-primary/20 rounded-xl blur-lg group-hover:bg-primary/30 transition-all duration-500 group-hover:scale-110" />
                    <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-purple-600/20 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 group-hover:border-primary/40 group-hover:from-primary/30 group-hover:to-purple-600/30 transition-all duration-500 shadow-lg shadow-primary/10">
                      {benefit.icon}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl md:text-2xl font-bold text-white leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-neutral-300 transition-all duration-300">
                    {benefit.title}
                  </h3>

                  {/* Description */}
                  <p className="text-base text-neutral-400 leading-relaxed group-hover:text-neutral-300 transition-colors duration-300">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
