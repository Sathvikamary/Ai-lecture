import { Link } from 'react-router-dom';
import {
  Mic, FileText, Sparkles, Brain, History, Upload, Clock,
  TrendingUp, ArrowRight, Zap, Star, BookOpen,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotes, useLectures } from '@/lib/hooks';
import { PageHeader, StatCard, EmptyState } from '@/components/ui';
import { timeAgo, formatDuration, subjectColor } from '@/lib/utils';

export function DashboardPage() {
  const { profile } = useAuth();
  const { notes } = useNotes();
  const { lectures } = useLectures();

  const aiSummaries = notes.filter((n) => n.content.summary).length;
  const favorites = notes.filter((n) => n.favorite).length;
  const totalDuration = lectures.reduce((s, l) => s + (l.duration_seconds || 0), 0);
  const recentNotes = notes.slice(0, 4);
  const recentLectures = lectures.slice(0, 3);

  const quickActions = [
    { to: '/record', label: 'Record Lecture', desc: 'Capture live', icon: Mic, color: 'from-rose-500/20 to-rose-500/5' },
    { to: '/upload', label: 'Upload File', desc: 'Audio or PDF', icon: Upload, color: 'from-brand-500/20 to-brand-500/5' },
    { to: '/generate', label: 'Generate Notes', desc: 'AI processing', icon: Sparkles, color: 'from-accent-500/20 to-accent-500/5' },
    { to: '/history', label: 'View History', desc: 'Past lectures', icon: History, color: 'from-violet-500/20 to-violet-500/5' },
  ];

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${profile?.full_name?.split(' ')[0] || 'there'}`}
        subtitle={`You have ${notes.length} saved notes and ${lectures.length} recorded lectures.`}
        action={
          <Link to="/record" className="btn-primary">
            <Mic className="w-4 h-4" /> New Recording
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Lectures" value={lectures.length} icon={Mic} color="rose" trend={`${formatDuration(totalDuration)} recorded`} />
        <StatCard label="Saved Notes" value={notes.length} icon={FileText} color="brand" trend={`${favorites} favorited`} />
        <StatCard label="AI Summaries" value={aiSummaries} icon={Brain} color="accent" trend="Auto-generated" />
        <StatCard label="Recent Activity" value={recentNotes.length} icon={TrendingUp} color="emerald" trend="Notes this week" />
      </div>

      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {quickActions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="card p-5 group hover:shadow-glass hover:-translate-y-1 transition-all"
          >
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center mb-3`}>
              <a.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-sm">{a.label}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
            <ArrowRight className="w-4 h-4 text-slate-400 mt-3 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent notes */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Notes</h2>
            <Link to="/notes" className="text-sm text-brand-500 hover:underline">View all</Link>
          </div>
          {recentNotes.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No notes yet"
              description="Record a lecture or upload a file to generate your first AI notes."
              action={<Link to="/generate" className="btn-primary"><Sparkles className="w-4 h-4" /> Generate Notes</Link>}
            />
          ) : (
            <div className="space-y-3">
              {recentNotes.map((n) => (
                <Link key={n.id} to={`/editor/${n.id}`} className="card p-4 flex items-center gap-4 hover:shadow-glass transition-all group">
                  <div className={`w-10 h-10 rounded-lg ${subjectColor(n.subject || 'General')} bg-opacity-15 flex items-center justify-center shrink-0`}>
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{n.title}</p>
                    <p className="text-xs text-slate-500">{n.subject} · {timeAgo(n.created_at)}</p>
                  </div>
                  {n.favorite && <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />}
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent lectures */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Lectures</h2>
            <Link to="/history" className="text-sm text-brand-500 hover:underline">View all</Link>
          </div>
          {recentLectures.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No lectures yet"
              description="Your lecture history will appear here once you start recording."
              action={<Link to="/record" className="btn-primary"><Mic className="w-4 h-4" /> Start Recording</Link>}
            />
          ) : (
            <div className="space-y-3">
              {recentLectures.map((l) => (
                <Link key={l.id} to="/history" className="card p-4 flex items-center gap-4 hover:shadow-glass transition-all group">
                  <div className="w-10 h-10 rounded-lg bg-brand-500/15 flex items-center justify-center shrink-0">
                    {l.source_type === 'recording' ? <Mic className="w-5 h-5 text-brand-500" /> : <Upload className="w-5 h-5 text-brand-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{l.file_name || 'Untitled lecture'}</p>
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> {formatDuration(l.duration_seconds)} · {timeAgo(l.recorded_at)}
                    </p>
                  </div>
                  <span className={`chip ${
                    l.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                    l.status === 'processing' ? 'bg-amber-500/10 text-amber-600' :
                    'bg-rose-500/10 text-rose-600'
                  }`}>
                    {l.status === 'completed' && <Zap className="w-3 h-3" />}
                    {l.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
