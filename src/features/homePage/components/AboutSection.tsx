import React, { useEffect, useState, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface AnimatedCounterProps {
  value: string;
  isActive: boolean;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, isActive }) => {
  const [displayValue, setDisplayValue] = useState('0');
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isActive || hasAnimated.current) return;
    hasAnimated.current = true;

    // Extract numeric part and suffix
    const numericMatch = value.match(/^(\d+)/);
    const suffix = value.replace(/^\d+/, '');

    if (!numericMatch) {
      setDisplayValue(value);
      return;
    }

    const targetNumber = parseInt(numericMatch[1], 10);
    const duration = 2000;
    const startTime = performance.now();

    const easeOutExpo = (t: number): number => {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutExpo(progress);
      const currentNumber = Math.round(targetNumber * easedProgress);

      setDisplayValue(`${currentNumber}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isActive, value]);

  return <span>{displayValue}</span>;
};

export const AboutSection: React.FC = () => {
  const { ref: sectionRef, inView: sectionInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const { ref: statsRef, inView: statsInView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  const stats = [
    { value: '10x', label: 'Más rápido' },
    { value: '100%', label: 'Seguro' },
    { value: '24/7', label: 'Disponible' }
  ];

  return (
    <section
      id="caracteristicas"
      className="section-padding bg-[#121212] scroll-mt-16 px-4 sm:px-6 lg:px-20 relative overflow-hidden"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/3 rounded-full blur-[150px] animate-glow-soft" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500/3 rounded-full blur-[120px] animate-glow-soft" style={{ animationDelay: '3s' }} />
      </div>

      <div className="container-custom px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div
          ref={sectionRef}
          className={`max-w-3xl mx-auto text-center mb-12 transition-all duration-1000 ${
            sectionInView
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}
          style={{
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
            <span
              className={`inline-block transition-all duration-700 ${
                sectionInView
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '100ms' }}
            >
              La plataforma que{' '}
            </span>
            <span
              className={`text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 inline-block transition-all duration-700 ${
                sectionInView
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '200ms' }}
            >
              transforma
            </span>
            <span
              className={`inline-block transition-all duration-700 ${
                sectionInView
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: '300ms' }}
            >
              {' '}tu institución
            </span>
          </h2>
          <p
            className={`text-base sm:text-lg md:text-xl text-neutral-400 leading-relaxed transition-all duration-700 ${
              sectionInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: '400ms' }}
          >
            Centraliza tu gestión académica, administrativa y financiera en un solo lugar.
            Elimina hojas de cálculo y procesos manuales.
          </p>
        </div>

        {/* Stats Grid */}
        <div ref={statsRef} className="grid grid-cols-3 gap-4 md:gap-8 max-w-3xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`text-center group transition-all duration-700 ${
                statsInView
                  ? 'opacity-100 translate-y-0 scale-100'
                  : 'opacity-0 translate-y-8 scale-95'
              }`}
              style={{
                transitionDelay: `${index * 150 + 200}ms`,
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              {/* Value with counter animation */}
              <div className="relative">
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-purple-500/0 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 mb-2 relative transition-transform duration-300 group-hover:scale-105">
                  <AnimatedCounter value={stat.value} isActive={statsInView} />
                </div>
              </div>

              <p className="text-xs sm:text-sm md:text-base text-neutral-400 transition-colors duration-300 group-hover:text-neutral-300">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
