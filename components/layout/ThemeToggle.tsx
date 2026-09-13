'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  if (!mounted) return (
    <button style={{ width: '100%', height: '36px', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: '8px' }} />
  );

  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 0.75rem',
        borderRadius: '8px',
        fontSize: '0.8125rem',
        fontWeight: 500,
        cursor: 'pointer',
        color: 'var(--text-secondary)',
        background: 'transparent',
        border: '1px solid var(--border-default)',
        transition: 'all 0.2s',
      }}
      title="Toggle Theme"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {isDark
          ? <Moon size={14} style={{ color: '#818cf8' }} />
          : <Sun size={14} style={{ color: '#f59e0b' }} />
        }
        <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
      </div>
      {/* Toggle pill */}
      <div style={{
        width: '30px', height: '16px', borderRadius: '99px', position: 'relative',
        background: isDark ? 'var(--accent-primary)' : '#cbd5e1',
        transition: 'background 0.3s',
        flexShrink: 0,
      }}>
        <div style={{
          position: 'absolute', top: '2px', left: '2px',
          width: '12px', height: '12px', borderRadius: '50%',
          background: '#fff',
          transform: isDark ? 'translateX(14px)' : 'translateX(0)',
          transition: 'transform 0.3s',
        }} />
      </div>
    </button>
  );
}
