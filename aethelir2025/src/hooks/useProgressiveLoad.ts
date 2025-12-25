import { useEffect, useRef, useState, RefObject } from 'react';

interface UseProgressiveLoadOptions {
  threshold?: number;
  rootMargin?: string;
  enabled?: boolean;
}

/**
 * Hook для прогрессивной загрузки тяжелых элементов
 * Использует Intersection Observer для загрузки только видимых элементов
 */
export const useProgressiveLoad = <T extends HTMLElement = HTMLDivElement>(
  options: UseProgressiveLoadOptions = {}
): [RefObject<T>, boolean] => {
  const { threshold = 0.1, rootMargin = '50px', enabled = true } = options;
  const [isVisible, setIsVisible] = useState(!enabled); // Если disabled, сразу видим
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(true);
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Отключаем observer после первого появления
            observer.unobserve(element);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [enabled, threshold, rootMargin]);

  return [elementRef, isVisible];
};
