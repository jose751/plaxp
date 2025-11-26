import React from 'react';
import { useInView } from 'react-intersection-observer';

interface FeatureItemProps {
  src: string;
  alt: string;
  title: string;
  highlightedWord: string;
  description: string;
  imagePosition: 'left' | 'right';
  fadeEdges?: boolean;
}

const FeatureItem: React.FC<FeatureItemProps> = ({
  src,
  alt,
  title,
  highlightedWord,
  description,
  imagePosition,
  fadeEdges = true,
}) => {
  const { ref: itemRef, inView: itemInView } = useInView({
    triggerOnce: true,
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px',
  });

  const { ref: imageRef, inView: imageInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <div
      ref={itemRef}
      className={`grid lg:grid-cols-2 gap-8 md:gap-16 items-center ${
        imagePosition === 'right' ? 'lg:grid-flow-dense' : ''
      }`}
    >
      {/* Image */}
      <div
        ref={imageRef}
        className={`relative order-2 lg:order-none ${
          imagePosition === 'right' ? 'lg:col-start-2' : ''
        }`}
      >
        {!imageInView ? (
          // Skeleton loader with shimmer
          <div className="w-full aspect-[4/3] bg-neutral-800/50 rounded-2xl overflow-hidden">
            <div className="w-full h-full animate-shimmer" />
          </div>
        ) : (
          <div
            className={`relative transition-all duration-1000 ${
              itemInView
                ? 'opacity-100 translate-x-0 scale-100'
                : imagePosition === 'left'
                ? 'opacity-0 -translate-x-12 scale-95'
                : 'opacity-0 translate-x-12 scale-95'
            }`}
            style={{
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              transitionDelay: '200ms',
            }}
          >
            <img
              src={src}
              alt={alt}
              loading="lazy"
              decoding="async"
              className="w-full h-auto transition-all duration-700 hover:scale-[1.02]"
              style={{ opacity: 1 }}
            />
            {fadeEdges && (
              <>
                {/* Gradiente superior */}
                <div className="absolute top-0 left-0 right-0 h-16 md:h-32 bg-gradient-to-b from-neutral-950/60 md:from-neutral-950 to-transparent pointer-events-none" />
                {/* Gradiente inferior */}
                <div className="absolute bottom-0 left-0 right-0 h-16 md:h-32 bg-gradient-to-t from-neutral-950/60 md:from-neutral-950 to-transparent pointer-events-none" />
                {/* Gradiente izquierdo */}
                <div className="absolute top-0 bottom-0 left-0 w-12 md:w-32 bg-gradient-to-r from-neutral-950/60 md:from-neutral-950 to-transparent pointer-events-none" />
                {/* Gradiente derecho */}
                <div className="absolute top-0 bottom-0 right-0 w-12 md:w-32 bg-gradient-to-l from-neutral-950/60 md:from-neutral-950 to-transparent pointer-events-none" />
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div
        className={`space-y-6 order-1 lg:order-none ${
          imagePosition === 'right' ? 'lg:col-start-1 lg:row-start-1 text-left' : 'text-right'
        }`}
      >
        <h3
          className={`text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight transition-all duration-1000 ${
            itemInView
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}
          style={{
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: '100ms',
          }}
        >
          {title}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 inline-block">
            {highlightedWord}
          </span>
        </h3>
        <p
          className={`text-base sm:text-lg md:text-xl text-neutral-300 leading-relaxed transition-all duration-1000 ${
            itemInView
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}
          style={{
            transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            transitionDelay: '250ms',
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
};

export const ShowcaseSection: React.FC = () => {
  const { ref: headerRef, inView: headerInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const features = [
    {
      src: '/home-page/estadisticas.png',
      alt: 'Estadísticas y Análisis',
      title: 'Analiza y controla las',
      highlightedWord: 'estadísticas',
      description: 'Utiliza las estadísticas para analizar el desempeño de tu equipo, estudiar la mejor estrategia y mantener el control de todas las comunicaciones',
      imagePosition: 'left' as const,
      fadeEdges: true
    },
    {
      src: '/home-page/pagos.png',
      alt: 'Gestión de Pagos',
      title: 'Gestiona los pagos de manera',
      highlightedWord: 'eficiente',
      description: 'Controla todos los pagos de tu institución en un solo lugar. Genera reportes, envía recordatorios automáticos y mantén un registro completo de transacciones',
      imagePosition: 'right' as const,
      fadeEdges: true
    },
    {
      src: '/home-page/modulos-centralizados.jpg',
      alt: 'Módulos Centralizados',
      title: 'Todos tus módulos',
      highlightedWord: 'centralizados',
      description: 'Accede a todas las funcionalidades de tu institución desde un solo lugar. Gestiona estudiantes, profesores, cursos, pagos y más desde una plataforma unificada',
      imagePosition: 'left' as const,
      fadeEdges: true
    }
  ];

  return (
    <section className="section-padding bg-neutral-950 scroll-mt-16 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[200px] animate-glow-soft will-change-transform" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-purple-500/3 rounded-full blur-[180px] animate-glow-soft will-change-transform" style={{ animationDelay: '4s' }} />
      </div>

      <div className="container-custom px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div
          ref={headerRef}
          className="max-w-3xl mx-auto text-center mb-20 sm:mb-24 md:mb-32"
        >
          <h2
            className={`text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6 transition-all duration-1000 ${
              headerInView
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            Descubre cómo{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
              Plaxp{' '}
            </span>
            potencia tu institución
          </h2>
        </div>

        {/* Features */}
        <div className="space-y-20 md:space-y-32 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <FeatureItem
              key={index}
              {...feature}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
