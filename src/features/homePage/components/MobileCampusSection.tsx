import React from 'react';
import { useInView } from 'react-intersection-observer';

export const MobileCampusSection: React.FC = () => {
  const { ref: sectionRef, inView: sectionInView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
  });

  const { ref: imageRef, inView: imageInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const steps = [
    {
      number: '1.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Optimizado para iOS y Android'
    },
    {
      number: '2.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: 'Materiales claros y actividades interactivas'
    },
    {
      number: '3.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Aprende en cualquier momento y lugar'
    }
  ];

  return (
    <section className="section-padding bg-[#111111] px-4 sm:px-6 lg:px-12 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[150px] animate-glow-soft will-change-transform" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-purple-500/3 rounded-full blur-[120px] animate-glow-soft will-change-transform" style={{ animationDelay: '3s' }} />
      </div>

      <div className="w-full relative z-10">
        <div ref={sectionRef} className="max-w-[1400px] mx-auto">
          {/* Grid Layout */}
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16 items-center">
            {/* Content */}
            <div className="space-y-8">
              {/* Title */}
              <div>
                <h2
                  className={`text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-6 leading-tight transition-all duration-1000 ${
                    sectionInView
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  Campus{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
                    Virtual
                  </span>
                </h2>
                <p
                  className={`text-base sm:text-lg text-neutral-600 dark:text-neutral-300 leading-relaxed transition-all duration-1000 ${
                    sectionInView
                      ? 'opacity-100 translate-y-0'
                      : 'opacity-0 translate-y-8'
                  }`}
                  style={{
                    transitionDelay: '150ms',
                    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                >
                  Lleva tu aprendizaje a donde estés. Nuestra plataforma ofrece contenido dinámico,
                  accesible y optimizado para dispositivos iOS y Android. Aprende de forma flexible,
                  con materiales claros, actividades interactivas y módulos diseñados para estudiar
                  en cualquier momento y lugar.
                </p>
              </div>

              {/* Steps */}
              <div className="hidden md:grid md:grid-cols-3 gap-4">
                {steps.map((step, index) => (
                  <div
                    key={index}
                    className={`group bg-primary/5 dark:bg-primary/10 rounded-2xl p-6 transition-all duration-700 hover:bg-primary/10 dark:hover:bg-primary/20 hover:-translate-y-1 ${
                      sectionInView
                        ? 'opacity-100 translate-y-0 scale-100'
                        : 'opacity-0 translate-y-8 scale-95'
                    }`}
                    style={{
                      transitionDelay: `${300 + index * 100}ms`,
                      transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  >
                    <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-xl mb-4 text-white transition-transform duration-300 group-hover:scale-110">
                      {step.icon}
                    </div>
                    <p className="text-sm font-bold text-neutral-900 dark:text-white">
                      <span className="text-primary">{step.number}</span> {step.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Mockup Image */}
            <div
              ref={imageRef}
              className={`relative lg:order-last transition-all duration-1000 ${
                imageInView
                  ? 'opacity-100 translate-x-0 scale-100'
                  : 'opacity-0 translate-x-12 scale-95'
              }`}
              style={{
                transitionDelay: '200ms',
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div className="relative">
                {/* Glow effect behind image */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20 rounded-full blur-3xl opacity-50 animate-glow-soft will-change-transform" />

                {/* Image Container with Float Animation */}
                <div className="relative animate-float-slow will-change-transform">
                  <img
                    src="home-page/mockup-moodle.png"
                    alt="Campus Virtual Móvil - Mockup"
                    className="w-full h-auto max-w-xlg mx-auto drop-shadow-2xl transition-transform duration-700 hover:scale-[1.02]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
