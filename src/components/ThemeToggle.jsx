import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn flex items-center justify-center w-9 h-9 rounded-full border transition-all"
      style={{
        background: isLight ? 'rgba(240,235,249,0.9)' : 'rgba(31,16,38,0.6)',
        borderColor: isLight ? 'rgba(123,47,190,0.3)' : 'rgba(240,230,255,0.15)',
      }}
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {isLight
        ? <Moon className="w-4 h-4 text-[#7B2FBE]" />
        : <Sun className="w-4 h-4 text-[#F5A800]" />}
    </button>
  );
}