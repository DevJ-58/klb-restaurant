import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/ThemeProvider';

export function ThemeToggle() {
  const { enabled, resolvedTheme, setTheme } = useTheme();

  if (!enabled) {
    return null;
  }

  const isLight = resolvedTheme === 'light';

  return (
    <button
      type="button"
      className="theme-toggle"
      role="switch"
      aria-label="Mode clair"
      aria-checked={isLight}
      onClick={() => setTheme(isLight ? 'dark' : 'light')}
    >
      <span className="theme-toggle__track" aria-hidden="true">
        <Sun className="theme-toggle__icon theme-toggle__sun" />
        <Moon className="theme-toggle__icon theme-toggle__moon" />
      </span>
    </button>
  );
}
