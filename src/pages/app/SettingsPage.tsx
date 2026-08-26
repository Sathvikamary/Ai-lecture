import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Settings, User, Mail, GraduationCap, Building2, Camera, Moon, Sun,
  Globe, Type, BrainCircuit, Lock, Shield, Trash2, Check, LogOut,
} from 'lucide-react';
import { PageHeader, SectionCard, ConfirmDialog } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useSettings } from '@/context/SettingsContext';
import { useToast } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { initials, cn } from '@/lib/utils';

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Arabic', 'Chinese', 'Japanese'];
const AI_STYLES = [
  { key: 'concise' as const, label: 'Concise', desc: 'Short, to the point' },
  { key: 'balanced' as const, label: 'Balanced', desc: 'Recommended default' },
  { key: 'detailed' as const, label: 'Detailed', desc: 'Comprehensive coverage' },
];
const FONT_SIZES = [
  { key: 'sm' as const, label: 'Small', sample: 'text-sm' },
  { key: 'md' as const, label: 'Medium', sample: 'text-base' },
  { key: 'lg' as const, label: 'Large', sample: 'text-lg' },
];

export function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const { settings, update, updatePrivacy } = useSettings();
  const { notify } = useToast();

  const [name, setName] = useState(profile?.full_name ?? '');
  const [college, setCollege] = useState(profile?.college ?? '');
  const [department, setDepartment] = useState(profile?.department ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwLoading, setPwLoading] = useState(false);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from('profiles').upsert({
      id: user.id,
      full_name: name,
      college,
      department,
    });
    setSavingProfile(false);
    if (error) {
      notify('Could not save profile', 'error');
    } else {
      await refreshProfile();
      notify('Profile updated', 'success');
    }
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pwForm.next.length < 8) { notify('New password must be at least 8 characters', 'error'); return; }
    if (pwForm.next !== pwForm.confirm) { notify('Passwords do not match', 'error'); return; }
    setPwLoading(true);
    const { error } = await supabase.auth.updateUser({ password: pwForm.next });
    setPwLoading(false);
    setPwForm({ current: '', next: '', confirm: '' });
    if (error) notify(error.message, 'error');
    else notify('Password updated successfully', 'success');
  };

  const handleDeleteAccount = async () => {
    notify('Account deletion requires email verification. Contact support to complete deletion.', 'info');
  };

  const Toggle = ({ on, onChange, label, desc }: { on: boolean; onChange: () => void; label: string; desc: string }) => (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <button
        onClick={onChange}
        className={cn('relative w-11 h-6 rounded-full transition-colors', on ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-700')}
        role="switch"
        aria-checked={on}
        aria-label={label}
      >
        <span className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform', on && 'translate-x-5')} />
      </button>
    </div>
  );

  return (
    <div>
      <PageHeader title="Profile & Settings" subtitle="Manage your account and preferences." icon={Settings} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile */}
        <div className="lg:col-span-2 space-y-6">
          <SectionCard title="Profile" icon={User}>
            <form onSubmit={saveProfile} className="space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xl font-bold">
                  {initials(name || user?.email || 'U')}
                </div>
                <button type="button" onClick={() => notify('Avatar upload coming soon', 'info')} className="btn-secondary text-sm">
                  <Camera className="w-4 h-4" /> Change Photo
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="name">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input id="name" className="input pl-10" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="email">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input id="email" className="input pl-10 opacity-60" value={user?.email ?? ''} disabled />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="college">College</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input id="college" className="input pl-10" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="Your college" />
                  </div>
                </div>
                <div>
                  <label className="label" htmlFor="dept">Department</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input id="dept" className="input pl-10" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Your department" />
                  </div>
                </div>
              </div>

              <button type="submit" disabled={savingProfile} className="btn-primary">
                {savingProfile ? 'Saving...' : <><Check className="w-4 h-4" /> Save Profile</>}
              </button>
            </form>
          </SectionCard>

          {/* Appearance & preferences */}
          <SectionCard title="Preferences" icon={Settings}>
            <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
              <div className="py-3">
                <p className="text-sm font-medium flex items-center gap-2 mb-2"><Moon className="w-4 h-4" /> Theme</p>
                <div className="flex gap-2">
                  <button onClick={() => update('theme', 'light')} className={cn('btn text-sm', settings.theme === 'light' ? 'btn-primary' : 'btn-secondary')}>
                    <Sun className="w-4 h-4" /> Light
                  </button>
                  <button onClick={() => update('theme', 'dark')} className={cn('btn text-sm', settings.theme === 'dark' ? 'btn-primary' : 'btn-secondary')}>
                    <Moon className="w-4 h-4" /> Dark
                  </button>
                </div>
              </div>

              <div className="py-3">
                <p className="text-sm font-medium flex items-center gap-2 mb-2"><Type className="w-4 h-4" /> Font Size</p>
                <div className="flex gap-2">
                  {FONT_SIZES.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => update('fontScale', f.key)}
                      className={cn('btn', settings.fontScale === f.key ? 'btn-primary' : 'btn-secondary')}
                    >
                      <span className={f.sample}>{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="py-3">
                <p className="text-sm font-medium flex items-center gap-2 mb-2"><Globe className="w-4 h-4" /> Language</p>
                <select className="input max-w-xs" value={settings.language} onChange={(e) => update('language', e.target.value)}>
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>

              <div className="py-3">
                <p className="text-sm font-medium flex items-center gap-2 mb-2"><BrainCircuit className="w-4 h-4" /> AI Response Style</p>
                <div className="grid sm:grid-cols-3 gap-2">
                  {AI_STYLES.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => update('aiStyle', s.key)}
                      className={cn('p-3 rounded-xl border text-left transition-all', settings.aiStyle === s.key ? 'border-brand-500 bg-brand-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-brand-400')}
                    >
                      <p className="text-sm font-semibold">{s.label}</p>
                      <p className="text-xs text-slate-500">{s.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Toggle
                on={settings.notifications}
                onChange={() => update('notifications', !settings.notifications)}
                label="Notifications"
                desc="Show toast notifications for actions"
              />
            </div>
          </SectionCard>

          {/* Privacy */}
          <SectionCard title="Privacy" icon={Shield}>
            <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
              <Toggle
                on={settings.privacy.publicProfile}
                onChange={() => updatePrivacy('publicProfile', !settings.privacy.publicProfile)}
                label="Public Profile"
                desc="Allow others to see your profile"
              />
              <Toggle
                on={settings.privacy.shareAnalytics}
                onChange={() => updatePrivacy('shareAnalytics', !settings.privacy.shareAnalytics)}
                label="Share Analytics"
                desc="Help improve Synapse with anonymous usage data"
              />
            </div>
          </SectionCard>

          {/* Change password */}
          <SectionCard title="Change Password" icon={Lock}>
            <form onSubmit={changePassword} className="space-y-4">
              <div>
                <label className="label" htmlFor="cur">Current Password</label>
                <input id="cur" type="password" className="input" value={pwForm.current} onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })} placeholder="••••••••" />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label" htmlFor="new">New Password</label>
                  <input id="new" type="password" className="input" value={pwForm.next} onChange={(e) => setPwForm({ ...pwForm, next: e.target.value })} placeholder="••••••••" />
                </div>
                <div>
                  <label className="label" htmlFor="conf">Confirm New Password</label>
                  <input id="conf" type="password" className="input" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" disabled={pwLoading} className="btn-primary">
                {pwLoading ? 'Updating...' : <><Lock className="w-4 h-4" /> Update Password</>}
              </button>
            </form>
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <SectionCard title="Account">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-bold">
                  {initials(name || user?.email || 'U')}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{name || 'User'}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
              </div>
              <button onClick={() => { void signOut(); notify('Signed out', 'info'); }} className="btn-secondary w-full text-sm">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </SectionCard>

          <SectionCard title="Quick Links">
            <div className="space-y-1">
              {[
                { to: '/notes', label: 'Saved Notes' },
                { to: '/history', label: 'Lecture History' },
                { to: '/export', label: 'Export Notes' },
                { to: '/privacy', label: 'Privacy Policy' },
              ].map((l) => (
                <Link key={l.to} to={l.to} className="block px-3 py-2 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </SectionCard>

          {/* Danger zone */}
          <SectionCard title="Danger Zone" className="border-rose-500/30">
            <p className="text-xs text-slate-500 mb-3">Permanently delete your account and all associated data.</p>
            <button onClick={() => setDeleteOpen(true)} className="btn-danger w-full text-sm">
              <Trash2 className="w-4 h-4" /> Delete Account
            </button>
          </SectionCard>
        </div>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete account?"
        message="This will permanently delete your account and all your notes and lectures. This action cannot be undone."
        confirmLabel="Delete Account"
        danger
      />
    </div>
  );
}
