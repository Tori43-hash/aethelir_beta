import { useState, useCallback, useRef, useEffect } from 'react';

export type TransitionState = 'idle' | 'entering' | 'exiting';

interface UsePageTransitionOptions {
  duration?: number;
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
}

/**
 * Hook для управления плавными переходами между страницами
 * Обеспечивает сверх быстрые переходы с визуальной плавностью
 * Управляет эффектом размытия при загрузке контента
 */
export const usePageTransition = (options: UsePageTransitionOptions = {}) => {
  const { duration = 200, onTransitionStart, onTransitionEnd } = options;
  const [transitionState, setTransitionState] = useState<TransitionState>('idle');
  const [isBlurActive, setIsBlurActive] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTransition = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    setTransitionState('exiting');
    setIsBlurActive(false);
    onTransitionStart?.();

    // Минимальная задержка для плавности, но быстрая для отзывчивости
    timeoutRef.current = setTimeout(() => {
      setTransitionState('entering');
      // Активируем blur при начале входа на новую страницу
      setIsBlurActive(true);
      
      // Убираем blur после небольшой задержки для плавного эффекта
      blurTimeoutRef.current = setTimeout(() => {
        setIsBlurActive(false);
      }, 100); // Небольшая задержка перед началом удаления blur
      
      timeoutRef.current = setTimeout(() => {
        setTransitionState('idle');
        onTransitionEnd?.();
      }, duration);
    }, 50); // Быстрый выход
  }, [duration, onTransitionStart, onTransitionEnd]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  return { transitionState, startTransition, isBlurActive };
};
