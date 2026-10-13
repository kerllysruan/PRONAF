import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { ProjetoA2, createInitialProjetoA2 } from './types';

interface PronafA2ContextType {
  projeto: ProjetoA2;
  updateTab: <T extends keyof ProjetoA2>(tab: T, data: Partial<ProjetoA2[T]>) => void;
  replaceProjeto: (novo: ProjetoA2) => void;
  clearProjeto: () => Promise<void>;
  loading: boolean;
}

const PronafA2Context = createContext<PronafA2ContextType | undefined>(undefined);

const DB_NAME = 'pronaf-a2-store';
const STORE_NAME = 'projeto';
const DB_VERSION = 1;
const RECORD_KEY = 'current_projeto';
const DEBOUNCE_MS = 500;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste ambiente'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function loadFromIndexedDB(): Promise<ProjetoA2 | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(RECORD_KEY);

      request.onsuccess = () => {
        resolve(request.result ? (request.result as ProjetoA2) : null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

async function saveToIndexedDB(projeto: ProjetoA2): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(projeto, RECORD_KEY);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch {
    // Falha silenciosa para conformidade LGPD sem expor dados no console
  }
}

async function clearFromIndexedDB(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(RECORD_KEY);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch {
    // Falha silenciosa
  }
}

export const PronafA2Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projeto, setProjeto] = useState<ProjetoA2>(createInitialProjetoA2);
  const [loading, setLoading] = useState<boolean>(true);
  const isInitialMount = useRef<boolean>(true);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Carrega do IndexedDB na montagem
  useEffect(() => {
    let mounted = true;

    async function init() {
      const savedData = await loadFromIndexedDB();
      if (mounted) {
        if (savedData) {
          const initial = createInitialProjetoA2();
          setProjeto({
            Cliente: { ...initial.Cliente, ...(savedData.Cliente || {}) },
            'Avaliação': { ...initial['Avaliação'], ...(savedData['Avaliação'] || {}) },
            ' Proposta': { ...initial[' Proposta'], ...(savedData[' Proposta'] || {}) },
            Cronograma: { ...initial.Cronograma, ...(savedData.Cronograma || {}) },
            'Ativ. Agrícola': { ...initial['Ativ. Agrícola'], ...(savedData['Ativ. Agrícola'] || {}) },
            'Ativ. Pecuária': { ...initial['Ativ. Pecuária'], ...(savedData['Ativ. Pecuária'] || {}) },
            'Outras Ativ': { ...initial['Outras Ativ'], ...(savedData['Outras Ativ'] || {}) },
            CalculoFinanceiro: { ...initial.CalculoFinanceiro, ...(savedData.CalculoFinanceiro || {}) }
          });
        }
        setLoading(false);
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  // Salva automaticamente no IndexedDB com debounce de 500ms
  useEffect(() => {
    if (loading || isInitialMount.current) {
      if (!loading) {
        isInitialMount.current = false;
      }
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      saveToIndexedDB(projeto);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [projeto, loading]);

  const updateTab = useCallback(<T extends keyof ProjetoA2>(tab: T, data: Partial<ProjetoA2[T]>) => {
    setProjeto((prev) => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        ...data
      }
    }));
  }, []);

  const replaceProjeto = useCallback((novo: ProjetoA2) => {
    setProjeto(novo);
    saveToIndexedDB(novo);
  }, []);

  const clearProjeto = useCallback(async () => {
    await clearFromIndexedDB();
    setProjeto(createInitialProjetoA2());
  }, []);

  return React.createElement(
    PronafA2Context.Provider,
    { value: { projeto, updateTab, replaceProjeto, clearProjeto, loading } },
    children
  );
};

export function usePronafA2(): PronafA2ContextType {
  const context = useContext(PronafA2Context);
  if (!context) {
    throw new Error('usePronafA2 deve ser utilizado dentro de um PronafA2Provider');
  }
  return context;
}
