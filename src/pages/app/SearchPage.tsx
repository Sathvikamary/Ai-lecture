import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, FileText, Calendar, Tag as TagIcon, BookOpen, X, Filter } from 'lucide-react';
import { PageHeader, EmptyState, SectionCard } from '@/components/ui';
import { useNotes } from '@/lib/hooks';
import { formatDate, subjectColor, cn } from '@/lib/utils';

type SortBy = 'relevance' | 'date-new' | 'date-old' | 'title';

export function SearchPage() {
  const { notes, loading } = useNotes();
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState('all');
  const [tag, setTag] = useState('all');
  const [sortBy, setSortBy] = useState<SortBy>('relevance');

  const subjects = useMemo(() => [...new Set(notes.map((n) => n.subject).filter(Boolean))] as string[], [notes]);
  const tags = useMemo(() => [...new Set(notes.flatMap((n) => n.tags))], [notes]);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    let scored = notes.map((n) => {
      const titleMatch = n.title.toLowerCase().includes(q);
      const subjectMatch = (n.subject ?? '').toLowerCase().includes(q);
      const tagMatch = n.tags.some((t) => t.toLowerCase().includes(q));
      const contentMatch = (n.content.completeNotes || '').toLowerCase().includes(q);
      let score = 0;
      if (titleMatch) score += 4;
      if (subjectMatch) score += 2;
      if (tagMatch) score += 3;
      if (contentMatch) score += 1;
      return { note: n, score };
    });

    if (subject !== 'all') scored = scored.filter((x) => x.note.subject === subject);
    if (tag !== 'all') scored = scored.filter((x) => x.note.tags.includes(tag));
    if (q) scored = scored.filter((x) => x.score > 0);

    scored.sort((a, b) => {
      if (sortBy === 'relevance') return b.score - a.score;
      if (sortBy === 'date-new') return new Date(b.note.created_at).getTime() - new Date(a.note.created_at).getTime();
      if (sortBy === 'date-old') return new Date(a.note.created_at).getTime() - new Date(b.note.created_at).getTime();
      return a.note.title.localeCompare(b.note.title);
    });

    return scored.map((x) => x.note);
  }, [notes, query, subject, tag, sortBy]);

  if (loading) return <div className="py-20 text-center text-slate-500">Loading…</div>;

  return (
    <div>
      <PageHeader title="Search Notes" subtitle="Find any note by title, subject, keyword, or tag." icon={Search} />

      <SectionCard className="mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            autoFocus
            className="input pl-11 text-base"
            placeholder="Search across all your notes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          <select className="input max-w-[160px]" value={subject} onChange={(e) => setSubject(e.target.value)}>
            <option value="all">All subjects</option>
            {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input max-w-[160px]" value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="all">All tags</option>
            {tags.map((t) => <option key={t} value={t}>#{t}</option>)}
          </select>
          <select className="input max-w-[160px]" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)}>
            <option value="relevance">Relevance</option>
            <option value="date-new">Newest first</option>
            <option value="date-old">Oldest first</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </SectionCard>

      <p className="text-sm text-slate-500 mb-4">{results.length} result{results.length !== 1 ? 's' : ''}</p>

      {results.length === 0 ? (
        <EmptyState
          icon={Search}
          title={query ? "No results found" : "Start searching"}
          description={query ? "Try different keywords or adjust your filters." : "Type above to search across all your notes."}
        />
      ) : (
        <div className="space-y-3">
          {results.map((note) => {
            const preview = (note.content.completeNotes || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 200);
            return (
              <Link key={note.id} to={`/editor/${note.id}`} className="card p-4 flex items-start gap-4 hover:shadow-glass transition-all group">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', subjectColor(note.subject || 'General'))}>
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold group-hover:text-brand-500 transition-colors">{note.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {note.subject}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(note.created_at)}</span>
                    {note.tags.slice(0, 3).map((t) => (
                      <span key={t} className="flex items-center gap-0.5"><TagIcon className="w-3 h-3" /> {t}</span>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">{preview}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
