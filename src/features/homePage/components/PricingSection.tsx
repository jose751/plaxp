import React from 'react';
import { useInView } from 'react-intersection-observer';

export const PricingSection: React.FC = () => {
  const { ref: headerRef, inView: headerInView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  const { ref: cardsRef, inView: cardsInView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const plans = [
    {
      name: 'Start',
      price: '$35',
      period: 'mes',
      description: 'Para academias pequeñas',
      example: '80 estudiantes = $59/mes',
      features: [
        'Hasta 3 usuarios administrativos',
        '1 sucursal',
        'Gestión de cursos y estudiantes',
        'Gestión de docentes',
        'Facturación y recibos',
        'Control académico',
        'Reportes básicos',
        'Roles y permisos',
        'Soporte por chat'
      ],
      cta: 'Comenzar',
      popular: false
    },
    {
      name: 'Pro',
      price: '$45',
      period: 'mes',
      description: 'La opción más vendida',
      example: '250 estudiantes = $108/mes',
      features: [
        'Hasta 8 usuarios administrativos',
        'Hasta 2 sucursales',
        'Todo del plan Start',
        'Integraciones (GoMeta, Hacienda)',
        'WhatsApp básico',
        'Automatizaciones básicas',
        'Reportes avanzados',
        'API básica',
        'Soporte prioritario'
      ],
      cta: 'Empezar ahora',
      popular: true
    },
    {
      name: 'Business',
      price: '$75',
      period: 'mes',
      description: 'Para academias grandes',
      example: '900 estudiantes = $210/mes',
      features: [
        'Usuarios administrativos ilimitados',
        'Sucursales ilimitadas',
        'Todo del plan Pro',
        'Workflows automatizados',
        'API avanzada + Webhooks',
        'Reportes personalizados',
        'Integración con campus virtual',
        'Soporte prioritario dedicado',
        'Onboarding personalizado'
      ],
      cta: 'Contactar ventas',
      popular: false
    }
  ];

  return (
    <section id="precios" className="section-padding bg-neutral-950 scroll-mt-16 px-4 sm:px-6 lg:px-12">
      <div className="container-custom px-4 sm:px-6">
        {/* Guarantee Banner (Se reduce margen inferior) */}
        <div className="max-w-4xl mx-auto mb-6 md:mb-8 animate-fade-in"> 
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/10 via-purple-600/10 to-primary/10 border border-primary/20 p-5 md:p-6"> {/* Se reduce padding */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-purple-600/5"></div>
            <div className="relative flex flex-col md:flex-row items-center justify-center gap-3 text-center md:text-left"> {/* Se reduce gap */}
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center"> {/* Se reduce tamaño del círculo */}
                  <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-1"> {/* Se reduce tamaño de texto y margen */}
                  Prueba gratis por 2 meses
                </h3>
                <p className="text-sm text-neutral-300"> {/* Se reduce tamaño de texto */}
                  Sin tarjeta de crédito. Sin compromiso. Cancela cuando quieras.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header (Se reduce margen inferior y tamaño de texto) */}
        <div
          ref={headerRef}
          className={`max-w-4xl mx-auto text-center mb-8 md:mb-10 transition-all duration-1000 ${
            headerInView
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-8'
          }`}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3 md:mb-4"> {/* Se reduce tamaño de título y margen */}
            Precios{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">
              transparentes y escalables
            </span>
          </h2>
          <p className="text-base sm:text-lg text-neutral-300 leading-relaxed mb-3"> {/* Se reduce tamaño de texto y margen */}
            Precio base activo. Sin sorpresas, sin costos ocultos.
          </p>
          <p className="text-xs md:text-sm text-neutral-400 mb-4"> {/* Se reduce tamaño de texto y margen */}
            <span className="text-neutral-300">Nota:</span> Campus Virtual (LMS) no incluido. Se cotiza por separado.
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs text-neutral-300"> {/* Se reduce padding y tamaño de texto */}
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Solo pagas por estudiantes activos cada mes
          </div>
        </div>

        {/* Pricing Cards (Se reduce margen superior y espaciado entre cards) */}
        <div ref={cardsRef} className="grid md:grid-cols-3 gap-5 md:gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative transition-all duration-700 ${plan.popular ? 'md:scale-105 md:-mt-3' : ''}`}
              style={{
                transitionDelay: `${index * 150}ms`,
                opacity: cardsInView ? 1 : 0,
                transform: cardsInView
                  ? `translateY(0) ${plan.popular ? 'scale(1.05)' : 'scale(1)'}`
                  : 'translateY(30px) scale(0.95)',
              }}
            >
              {/* Popular Badge (Sin cambios, es compacto) */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-purple-600 text-white text-xs sm:text-sm font-bold shadow-lg">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Más popular
                  </div>
                </div>
              )}

              {/* Card */}
              <div
                className={`relative h-full bg-gradient-to-b from-neutral-900/50 to-neutral-900/30 backdrop-blur-sm rounded-2xl md:rounded-3xl overflow-hidden transition-all duration-500 ${
                  plan.popular
                    ? 'border-2 border-primary shadow-2xl shadow-primary/20'
                    : 'border border-neutral-700/50 hover:border-primary/50'
                }`}
              >
                {/* Glow Effect */}
                {plan.popular && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-600/5 pointer-events-none"></div>
                )}

                <div className="relative z-10 p-5 md:p-6"> {/* Se reduce padding interno */}
                  {/* Plan Name */}
                  <h3 className="text-xl font-bold text-white mb-1.5"> {/* Se reduce tamaño y margen */}
                    {plan.name}
                  </h3>
                  <p className="text-sm text-neutral-400 mb-5"> {/* Se reduce tamaño y margen */}
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-5"> {/* Se reduce margen inferior */}
                    <div className="text-xs text-neutral-400 mb-1">Precio base</div> {/* Se reduce tamaño y margen */}
                    <div className="flex items-baseline gap-1 mb-2"> {/* Se reduce margen inferior */}
                      <span className="text-3xl md:text-4xl font-bold text-white"> {/* Se reduce tamaño de precio */}
                        {plan.price}
                      </span>
                      <span className="text-base md:text-lg text-neutral-400"> {/* Se reduce tamaño de periodo */}
                        /{plan.period}
                      </span>
                    </div>                   
                  </div>

                  {/* Features (Lista de características) */}
                  <ul className="space-y-2 mb-6"> {/* Se reduce espaciado y margen inferior */}
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2"> {/* Se reduce gap */}
                        <svg
                          className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" 
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-sm text-neutral-300"> {/* Se reduce tamaño de texto de característica */}
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <a
                    href="#contacto"
                    className={`block w-full text-center px-5 py-3 rounded-xl font-bold transition-all duration-300 text-sm md:text-base ${ /* Se reduce padding y se asegura tamaño de texto */
                      plan.popular
                        ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg hover:shadow-xl hover:shadow-primary/50 hover:scale-[1.03]' // Se reduce un poco la escala del hover
                        : 'bg-neutral-800 text-white hover:bg-neutral-700 border border-neutral-600 hover:border-primary'
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

       
        {/* Bottom Note - Campus Virtual (Se reduce margen superior y tamaños de texto/padding) */}
        <div className="max-w-3xl mx-auto text-center mt-10 md:mt-12 animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <div className="bg-neutral-900/50 backdrop-blur-sm border border-neutral-700/50 rounded-lg md:rounded-xl p-5 md:p-6"> {/* Se reduce padding y radio */}
            <div className="mb-4"> {/* Se reduce margen */}
              <h3 className="text-base md:text-lg font-bold text-white mb-3"> {/* Se reduce tamaño */}
                Campus Virtual - Integración Separada
              </h3>
              <p className="text-sm text-neutral-300 mb-2"> {/* Se reduce tamaño y margen */}
                El Campus Virtual (LMS) <span className="font-semibold text-white">NO está incluido</span> en los precios mostrados arriba.
              </p>
              <p className="text-xs text-neutral-400 mb-1"> {/* Se reduce tamaño y margen */}
                Compatible con Moodle. Se cotiza por separado según las necesidades de tu institución.
              </p>
              <p className="text-xs text-neutral-500 italic">
                Los precios mostrados son únicamente para el sistema de gestión administrativa y académica.
              </p>
            </div>
            <a
              href="#contacto"
              className="inline-flex items-center gap-1.5 text-primary font-semibold text-sm hover:gap-2 transition-all duration-300" /* Se reduce tamaño de texto y espaciado */
            >
              Solicitar cotización para Campus Virtual
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"> {/* Se reduce tamaño de ícono */}
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};