import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type IntroContextValue = {
  introDone: boolean;
  setIntroDone: (done: boolean) => void;
};

const IntroContext = createContext<IntroContextValue | null>(null);

export function IntroProvider({ children }: { children: ReactNode }) {
  const [introDone, setIntroDone] = useState(
    () => document.documentElement.dataset.klbRevealed === '1',
  );

  useEffect(() => {
    const reveal = (): void => setIntroDone(true);
    window.addEventListener('klb:revealed', reveal);
    if (document.documentElement.dataset.klbRevealed === '1') {
      reveal();
    }
    return () => window.removeEventListener('klb:revealed', reveal);
  }, []);

  return (
    <IntroContext.Provider value={{ introDone, setIntroDone }}>
      {children}
    </IntroContext.Provider>
  );
}

export function useIntro(): IntroContextValue {
  const context = useContext(IntroContext);
  if (!context) {
    throw new Error('useIntro doit être utilisé dans IntroProvider.');
  }
  return context;
}
