import { useEffect, useState, useCallback } from 'react';
import {
  Users, FileText, Mic, TrendingUp, Clock, Zap, Shield,
  Crown, RefreshCw, Activity, ArrowUpRight, BarChart3,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { PageHeader, StatCard, Spinner, SectionCard } from '@/components/ui';
import { formatDateTime, formatDuration, timeAgo } from '@/lib/utils';

interface AdminStats {
  totalUsers: number;
  totalNotes: number;
  totalLectures: number;
  completedLectures: number;
  processingLectures: number;
  totalRecordingSeconds: number;
  newUsers7d: number;
  newNotes7d: number;
  recentUsers: { id: string; full_name: string | null; college: string | null; created_at: string }[];
  recentNotes: { id: string; title: string; subject: string | null; created_at: string; user_email: string | null }[];
  dailySignups: { date: string; count: number }[];
  dailyNotes: { date: string; count: number }[];
}

function MiniBarChart({ data, color }: { data: { date: string; count: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d) => (
        <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
          <div
            className={`w-full rounded-t ${color} transition-all duration-300 group-hover:opacity-80`}
            style={{ height: `${Math.max((d.count / max) * 100, 4)}%` }}
          />
          <span className="text-[8px] text-slate-400 rotate-0 truncate w-full text-center">
            {new Date(d.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }).split(' ')[0]}
          </span>
          <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap z-10">
            {d.count} on {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('get_admin_stats');
    if (rpcError) {
      setError(rpcError.message);
    } else if (!data) {
      setError('You do not have admin access.');
    } else {
      setStats(data as AdminStats);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Spinner className="w-8 h-8" />
        <p className="text-sm text-slate-500">Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
          <Shield className="w-7 h-7 text-rose-500" />
        </div>
        <h2 className="text-lg font-semibold mb-2">Access Restricted</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div>
      <PageHeader
        title="Founder Dashboard"
        subtitle="Platform-wide analytics for Synapse"
        icon={Crown}
        action={
          <button onClick={loadStats} className="btn-secondary">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color="brand" trend={`${stats.newUsers7d} new this week`} />
        <StatCard label="Total Notes" value={stats.totalNotes} icon={FileText} color="accent" trend={`${stats.newNotes7d} new this week`} />
        <StatCard label="Total Lectures" value={stats.totalLectures} icon={Mic} color="rose" trend={`${stats.completedLectures} completed`} />
        <StatCard label="Recording Time" value={formatDuration(stats.totalRecordingSeconds)} icon={Clock} color="emerald" trend="Across all users" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <SectionCard title="New User Signups" icon={TrendingUp}>
          <MiniBarChart data={stats.dailySignups} color="bg-brand-500" />
        </SectionCard>
        <SectionCard title="Notes Created" icon={BarChart3}>
          <MiniBarChart data={stats.dailyNotes} color="bg-accent-500" />
        </SectionCard>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Completed</p>
            <p className="text-xl font-bold">{stats.completedLectures}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Processing</p>
            <p className="text-xl font-bold">{stats.processingLectures}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center">
            <ArrowUpRight className="w-5 h-5 text-brand-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Avg Notes/User</p>
            <p className="text-xl font-bold">{stats.totalUsers > 0 ? (stats.totalNotes / stats.totalUsers).toFixed(1) : '0'}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center">
            <Mic className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Avg Lectures/User</p>
            <p className="text-xl font-bold">{stats.totalUsers > 0 ? (stats.totalLectures / stats.totalUsers).toFixed(1) : '0'}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <SectionCard title="Newest Users" icon={Users}>
          {stats.recentUsers.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No users yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                    {(u.full_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.full_name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400 truncate">{u.college || 'No college set'}</p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{timeAgo(u.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Recent Notes */}
        <SectionCard title="Latest Notes" icon={FileText}>
          {stats.recentNotes.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No notes yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentNotes.map((n) => (
                <div key={n.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {n.subject || 'No subject'} · {n.user_email || 'Unknown user'}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{timeAgo(n.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Footer note */}
      <div className="mt-8 card p-4 flex items-center gap-3 border border-brand-500/20">
        <Shield className="w-5 h-5 text-brand-500 shrink-0" />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          This dashboard is only visible to founders. Data is fetched securely through a server-side
          function that verifies admin access — regular users cannot see this page or access these stats.
        </p>
      </div>
    </div>
  );
}
