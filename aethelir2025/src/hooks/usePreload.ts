import { useCallback, useRef } from 'react';

/**
 * Hook для предзагрузки компонентов при наведении
 * Обеспечивает мгновенную загрузку при клике
 */
export const usePreload = () => {
  const preloadedRef = useRef<Set<string>>(new Set());

  const preloadComponent = useCallback((importFn: () => Promise<any>) => {
    // Предзагружаем только один раз
    const key = importFn.toString();
    if (preloadedRef.current.has(key)) {
      return;
    }

    preloadedRef.current.add(key);
    
    // Используем requestIdleCallback для предзагрузки в свободное время
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importFn().catch(() => {
          // Игнорируем ошибки предзагрузки
        });
      });
    } else {
      // Fallback для браузеров без requestIdleCallback
      setTimeout(() => {
        importFn().catch(() => {});
      }, 100);
    }
  }, []);

  return { preloadComponent };
};
