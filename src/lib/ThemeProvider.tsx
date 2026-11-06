import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type ThemeMode = 'dark' | 'light';
export type ThemePreference = ThemeMode | 'system';

type ThemeContextValue = {
  enabled: boolean;
  theme: ThemePreference;
  resolvedTheme: ThemeMode;
  setTheme: (nextTheme: ThemeMode) => void;
};

const STORAGE_KEY = 'klb-theme';
const enabledFlag = import.meta.env.VITE_ENABLE_LIGHT_MODE === 'true';
const defaultPreference = (import.meta.env.VITE_DEFAULT_THEME as ThemePreference | undefined) ?? 'dark';

function getSystemTheme(): ThemeMode {
  if (typeof window === 'undefined' || !('matchMedia' in window)) {
    return 'dark';
  }

  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getSavedTheme(): ThemePreference {
  if (!enabledFlag) {
    return 'dark';
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // Ignore storage access errors and fall back to defaults.
  }

  return defaultPreference === 'system' ? 'system' : defaultPreference === 'light' ? 'light' : 'dark';
}

function applyTheme(theme: ThemeMode): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="theme-color"]') ?? document.createElement('meta');
  meta.setAttribute('name', 'theme-color');
  meta.setAttribute('content', theme === 'light' ? '#fbf6ea' : '#0b0806');
  if (!meta.parentNode) {
    document.head.appendChild(meta);
  }
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>(() => getSavedTheme());
  const enabled = enabledFlag;

  const resolvedTheme = useMemo<ThemeMode>(() => {
    if (!enabled) {
      return 'dark';
    }
    return theme === 'system' ? getSystemTheme() : theme;
  }, [enabled, theme]);

  useEffect(() => {
    if (!enabled) {
      setThemeState('dark');
      applyTheme('dark');
      return;
    }

    const nextTheme = resolvedTheme;
    applyTheme(nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage access errors.
    }
  }, [enabled, resolvedTheme]);

  useEffect(() => {
    if (!enabled || theme !== 'system') {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = (): void => {
      applyTheme(getSystemTheme());
    };
    media.addEventListener?.('change', onChange);
    return () => {
      media.removeEventListener?.('change', onChange);
    };
  }, [enabled, theme]);

  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }
      const nextTheme = event.newValue === 'light' ? 'light' : 'dark';
      if (enabled) {
        setThemeState(nextTheme);
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [enabled]);

  const setTheme = useCallback((nextTheme: ThemeMode): void => {
    if (!enabled) {
      return;
    }

    setThemeState(nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Ignore storage access errors.
    }
  }, [enabled]);

  const value = useMemo<ThemeContextValue>(
    () => ({ enabled, theme, resolvedTheme, setTheme }),
    [enabled, resolvedTheme, setTheme, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider.');
  }
  return value;
}
