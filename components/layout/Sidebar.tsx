'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, Inbox, History, UserCircle, ShieldCheck,
  Users, FileText, BarChart2, LogOut, Shield, Building, MessageSquareWarning
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

function cn(...classes: (string | undefined | null | false)[]) {
  return twMerge(clsx(classes));
}

interface SidebarProps {
  user: { name?: string | null; email?: string | null; role?: string };
}

const navItems = [
  { href: '/dashboard',        label: 'Dashboard',       icon: LayoutDashboard },
  { href: '/training',         label: 'Training Inbox',  icon: Inbox },
  { href: '/hallucination-chat', label: 'AI Chat Training', icon: MessageSquareWarning },
  { href: '/history',          label: 'History',         icon: History },
  { href: '/profile',          label: 'My Profile',      icon: UserCircle },
];

const adminItems = [
  { href: '/admin',            label: 'Admin Overview',  icon: ShieldCheck },
  { href: '/admin/users',      label: 'Users',           icon: Users },
  { href: '/admin/scenarios',  label: 'Scenarios',       icon: FileText },
  { href: '/admin/domains',    label: 'Company Domains', icon: Building },
  { href: '/admin/analytics',  label: 'Analytics',       icon: BarChart2 },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === 'admin';
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <aside style={{
      width: '256px',
      background: 'var(--bg-glass)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRight: '1px solid var(--border-glass)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
      boxShadow: '4px 0 24px rgba(0,0,0,0.04)',
      transition: 'all 0.3s',
    }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem 1.25rem', borderBottom: '1px solid var(--border-glass)' }}>
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            width: '38px', height: '38px',
            background: 'var(--accent-gradient)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79,70,229,0.4)',
            flexShrink: 0,
          }}>
            <Shield size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            background: 'var(--accent-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
          }}>
            PhishGuard
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {!isAdmin && (
          <>
            <p style={{ padding: '0 0.75rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', marginTop: '0.25rem' }}>
              Main Menu
            </p>
            {navItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 500,
                    textDecoration: 'none',
                    position: 'relative',
                    transition: 'all 0.2s',
                    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    background: active ? 'var(--accent-primary-10)' : 'transparent',
                    border: active ? '1px solid var(--accent-primary-20)' : '1px solid transparent',
                  }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: '3px', height: '20px',
                      background: 'var(--accent-gradient)',
                      borderRadius: '0 3px 3px 0',
                    }} />
                  )}
                  <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}

        {isAdmin && (
          <>
            <p style={{ padding: '0 0.75rem', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Administration
            </p>
            {adminItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '10px',
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 500,
                    textDecoration: 'none',
                    position: 'relative',
                    transition: 'all 0.2s',
                    color: active ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                    background: active ? 'rgba(124,58,237,0.1)' : 'transparent',
                    border: active ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent',
                  }}
                >
                  {active && (
                    <div style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: '3px', height: '20px',
                      background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                      borderRadius: '0 3px 3px 0',
                    }} />
                  )}
                  <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User card + controls */}
      <div style={{
        margin: '0.75rem',
        padding: '1rem',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--border-glass)',
        borderRadius: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.875rem',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 700, color: '#fff',
            flexShrink: 0, boxShadow: '0 2px 8px rgba(79,70,229,0.4)',
          }}>
            {user.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.name ?? 'User'}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.email}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.5rem', padding: '0.5rem 0.75rem', borderRadius: '8px',
              fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
              color: 'var(--text-secondary)',
              background: 'transparent',
              border: '1px solid var(--border-default)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              const btn = e.currentTarget;
              btn.style.background = 'var(--color-danger-10)';
              btn.style.color = 'var(--color-danger)';
              btn.style.borderColor = 'rgba(239,68,68,0.3)';
            }}
            onMouseLeave={e => {
              const btn = e.currentTarget;
              btn.style.background = 'transparent';
              btn.style.color = 'var(--text-secondary)';
              btn.style.borderColor = 'var(--border-default)';
            }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
