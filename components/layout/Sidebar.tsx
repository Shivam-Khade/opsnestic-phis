'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Inbox, 
  History, 
  UserCircle, 
  ShieldCheck, 
  Users, 
  FileText, 
  BarChart2, 
  LogOut,
  Shield
} from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for tailwind classes
function cn(...classes: (string | undefined | null | false)[]) {
  return twMerge(clsx(classes));
}

interface SidebarProps {
  user: { name?: string | null; email?: string | null; role?: string };
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/training', label: 'Training Inbox', icon: Inbox },
  { href: '/history', label: 'History', icon: History },
  { href: '/profile', label: 'My Profile', icon: UserCircle },
];

const adminItems = [
  { href: '/admin', label: 'Admin Overview', icon: ShieldCheck },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/scenarios', label: 'Scenarios', icon: FileText },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
];

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = user.role === 'admin';

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="w-64 bg-white/80 backdrop-blur-xl border-r border-slate-200/60 flex flex-col h-screen sticky top-0 overflow-y-auto shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-100/80">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
          <Shield className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">
          PhishGuard
        </span>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5">
        {!isAdmin && (
          <>
            <p className="px-3 text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">
              Training
            </p>

        
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative overflow-hidden",
                active 
                  ? "text-indigo-700 bg-indigo-50/80 shadow-sm ring-1 ring-indigo-100/50" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
              )}
              <Icon 
                className={cn(
                  "w-5 h-5 transition-transform duration-200", 
                  active ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600 group-hover:scale-110"
                )} 
                strokeWidth={active ? 2.5 : 2} 
              />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
          </>
        )}

        {isAdmin && (
          <div className={isAdmin ? "" : "mt-6"}>
            <p className="px-3 text-xs font-bold tracking-wider text-slate-400 uppercase mb-2">
              Administration
            </p>
            {adminItems.map((item) => {
              const active = isActive(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative",
                    active 
                      ? "text-violet-700 bg-violet-50/80 shadow-sm ring-1 ring-violet-100/50" 
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  {active && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-violet-600 rounded-r-full" />
                  )}
                  <Icon 
                    className={cn(
                      "w-5 h-5 transition-transform duration-200", 
                      active ? "text-violet-600" : "text-slate-400 group-hover:text-slate-600 group-hover:scale-110"
                    )} 
                    strokeWidth={active ? 2.5 : 2} 
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User info + logout */}
      <div className="p-4 m-4 mt-auto bg-slate-50 rounded-2xl border border-slate-100/80 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-sm font-bold text-slate-700 shadow-inner ring-2 ring-white">
            {user.name?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 truncate">
              {user.name ?? 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate font-medium">
              {user.email}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all duration-200 group"
          title="Sign out"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
