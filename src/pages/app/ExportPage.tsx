import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Download, FileText, FileType2, Printer, Share2, FileCode, Eye, ChevronRight,
} from 'lucide-react';
import { PageHeader, SectionCard, EmptyState, Modal } from '@/components/ui';
import { useNotes } from '@/lib/hooks';
import { useToast } from '@/context/ToastContext';
import { formatDate, download, cn } from '@/lib/utils';
import type { Note } from '@/lib/types';

type Format = 'pdf' | 'docx' | 'txt';

const FORMATS: { key: Format; label: string; desc: string; icon: typeof FileText; color: string }[] = [
  { key: 'pdf', label: 'PDF', desc: 'Portable document', icon: FileText, color: 'from-rose-500/20 to-rose-500/5' },
  { key: 'docx', label: 'Word (.docx)', desc: 'Microsoft Word', icon: FileType2, color: 'from-brand-500/20 to-brand-500/5' },
  { key: 'txt', label: 'Plain Text', desc: 'Universal text file', icon: FileCode, color: 'from-emerald-500/20 to-emerald-500/5' },
];

function noteToText(note: Note): string {
  const c = note.content;
  const parts: string[] = [
    note.title.toUpperCase(),
    `Subject: ${note.subject}`,
    `Date: ${formatDate(note.created_at)}`,
    `Tags: ${note.tags.join(', ') || 'none'}`,
    '',
    '─'.repeat(60),
    '',
  ];
  if (c.summary) parts.push('SUMMARY', c.summary, '');
  if (c.keyPoints?.length) { parts.push('KEY POINTS'); c.keyPoints.forEach((p, i) => parts.push(`${i + 1}. ${p}`)); parts.push(''); }
  if (c.definitions?.length) { parts.push('DEFINITIONS'); c.definitions.forEach((d) => parts.push(`- ${d.term}: ${d.definition}`)); parts.push(''); }
  if (c.formulas?.length) { parts.push('FORMULAS'); c.formulas.forEach((f) => parts.push(`- ${f}`)); parts.push(''); }
  if (c.dates?.length) { parts.push('IMPORTANT DATES'); c.dates.forEach((d) => parts.push(`- ${d.date}: ${d.event}`)); parts.push(''); }
  if (c.examples?.length) { parts.push('EXAMPLES'); c.examples.forEach((e) => parts.push(`- ${e}`)); parts.push(''); }
  if (c.faqs?.length) { parts.push('FAQs'); c.faqs.forEach((f) => parts.push(`Q: ${f.question}`, `A: ${f.answer}`, '')); }
  if (c.examPrep) {
    const ep = c.examPrep;
    parts.push('EXAM PREPARATION');
    if (ep.twoMark.length) { parts.push('2-Mark Questions:'); ep.twoMark.forEach((q) => parts.push(`  - ${q}`)); }
    if (ep.fiveMark.length) { parts.push('5-Mark Questions:'); ep.fiveMark.forEach((q) => parts.push(`  - ${q}`)); }
    if (ep.tenMark.length) { parts.push('10-Mark Questions:'); ep.tenMark.forEach((q) => parts.push(`  - ${q}`)); }
    if (ep.theory.length) { parts.push('Theory Questions:'); ep.theory.forEach((q) => parts.push(`  - ${q}`)); }
    if (ep.diagrams.length) { parts.push('Diagrams to Practice:'); ep.diagrams.forEach((d) => parts.push(`  - ${d}`)); }
    if (ep.tips.length) { parts.push('Revision Tips:'); ep.tips.forEach((t) => parts.push(`  - ${t}`)); }
    parts.push('');
  }
  if (c.quiz?.length) {
    parts.push('QUIZ');
    c.quiz.forEach((q, i) => {
      const typeLabel = { mcq: 'MCQ', truefalse: 'True/False', fillblank: 'Fill in the Blank', shortanswer: 'Short Answer', scenario: 'Scenario' }[q.type];
      parts.push(`${i + 1}. [${typeLabel}] ${q.question}`);
      if (q.options) q.options.forEach((o, j) => parts.push(`   ${String.fromCharCode(65 + j)}) ${o}`));
      parts.push(`   Answer: ${typeof q.answer === 'boolean' ? (q.answer ? 'True' : 'False') : q.answer}`, '');
    });
  }
  if (c.flashcards?.length) { parts.push('FLASHCARDS'); c.flashcards.forEach((fc) => parts.push(`- Front: ${fc.front}`, `  Back: ${fc.back}`)); parts.push(''); }
  if (c.actionItems?.length) { parts.push('ACTION ITEMS'); c.actionItems.forEach((a) => parts.push(`- [ ] ${a}`)); parts.push(''); }
  const html = c.editorHtml || c.completeNotes || '';
  if (html) parts.push('FULL NOTES', html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
  return parts.join('\n');
}

function noteToDocx(note: Note): string {
  const text = noteToText(note);
  // Minimal Word-compatible HTML document
  return `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>${note.title}</title></head><body><pre style="font-family:Calibri,sans-serif;font-size:11pt;white-space:pre-wrap">${text.replace(/</g, '&lt;')}</pre></body></html>`;
}

function noteToPdfHtml(note: Note): string {
  const c = note.content;
  const esc = (s: string) => s.replace(/</g, '&lt;');
  const sections: string[] = [];
  if (c.summary) sections.push(`<h2>Summary</h2><p>${esc(c.summary)}</p>`);
  if (c.keyPoints?.length) sections.push(`<h2>Key Points</h2><ul>${c.keyPoints.map((p) => `<li>${esc(p)}</li>`).join('')}</ul>`);
  if (c.definitions?.length) sections.push(`<h2>Definitions</h2><dl>${c.definitions.map((d) => `<dt><b>${esc(d.term)}</b></dt><dd>${esc(d.definition)}</dd>`).join('')}</dl>`);
  if (c.formulas?.length) sections.push(`<h2>Formulas</h2><ul>${c.formulas.map((f) => `<li><code>${esc(f)}</code></li>`).join('')}</ul>`);
  if (c.dates?.length) sections.push(`<h2>Important Dates</h2><ul>${c.dates.map((d) => `<li><b>${esc(d.date)}</b>: ${esc(d.event)}</li>`).join('')}</ul>`);
  if (c.examples?.length) sections.push(`<h2>Examples</h2><ul>${c.examples.map((e) => `<li>${esc(e)}</li>`).join('')}</ul>`);
  if (c.faqs?.length) sections.push(`<h2>FAQs</h2>${c.faqs.map((f) => `<p><b>${esc(f.question)}</b><br/>${esc(f.answer)}</p>`).join('')}`);
  if (c.examPrep) {
    const ep = c.examPrep;
    const epParts: string[] = [];
    if (ep.twoMark.length) epParts.push(`<h3>2-Mark Questions</h3><ol>${ep.twoMark.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>`);
    if (ep.fiveMark.length) epParts.push(`<h3>5-Mark Questions</h3><ol>${ep.fiveMark.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>`);
    if (ep.tenMark.length) epParts.push(`<h3>10-Mark Questions</h3><ol>${ep.tenMark.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>`);
    if (ep.theory.length) epParts.push(`<h3>Theory Questions</h3><ol>${ep.theory.map((q) => `<li>${esc(q)}</li>`).join('')}</ol>`);
    if (ep.diagrams.length) epParts.push(`<h3>Diagrams to Practice</h3><ul>${ep.diagrams.map((d) => `<li>${esc(d)}</li>`).join('')}</ul>`);
    if (ep.tips.length) epParts.push(`<h3>Revision Tips</h3><ul>${ep.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`);
    if (epParts.length) sections.push(`<h2>Exam Preparation</h2>${epParts.join('')}`);
  }
  if (c.quiz?.length) {
    const typeLabel: Record<string, string> = { mcq: 'MCQ', truefalse: 'True/False', fillblank: 'Fill in the Blank', shortanswer: 'Short Answer', scenario: 'Scenario' };
    sections.push(`<h2>Quiz</h2><ol>${c.quiz.map((q) => {
      const opts = q.options ? `<ul>${q.options.map((o, j) => `<li>${String.fromCharCode(65 + j)}) ${esc(o)}${q.type === 'mcq' && j === q.answer ? ' ✓' : ''}</li>`).join('')}</ul>` : '';
      return `<li>[${typeLabel[q.type] || q.type}] ${esc(q.question)}${opts}<p><b>Answer:</b> ${typeof q.answer === 'boolean' ? (q.answer ? 'True' : 'False') : esc(String(q.answer))}</p></li>`;
    }).join('')}</ol>`);
  }
  if (c.flashcards?.length) sections.push(`<h2>Flashcards</h2><ul>${c.flashcards.map((fc) => `<li><b>${esc(fc.front)}</b> — ${esc(fc.back)}</li>`).join('')}</ul>`);
  if (c.actionItems?.length) sections.push(`<h2>Action Items</h2><ul>${c.actionItems.map((a) => `<li>☐ ${esc(a)}</li>`).join('')}</ul>`);

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(note.title)}</title><style>
  @page { margin: 2cm; } body { font-family: Georgia, serif; line-height: 1.6; color: #1e293b; max-width: 700px; margin: 0 auto; }
  h1 { font-size: 22pt; border-bottom: 2px solid #3366ff; padding-bottom: 8px; }
  h2 { font-size: 14pt; color: #3366ff; margin-top: 20px; } .meta { color: #64748b; font-size: 10pt; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
  ul, ol { padding-left: 20px; } dl dt { font-weight: bold; margin-top: 6px; }
  </style></head><body><h1>${esc(note.title)}</h1><p class="meta">Subject: ${esc(note.subject || 'N/A')} | Date: ${formatDate(note.created_at)} | Tags: ${esc(note.tags.join(', ') || 'none')}</p>${sections.join('')}</body></html>`;
}

export function ExportPage() {
  const { notes, loading } = useNotes();
  const { notify } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preview, setPreview] = useState<Note | null>(null);

  const selected = useMemo(() => notes.find((n) => n.id === selectedId) ?? null, [notes, selectedId]);

  const handleExport = (format: Format, note: Note) => {
    const safeName = note.title.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    if (format === 'txt') {
      download(`${safeName}.txt`, noteToText(note), 'text/plain');
    } else if (format === 'docx') {
      download(`${safeName}.doc`, noteToDocx(note), 'application/msword');
    } else if (format === 'pdf') {
      const html = noteToPdfHtml(note);
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
        setTimeout(() => { w.print(); }, 500);
        notify('PDF opened in new tab — use print to save as PDF', 'info');
      } else {
        notify('Please allow popups to export PDF', 'error');
      }
    }
    notify(`${format.toUpperCase()} export ready!`, 'success');
  };

  const handlePrint = (note: Note) => {
    const html = noteToPdfHtml(note);
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  const handleShare = async (note: Note) => {
    const url = `${window.location.origin}/editor/${note.id}`;
    try {
      await navigator.clipboard.writeText(url);
      notify('Share link copied to clipboard!', 'success');
    } catch {
      notify('Could not copy link', 'error');
    }
  };

  if (loading) return <div className="py-20 text-center text-slate-500">Loading…</div>;

  return (
    <div>
      <PageHeader title="Export Notes" subtitle="Download, print, or share your notes in any format." icon={Download} />

      {notes.length === 0 ? (
        <EmptyState
          icon={Download}
          title="No notes to export"
          description="Generate some notes first, then come back to export them."
          action={<Link to="/generate" className="btn-primary">Generate Notes</Link>}
        />
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Notes list */}
          <div className="lg:col-span-1 space-y-2">
            <h2 className="text-sm font-semibold text-slate-500 mb-3">Select a note</h2>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {notes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedId(n.id)}
                  className={cn(
                    'w-full card p-3 text-left transition-all flex items-center gap-3',
                    selectedId === n.id ? 'ring-2 ring-brand-500 bg-brand-500/5' : 'hover:shadow-glass'
                  )}
                >
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{n.title}</p>
                    <p className="text-xs text-slate-500">{n.subject} · {formatDate(n.created_at)}</p>
                  </div>
                  <ChevronRight className={cn('w-4 h-4 transition-colors', selectedId === n.id ? 'text-brand-500' : 'text-slate-300')} />
                </button>
              ))}
            </div>
          </div>

          {/* Export panel */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="space-y-5">
                <SectionCard>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-bold text-lg">{selected.title}</h2>
                      <p className="text-sm text-slate-500 mt-1">{selected.subject} · {formatDate(selected.created_at)}</p>
                    </div>
                    <button onClick={() => setPreview(selected)} className="btn-ghost text-sm">
                      <Eye className="w-4 h-4" /> Preview
                    </button>
                  </div>
                  {selected.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {selected.tags.map((t) => <span key={t} className="chip bg-brand-500/10 text-brand-600 dark:text-brand-400">#{t}</span>)}
                    </div>
                  )}
                </SectionCard>

                <div>
                  <h3 className="text-sm font-semibold text-slate-500 mb-3">Choose format</h3>
                  <div className="grid sm:grid-cols-3 gap-3">
                    {FORMATS.map((f) => (
                      <button
                        key={f.key}
                        onClick={() => handleExport(f.key, selected)}
                        className="card p-5 text-center hover:shadow-glass hover:-translate-y-0.5 transition-all group"
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mx-auto mb-3`}>
                          <f.icon className="w-6 h-6" />
                        </div>
                        <p className="font-semibold text-sm">{f.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{f.desc}</p>
                        <Download className="w-4 h-4 text-brand-500 mx-auto mt-3 group-hover:translate-y-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-slate-500 mb-3">Other options</h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => handlePrint(selected)} className="btn-secondary flex-1 justify-center">
                      <Printer className="w-4 h-4" /> Print
                    </button>
                    <button onClick={() => handleShare(selected)} className="btn-secondary flex-1 justify-center">
                      <Share2 className="w-4 h-4" /> Copy Share Link
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <SectionCard className="min-h-[300px] flex items-center justify-center text-center">
                <div>
                  <Download className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">Select a note from the left to export it.</p>
                </div>
              </SectionCard>
            )}
          </div>
        </div>
      )}

      {/* Preview modal */}
      <Modal open={preview !== null} onClose={() => setPreview(null)} title={preview?.title ?? ''} size="lg">
        {preview && (
          <div className="max-h-[60vh] overflow-y-auto prose-notes text-sm">
            <div dangerouslySetInnerHTML={{ __html: noteToPdfHtml(preview).replace(/.*<body>/, '').replace(/<\/body>.*/, '') }} />
          </div>
        )}
      </Modal>
    </div>
  );
}
