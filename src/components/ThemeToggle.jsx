import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center w-9 h-9 rounded-full border border-[rgba(240,230,255,0.15)] hover:border-[rgba(245,168,0,0.4)] transition-all"
      style={{ background: 'rgba(31,16,38,0.6)' }}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark'
        ? <Sun className="w-4 h-4 text-[#F5A800]" />
        : <Moon className="w-4 h-4 text-[#7B2FBE]" />}
    </button>
  );
}