import type { ReactElement } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme, type Theme } from './ThemeContext';

const icons: Record<Theme, ReactElement> = {
  auto:  <Laptop size={22} strokeWidth={2} />,
  light: <Sun    size={22} strokeWidth={2} />,
  dark:  <Moon   size={22} strokeWidth={2} />,
};

const next: Record<Theme, Theme> = { auto: 'light', light: 'dark', dark: 'auto' };

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      className="theme-toggle-btn"
      onClick={() => setTheme(next[theme])}
      aria-label={theme}
    >
      {icons[theme]}
    </button>
  );
}
