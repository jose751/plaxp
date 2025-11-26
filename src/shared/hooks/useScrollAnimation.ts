import { useEffect, useRef, useState, useCallback } from 'react';

interface ScrollAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

interface ScrollAnimationReturn {
  ref: React.RefObject<HTMLElement | null>;
  isVisible: boolean;
  hasAnimated: boolean;
}

/**
 * Hook optimizado para animaciones basadas en scroll usando Intersection Observer
 * Diseñado para rendimiento óptimo con will-change y requestAnimationFrame
 */
export const useScrollAnimation = (
  options: ScrollAnimationOptions = {}
): ScrollAnimationReturn => {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -50px 0px',
    triggerOnce = true,
    delay = 0,
  } = options;

  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            requestAnimationFrame(() => {
              setTimeout(() => {
                setIsVisible(true);
                setHasAnimated(true);
              }, delay);
            });
          } else {
            requestAnimationFrame(() => {
              setIsVisible(true);
              setHasAnimated(true);
            });
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      });
    },
    [delay, triggerOnce]
  );

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection, threshold, rootMargin]);

  return { ref, isVisible, hasAnimated };
};

interface StaggerAnimationOptions {
  threshold?: number;
  rootMargin?: string;
  staggerDelay?: number;
  baseDelay?: number;
}

interface StaggerAnimationReturn {
  containerRef: React.RefObject<HTMLElement | null>;
  isVisible: boolean;
  getItemDelay: (index: number) => number;
  getItemStyle: (index: number) => React.CSSProperties;
}

/**
 * Hook para animaciones staggered (escalonadas) de múltiples elementos
 */
export const useStaggerAnimation = (
  _itemCount: number,
  options: StaggerAnimationOptions = {}
): StaggerAnimationReturn => {
  const {
    threshold = 0.1,
    rootMargin = '0px 0px -30px 0px',
    staggerDelay = 100,
    baseDelay = 0,
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            requestAnimationFrame(() => {
              setIsVisible(true);
            });
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const getItemDelay = useCallback(
    (index: number) => baseDelay + index * staggerDelay,
    [baseDelay, staggerDelay]
  );

  const getItemStyle = useCallback(
    (index: number): React.CSSProperties => ({
      transitionDelay: `${getItemDelay(index)}ms`,
      opacity: isVisible ? 1 : 0,
      transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
    }),
    [isVisible, getItemDelay]
  );

  return { containerRef, isVisible, getItemDelay, getItemStyle };
};

interface CounterAnimationOptions {
  duration?: number;
  easing?: (t: number) => number;
}

/**
 * Hook para animar números con contador
 */
export const useCounterAnimation = (
  targetValue: number,
  isActive: boolean,
  options: CounterAnimationOptions = {}
): number => {
  const { duration = 2000, easing = easeOutExpo } = options;
  const [currentValue, setCurrentValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setCurrentValue(0);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easing(progress);

      setCurrentValue(Math.round(targetValue * easedProgress));

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      startTimeRef.current = null;
    };
  }, [isActive, targetValue, duration, easing]);

  return currentValue;
};

// Funciones de easing optimizadas
export const easeOutExpo = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};

export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

interface ParallaxOptions {
  speed?: number;
  direction?: 'up' | 'down';
}

/**
 * Hook para efecto parallax suave y optimizado
 */
export const useParallax = (options: ParallaxOptions = {}): React.CSSProperties => {
  const { speed = 0.5, direction = 'up' } = options;
  const [offset, setOffset] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const multiplier = direction === 'up' ? -1 : 1;
        setOffset(scrollY * speed * multiplier);
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [speed, direction]);

  return {
    transform: `translateY(${offset}px)`,
    willChange: 'transform',
  };
};
