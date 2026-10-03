import { useState, useEffect, useCallback } from 'react';
import { STORAGE_KEYS } from '@/lib/constants';

export interface Prefs {
  version: number;
  toiView: 'list' | 'sky';
}

const DEFAULT_PREFS: Prefs = {
  version: 1,
  toiView: 'list',
};

function readPrefs(): Prefs {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFS);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    // Validate version and properties
    if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.version === 1 &&
      (parsed.toiView === 'list' || parsed.toiView === 'sky')
    ) {
      return parsed as Prefs;
    }
    // Corrupt or unrecognized version: reset to default
    localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(DEFAULT_PREFS));
    return DEFAULT_PREFS;
  } catch {
    // If parse fails or localStorage throws, return default and attempt reset
    try {
      localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(DEFAULT_PREFS));
    } catch {
      // ignore
    }
    return DEFAULT_PREFS;
  }
}

export function usePrefs() {
  const [prefs, setPrefs] = useState<Prefs>(readPrefs);

  useEffect(() => {
    // Sync with current storage on mount
    setPrefs(readPrefs());

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.PREFS) {
        setPrefs(readPrefs());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const updatePrefs = useCallback((updates: Partial<Omit<Prefs, 'version'>>) => {
    setPrefs((current) => {
      const next: Prefs = {
        ...current,
        ...updates,
        version: DEFAULT_PREFS.version,
      };
      try {
        localStorage.setItem(STORAGE_KEYS.PREFS, JSON.stringify(next));
      } catch (err) {
        console.error('Failed to save prefs to localStorage:', err);
      }
      return next;
    });
  }, []);

  return { prefs, updatePrefs };
}

export default usePrefs;
