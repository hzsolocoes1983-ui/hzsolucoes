import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} aria-label="Alternar tema">
      {theme === 'dark' ? '🌙 Escuro' : '☀️ Claro'}
    </button>
  );
}