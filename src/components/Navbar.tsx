import { NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Mic, Upload, Sparkles, FileText, History,
  Search, Download, Settings, LogOut, Menu, X, Brain, Moon, Sun, Crown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/context/ToastContext';
import { cn, initials } from '@/lib/utils';

const PUBLIC_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy', label: 'Privacy' },
];

const AUTH_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/record', label: 'Record', icon: Mic },
  { to: '/upload', label: 'Upload', icon: Upload },
  { to: '/generate', label: 'AI Generator', icon: Sparkles },
  { to: '/notes', label: 'Saved Notes', icon: FileText },
  { to: '/history', label: 'History', icon: History },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/export', label: 'Export', icon: Download },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const ADMIN_LINKS = [
  { to: '/admin', label: 'Founder', icon: Crown },
];

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { settings, toggleTheme } = useSettings();
  const { notify } = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = user ? AUTH_LINKS : PUBLIC_LINKS;
  const adminLinks = user && profile?.is_admin ? ADMIN_LINKS : [];

  const handleSignOut = async () => {
    await signOut();
    notify('Signed out successfully', 'info');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/10">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <NavLink to={user ? '/dashboard' : '/'} className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-glow">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight hidden sm:block">Synapse</span>
        </NavLink>

        <div className="hidden lg:flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
                  isActive
                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                )
              }
            >
              {'icon' in l && l.icon && <l.icon className="w-4 h-4" />}
              {l.label}
            </NavLink>
          ))}
          {adminLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  'px-3 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5',
                  isActive
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                )
              }
            >
              <Crown className="w-4 h-4" />
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="btn-ghost p-2.5 rounded-lg"
            aria-label="Toggle theme"
          >
            {settings.theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
              <NavLink to="/settings" className="flex items-center gap-2 btn-ghost py-1.5 px-2 rounded-lg">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xs font-semibold">
                  {initials(profile?.full_name || user.email || 'U')}
                </div>
                <span className="text-sm font-medium max-w-[100px] truncate">
                  {profile?.full_name || user.email}
                </span>
              </NavLink>
              <button onClick={handleSignOut} className="btn-ghost p-2.5 rounded-lg" aria-label="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <NavLink to="/login" className="btn-ghost">Login</NavLink>
              <NavLink to="/signup" className="btn-primary">Sign Up</NavLink>
            </div>
          )}

          <button
            className="lg:hidden btn-ghost p-2.5 rounded-lg"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="lg:hidden glass-strong border-t border-white/10 animate-fade-in">
          <div className="px-4 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'
                  )
                }
              >
                {'icon' in l && l.icon && <l.icon className="w-4 h-4" />}
                {l.label}
              </NavLink>
            ))}
            {adminLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-colors',
                    isActive
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                      : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                  )
                }
              >
                <Crown className="w-4 h-4" />
                {l.label}
              </NavLink>
            ))}
            {user ? (
              <button
                onClick={() => { setMobileOpen(false); handleSignOut(); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-rose-500 hover:bg-rose-500/10"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            ) : (
              <div className="flex gap-2 pt-2">
                <NavLink to="/login" onClick={() => setMobileOpen(false)} className="btn-secondary flex-1">Login</NavLink>
                <NavLink to="/signup" onClick={() => setMobileOpen(false)} className="btn-primary flex-1">Sign Up</NavLink>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
