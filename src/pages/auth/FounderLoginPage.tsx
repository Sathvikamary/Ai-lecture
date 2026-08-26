import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Crown, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { validateEmail } from '@/lib/utils';

export function FounderLoginPage() {
  const { signIn } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validateEmail(email)) { setError('Please enter a valid email address'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    const res = await signIn(email, password);
    setLoading(false);

    if (res.error) {
      setError(res.error);
      notify(res.error, 'error');
      return;
    }
    notify('Welcome back, Founder!', 'success');
    navigate('/admin', { replace: true });
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse-soft" />
      </div>

      <div className="w-full max-w-md relative animate-fade-in-scale">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30 animate-float">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Founder Access</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Exclusive login for Synapse founders
          </p>
        </div>

        <div className="glass-strong rounded-2xl shadow-glass p-6 sm:p-8 border-amber-500/20">
          {error && (
            <div className="flex items-center gap-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg px-3 py-2.5 text-sm mb-4 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label className="label" htmlFor="founder-email">Founder Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/60" />
                <input
                  id="founder-email" type="email" autoComplete="email"
                  className="input pl-10 focus:border-amber-500 focus:ring-amber-500/10" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="founder@synapse.app"
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="founder-password">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500/60" />
                <input
                  id="founder-password" type={showPw ? 'text' : 'password'} autoComplete="current-password"
                  className="input pl-10 pr-10 focus:border-amber-500 focus:ring-amber-500/10" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Toggle password visibility">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 active:scale-[0.98] shadow-lg shadow-amber-500/25">
              {loading ? 'Verifying...' : 'Enter Founder Dashboard'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="flex items-center gap-2 mt-5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <Shield className="w-4 h-4 text-amber-500 shrink-0" />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              This portal is restricted to authorized founders. Regular users should use the standard login.
            </p>
          </div>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
            Not a founder?{' '}
            <Link to="/login" className="text-brand-500 font-medium hover:underline">Regular login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
