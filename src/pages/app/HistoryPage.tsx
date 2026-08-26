import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  History, Mic, Upload, Clock, Zap, Trash2, FileText, Filter, ChevronRight,
} from 'lucide-react';
import { PageHeader, EmptyState, ConfirmDialog, SectionCard } from '@/components/ui';
import { useLectures, useNotes } from '@/lib/hooks';
import { useToast } from '@/context/ToastContext';
import { formatDateTime, formatDuration, timeAgo, cn } from '@/lib/utils';

type FilterType = 'all' | 'recent' | 'favorites' | 'recording' | 'upload';

export function HistoryPage() {
  const { lectures, loading, deleteLecture } = useLectures();
  const { notes } = useNotes();
  const { notify } = useToast();
  const [filter, setFilter] = useState<FilterType>('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const subjects = useMemo(
    () => [...new Set(lectures.map((l) => l.subject).filter(Boolean))] as string[],
    [lectures]
  );

  const filtered = useMemo(() => {
    const now = Date.now();
    return lectures.filter((l) => {
      if (subjectFilter !== 'all' && l.subject !== subjectFilter) return false;
      if (filter === 'recent' && now - new Date(l.recorded_at).getTime() > 7 * 86400000) return false;
      if (filter === 'recording' && l.source_type !== 'recording') return false;
      if (filter === 'upload' && l.source_type !== 'upload') return false;
      return true;
    });
  }, [lectures, filter, subjectFilter]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const ok = await deleteLecture(deleteId);
    notify(ok ? 'Lecture deleted' : 'Could not delete', ok ? 'success' : 'error');
  };

  const getNote = (id: string | null) => notes.find((n) => n.id === id);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'recent', label: 'Recent' },
    { key: 'favorites', label: 'Favorites' },
    { key: 'recording', label: 'Recordings' },
    { key: 'upload', label: 'Uploads' },
  ];

  if (loading) return <div className="py-20 text-center text-slate-500">Loading history…</div>;

  return (
    <div>
      <PageHeader title="Lecture History" subtitle="A timeline of all your recordings and uploads." icon={History} />

      {/* Filters */}
      <SectionCard className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="w-4 h-4 text-slate-400" />
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn('chip transition-colors', filter === f.key ? 'bg-brand-500 text-white' : 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-300/60')}
              >
                {f.label}
              </button>
            ))}
          </div>
          {subjects.length > 0 && (
            <select className="input max-w-[180px]" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
              <option value="all">All subjects</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </SectionCard>

      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="No lectures yet"
          description="Your recordings and uploads will appear here as a timeline."
          action={
            <div className="flex gap-2">
              <Link to="/record" className="btn-primary"><Mic className="w-4 h-4" /> Record</Link>
              <Link to="/upload" className="btn-secondary"><Upload className="w-4 h-4" /> Upload</Link>
            </div>
          }
        />
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

          <div className="space-y-4">
            {filtered.map((lec) => {
              const note = getNote(lec.note_id);
              return (
                <div key={lec.id} className="relative pl-14">
                  {/* Timeline dot */}
                  <div className={cn(
                    'absolute left-3 top-4 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900',
                    lec.source_type === 'recording' ? 'bg-rose-500' : 'bg-brand-500'
                  )} />

                  <div className="card p-5 hover:shadow-glass transition-all">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          {lec.source_type === 'recording' ? <Mic className="w-5 h-5 text-rose-500" /> : <Upload className="w-5 h-5 text-brand-500" />}
                        </div>
                        <div>
                          <h3 className="font-semibold">{lec.file_name || 'Untitled lecture'}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(lec.recorded_at)} · {timeAgo(lec.recorded_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('chip',
                          lec.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                          lec.status === 'processing' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-rose-500/10 text-rose-600'
                        )}>
                          {lec.status === 'completed' && <Zap className="w-3 h-3" />}
                          {lec.status}
                        </span>
                        <button onClick={() => setDeleteId(lec.id)} className="btn-ghost p-2 rounded-lg hover:text-rose-500" aria-label="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-500">
                      {lec.subject && <span className="chip bg-slate-200/60 dark:bg-slate-700/60">{lec.subject}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(lec.duration_seconds)}</span>
                      {note && <span className="flex items-center gap-1 text-brand-500"><FileText className="w-3 h-3" /> Notes generated</span>}
                    </div>

                    {lec.transcript && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">{lec.transcript.slice(0, 200)}…</p>
                    )}

                    <div className="flex gap-2 mt-4">
                      <Link to="/generate" state={{ transcript: lec.transcript ?? '', title: lec.file_name ?? 'Lecture' }} className="btn-secondary text-sm">
                        <Zap className="w-4 h-4" /> Generate Notes
                      </Link>
                      {note && (
                        <Link to={`/editor/${note.id}`} className="btn-ghost text-sm">
                          View Notes <ChevronRight className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete lecture?"
        message="This will permanently remove this lecture from your history."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
