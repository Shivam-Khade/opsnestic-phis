'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...classes: (string | undefined | null | false)[]) {
  return twMerge(clsx(classes));
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="w-full flex items-center gap-3 py-2 px-3 rounded-xl text-sm font-medium text-slate-600 bg-transparent border border-transparent">
        <div className="w-4 h-4" />
        <span>Loading Theme...</span>
      </button>
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className={cn(
        "w-full flex items-center justify-between py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 group border",
        isDark 
          ? "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white" 
          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900"
      )}
      title="Toggle Theme"
    >
      <div className="flex items-center gap-3">
        {isDark ? (
          <Moon className="w-4 h-4 group-hover:text-violet-400 transition-colors" />
        ) : (
          <Sun className="w-4 h-4 group-hover:text-amber-500 transition-colors" />
        )}
        <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
      </div>
      <div className={cn(
        "w-8 h-4 rounded-full relative transition-colors duration-300",
        isDark ? "bg-violet-600" : "bg-slate-300"
      )}>
        <div className={cn(
          "absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-300",
          isDark ? "translate-x-4" : "translate-x-0"
        )} />
      </div>
    </button>
  );
}
