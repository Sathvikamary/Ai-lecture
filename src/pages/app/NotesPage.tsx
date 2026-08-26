import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Search, Star, Edit2, Copy, Trash2, Share2, Eye, Sparkles,
  Tag as TagIcon, LayoutGrid,
} from 'lucide-react';
import { PageHeader, EmptyState, ConfirmDialog } from '@/components/ui';
import { useNotes } from '@/lib/hooks';
import { useToast } from '@/context/ToastContext';
import { formatDate, subjectColor, cn } from '@/lib/utils';

export function NotesPage() {
  const { notes, loading, updateNote, deleteNote, duplicateNote } = useNotes();
  const { notify } = useToast();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (filter === 'favorites' && !n.favorite) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        (n.subject ?? '').toLowerCase().includes(q) ||
        n.tags.some((t) => t.includes(q))
      );
    });
  }, [notes, query, filter]);

  const handleShare = async (note: typeof notes[number]) => {
    const shareUrl = `${window.location.origin}/editor/${note.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: note.title, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        notify('Share link copied to clipboard!', 'success');
      }
    } catch {
      notify('Share link copied!', 'info');
    }
  };

  const handleDuplicate = async (note: typeof notes[number]) => {
    const dup = await duplicateNote(note);
    if (dup) notify('Note duplicated', 'success');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const ok = await deleteNote(deleteId);
    notify(ok ? 'Note deleted' : 'Could not delete note', ok ? 'success' : 'error');
  };

  const toggleFav = async (note: typeof notes[number]) => {
    await updateNote(note.id, { favorite: !note.favorite });
  };

  if (loading) {
    return <div className="py-20 text-center text-slate-500">Loading your notes…</div>;
  }

  return (
    <div>
      <PageHeader
        title="Saved Notes"
        subtitle={`${notes.length} note${notes.length !== 1 ? 's' : ''} in your library`}
        icon={FileText}
        action={<Link to="/generate" className="btn-primary"><Sparkles className="w-4 h-4" /> New Notes</Link>}
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-10"
            placeholder="Search by title, subject, or tag…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={cn('btn text-sm', filter === 'all' ? 'btn-primary' : 'btn-secondary')}
          >
            <LayoutGrid className="w-4 h-4" /> All
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={cn('btn text-sm', filter === 'favorites' ? 'btn-primary' : 'btn-secondary')}
          >
            <Star className="w-4 h-4" /> Favorites
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={notes.length === 0 ? "No notes yet" : "No matching notes"}
          description={notes.length === 0
            ? "Record a lecture or upload a file, then generate your first AI notes."
            : "Try a different search term or filter."}
          action={notes.length === 0 && <Link to="/generate" className="btn-primary"><Sparkles className="w-4 h-4" /> Generate Notes</Link>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((note) => {
            const preview = (note.content.editorHtml || note.content.completeNotes || '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 140);
            return (
              <div key={note.id} className="card p-5 flex flex-col group hover:shadow-glass transition-all hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', subjectColor(note.subject || 'General'))}>
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <button
                    onClick={() => toggleFav(note)}
                    className="btn-ghost p-1.5 rounded-lg"
                    aria-label={note.favorite ? 'Unfavorite' : 'Favorite'}
                  >
                    <Star className={cn('w-4 h-4', note.favorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400')} />
                  </button>
                </div>

                <Link to={`/editor/${note.id}`} className="flex-1">
                  <h3 className="font-semibold leading-snug group-hover:text-brand-500 transition-colors">{note.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="chip bg-slate-200/60 dark:bg-slate-700/60">{note.subject}</span>
                    <span>{formatDate(note.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-3 leading-relaxed">{preview || 'No preview available'}</p>
                </Link>

                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {note.tags.slice(0, 3).map((t) => (
                      <span key={t} className="chip bg-brand-500/5 text-brand-600 dark:text-brand-400 text-[10px]">
                        <TagIcon className="w-2.5 h-2.5" />{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                  <Link to={`/editor/${note.id}`} className="btn-ghost p-2 rounded-lg" title="Open"><Eye className="w-4 h-4" /></Link>
                  <Link to={`/editor/${note.id}`} className="btn-ghost p-2 rounded-lg" title="Edit"><Edit2 className="w-4 h-4" /></Link>
                  <button onClick={() => handleDuplicate(note)} className="btn-ghost p-2 rounded-lg" title="Duplicate"><Copy className="w-4 h-4" /></button>
                  <button onClick={() => handleShare(note)} className="btn-ghost p-2 rounded-lg" title="Share"><Share2 className="w-4 h-4" /></button>
                  <button onClick={() => setDeleteId(note.id)} className="btn-ghost p-2 rounded-lg hover:text-rose-500 ml-auto" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete note?"
        message="This will permanently delete this note. This action cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
