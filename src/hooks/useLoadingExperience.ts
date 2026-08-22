import { useState, useCallback } from 'react';

export type LoadingState = 'intro' | 'loading' | 'complete' | 'done';

export interface UseLoadingExperienceReturn {
  progress: number;
  setProgress: (val: number) => void;
  state: LoadingState;
  setState: (state: LoadingState) => void;
  currentMilestone: string;
  updateMilestone: (progress: number) => void;
  reset: () => void;
}

export function useLoadingExperience(onComplete?: () => void): UseLoadingExperienceReturn {
  const [progress, setProgressState] = useState<number>(0);
  const [state, setState] = useState<LoadingState>('intro');
  const [currentMilestone, setCurrentMilestone] = useState<string>('O CAMPO DESPERTA');

  const updateMilestone = useCallback((prog: number) => {
    if (prog < 20) {
      setCurrentMilestone('O AMANHECER NO CAMPO');
    } else if (prog < 40) {
      setCurrentMilestone('O PRODUTOR E A TERRA');
    } else if (prog < 60) {
      setCurrentMilestone('A PRODUÇÃO AGRÍCOLA');
    } else if (prog < 80) {
      setCurrentMilestone('INTEGRAÇÃO DE INFORMAÇÕES');
    } else if (prog < 95) {
      setCurrentMilestone('ANÁLISE DE OPORTUNIDADES');
    } else {
      setCurrentMilestone('CRÉDITO RURAL LIBERADO');
    }
  }, []);

  const setProgress = useCallback(
    (val: number) => {
      const clamped = Math.min(100, Math.max(0, Math.round(val)));
      setProgressState(clamped);
      updateMilestone(clamped);
    },
    [updateMilestone]
  );

  const reset = useCallback(() => {
    setProgressState(0);
    setState('intro');
    setCurrentMilestone('O AMANHECER NO CAMPO');
  }, []);

  return {
    progress,
    setProgress,
    state,
    setState,
    currentMilestone,
    updateMilestone,
    reset,
  };
}
