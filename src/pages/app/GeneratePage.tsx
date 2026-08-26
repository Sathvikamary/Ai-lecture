import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Sparkles, FileText, ListChecks, BookA, Sigma, CalendarDays,
  Lightbulb, HelpCircle, GraduationCap, Layers, ClipboardList,
  CheckSquare, Wand2, Save, RefreshCw, Mic, Upload,
} from 'lucide-react';
import { PageHeader, SectionCard, Spinner } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useNotes } from '@/lib/hooks';
import { generateNotes } from '@/lib/ai';
import type { GenerateResult } from '@/lib/ai';
import { cn } from '@/lib/utils';
import type { NoteStyle, NoteContent, QuizQuestion, ExamPrep } from '@/lib/types';

const STYLES: { key: NoteStyle; label: string; desc: string; icon: typeof Sparkles }[] = [
  { key: 'short', label: 'Short Notes', desc: 'Quick overview', icon: Wand2 },
  { key: 'detailed', label: 'Detailed Notes', desc: 'Full coverage', icon: FileText },
  { key: 'bullets', label: 'Bullet Points', desc: 'Scannable', icon: ListChecks },
  { key: 'exam', label: 'Exam Prep', desc: 'Study mode', icon: GraduationCap },
];

const SECTIONS: { key: keyof NoteContent; label: string; icon: typeof Sparkles }[] = [
  { key: 'summary', label: 'Summary', icon: Sparkles },
  { key: 'keyPoints', label: 'Key Points', icon: ListChecks },
  { key: 'definitions', label: 'Definitions', icon: BookA },
  { key: 'formulas', label: 'Formulas', icon: Sigma },
  { key: 'dates', label: 'Important Dates', icon: CalendarDays },
  { key: 'examples', label: 'Examples', icon: Lightbulb },
  { key: 'faqs', label: 'FAQs', icon: HelpCircle },
  { key: 'examPrep', label: 'Exam Prep', icon: GraduationCap },
  { key: 'quiz', label: 'Quiz Questions', icon: GraduationCap },
  { key: 'flashcards', label: 'Flashcards', icon: Layers },
  { key: 'actionItems', label: 'Action Items', icon: CheckSquare },
];

export function GeneratePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { createNote } = useNotes();

  const navState = location.state as { transcript?: string; title?: string } | null;
  const [text, setText] = useState(navState?.transcript ?? '');
  const [title, setTitle] = useState(navState?.title ?? '');
  const [subject, setSubject] = useState('');
  const [style, setStyle] = useState<NoteStyle>('detailed');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [activeTab, setActiveTab] = useState<keyof NoteContent>('summary');
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (navState?.transcript) setText(navState.transcript);
    if (navState?.title) setTitle(navState.title);
  }, [navState]);

  const canGenerate = text.trim().length > 30;

  const handleGenerate = async () => {
    if (!canGenerate) {
      notify('Please enter at least a few sentences of lecture content.', 'error');
      return;
    }
    setGenerating(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 900)); // UX delay
    const res = generateNotes({ text, style, title, subject });
    setResult(res);
    setTags(res.keywords.slice(0, 5));
    setGenerating(false);
    setActiveTab('summary');
    notify('Notes generated successfully!', 'success');
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    const note = await createNote({
      title: result.title,
      subject: result.subject,
      tags,
      content: { ...result, editorHtml: result.completeNotes } as NoteContent,
      raw_text: text,
      style,
    });
    setSaving(false);
    if (note) {
      notify('Notes saved to your library!', 'success');
      navigate(`/editor/${note.id}`);
    } else {
      notify('Could not save notes. Please try again.', 'error');
    }
  };

  const availableTabs = useMemo(
    () => SECTIONS.filter((s) => {
      const val = result?.[s.key];
      return val && (!Array.isArray(val) || val.length > 0);
    }),
    [result]
  );

  return (
    <div>
      <PageHeader
        title="AI Note Generator"
        subtitle="Paste lecture text or use content from a recording/upload, then pick a style."
        icon={Sparkles}
      />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input side */}
        <div className="space-y-5">
          <SectionCard title="Lecture Content" icon={FileText}>
            <div className="space-y-3">
              <div>
                <label className="label" htmlFor="title">Title (optional)</label>
                <input id="title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Introduction to Quantum Mechanics" />
              </div>
              <div>
                <label className="label" htmlFor="subject">Subject (optional)</label>
                <input id="subject" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Physics" />
              </div>
              <div>
                <label className="label" htmlFor="text">Lecture Text</label>
                <textarea
                  id="text"
                  rows={10}
                  className="input resize-none font-mono text-xs leading-relaxed"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste your lecture transcript or notes here... (or record/upload first and come back)"
                />
                <p className="text-xs text-slate-400 mt-1">{text.trim().split(/\s+/).filter(Boolean).length} words</p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Note Style" icon={Wand2}>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map((s) => (
                <button
                  key={s.key}
                  onClick={() => setStyle(s.key)}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all',
                    style === s.key
                      ? 'border-brand-500 bg-brand-500/10 ring-2 ring-brand-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-brand-400'
                  )}
                >
                  <s.icon className={cn('w-5 h-5 mb-1.5', style === s.key ? 'text-brand-500' : 'text-slate-400')} />
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="text-xs text-slate-500">{s.desc}</p>
                </button>
              ))}
            </div>
          </SectionCard>

          {!text && (
            <div className="card p-4 flex flex-col sm:flex-row gap-2">
              <Link to="/record" className="btn-secondary flex-1 justify-center"><Mic className="w-4 h-4" /> Record a Lecture</Link>
              <Link to="/upload" className="btn-secondary flex-1 justify-center"><Upload className="w-4 h-4" /> Upload a File</Link>
            </div>
          )}

          <button onClick={handleGenerate} disabled={!canGenerate || generating} className="btn-primary w-full py-3 text-base">
            {generating ? <><Spinner /> Generating...</> : <><Sparkles className="w-5 h-5" /> Generate AI Notes</>}
          </button>
        </div>

        {/* Output side */}
        <div className="space-y-5">
          {generating && (
            <SectionCard className="min-h-[400px] flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center mb-4 animate-pulse-soft">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <p className="font-semibold">AI is analyzing your lecture…</p>
              <p className="text-sm text-slate-500 mt-1">Extracting key points, definitions, and study aids</p>
              <Spinner className="w-6 h-6 mt-4" />
            </SectionCard>
          )}

          {!generating && !result && (
            <SectionCard className="min-h-[400px] flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-200/50 dark:bg-slate-700/50 flex items-center justify-center mb-4">
                <ClipboardList className="w-7 h-7 text-slate-400" />
              </div>
              <p className="font-semibold">Your generated notes will appear here</p>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">Enter lecture content, choose a style, and click Generate.</p>
            </SectionCard>
          )}

          {result && (
            <div className="animate-fade-in-scale space-y-5">
              {/* Result header */}
              <SectionCard>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-lg">{result.title}</h3>
                    <p className="text-sm text-slate-500">{result.subject}</p>
                  </div>
                  <span className="chip bg-brand-500/10 text-brand-600 dark:text-brand-400 capitalize">{style} style</span>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {tags.map((t) => (
                      <span key={t} className="chip bg-slate-200/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">#{t}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button onClick={handleGenerate} className="btn-ghost text-sm">
                    <RefreshCw className="w-4 h-4" /> Regenerate
                  </button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary text-sm ml-auto">
                    {saving ? <><Spinner /> Saving...</> : <><Save className="w-4 h-4" /> Save to Library</>}
                  </button>
                </div>
              </SectionCard>

              {/* Tabbed sections */}
              <SectionCard className="p-0 overflow-hidden">
                <div className="flex gap-1 p-2 border-b border-slate-200/50 dark:border-slate-700/50 overflow-x-auto">
                  {availableTabs.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setActiveTab(s.key)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors',
                        activeTab === s.key ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400' : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5'
                      )}
                    >
                      <s.icon className="w-3.5 h-3.5" />
                      {s.label}
                    </button>
                  ))}
                </div>
                <div className="p-5 max-h-[500px] overflow-y-auto">
                  <SectionRenderer tab={activeTab} result={result} />
                </div>
              </SectionCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionRenderer({ tab, result }: { tab: keyof NoteContent; result: GenerateResult }) {
  switch (tab) {
    case 'summary':
      return <p className="text-sm leading-relaxed">{result.summary}</p>;
    case 'keyPoints':
      return (
        <ul className="space-y-2">
          {result.keyPoints?.map((p, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-brand-500/10 text-brand-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              {p}
            </li>
          ))}
        </ul>
      );
    case 'definitions':
      return (
        <dl className="space-y-3">
          {result.definitions?.map((d, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <dt className="font-semibold text-sm text-brand-600 dark:text-brand-400">{d.term}</dt>
              <dd className="text-sm text-slate-600 dark:text-slate-300 mt-1">{d.definition}</dd>
            </div>
          ))}
        </dl>
      );
    case 'formulas':
      return (
        <div className="space-y-2">
          {result.formulas?.map((f, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-900 text-accent-300 font-mono text-sm">{f}</div>
          ))}
        </div>
      );
    case 'dates':
      return (
        <ul className="space-y-2">
          {result.dates?.map((d, i) => (
            <li key={i} className="flex items-start gap-3 text-sm">
              <span className="chip bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">{d.date}</span>
              {d.event}
            </li>
          ))}
        </ul>
      );
    case 'examples':
      return (
        <ul className="space-y-2">
          {result.examples?.map((e, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              {e}
            </li>
          ))}
        </ul>
      );
    case 'faqs':
      return (
        <div className="space-y-3">
          {result.faqs?.map((f, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <p className="font-semibold text-sm">{f.question}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{f.answer}</p>
            </div>
          ))}
        </div>
      );
    case 'examPrep':
      return <ExamPrepView prep={result.examPrep} />;
    case 'quiz':
      return (
        <div className="space-y-4">
          {result.quiz?.map((q, i) => <QuizItem key={i} index={i} q={q} />)}
        </div>
      );
    case 'flashcards':
      return (
        <div className="grid sm:grid-cols-2 gap-3">
          {result.flashcards?.map((c, i) => (
            <div key={i} className="card p-4">
              <p className="font-semibold text-sm text-brand-600 dark:text-brand-400">{c.front}</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">{c.back}</p>
            </div>
          ))}
        </div>
      );
    case 'actionItems':
      return (
        <ul className="space-y-2">
          {result.actionItems?.map((a, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckSquare className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              {a}
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

function QuizItem({ index, q }: { index: number; q: QuizQuestion }) {
  const [selected, setSelected] = useState<number | string | boolean | null>(null);
  const answered = selected !== null;
  const typeLabel: Record<QuizQuestion['type'], string> = {
    mcq: 'MCQ', truefalse: 'True / False', fillblank: 'Fill in the Blank',
    shortanswer: 'Short Answer', scenario: 'Scenario',
  };
  const typeColor: Record<QuizQuestion['type'], string> = {
    mcq: 'bg-brand-500/10 text-brand-600 dark:text-brand-400',
    truefalse: 'bg-emerald-500/10 text-emerald-600',
    fillblank: 'bg-amber-500/10 text-amber-600',
    shortanswer: 'bg-violet-500/10 text-violet-600',
    scenario: 'bg-rose-500/10 text-rose-600',
  };

  const isCorrect = (() => {
    if (q.type === 'mcq') return selected === q.answer;
    if (q.type === 'truefalse') return selected === q.answer;
    return false;
  })();

  return (
    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <div className="flex items-center gap-2 mb-2">
        <span className={cn('chip text-[10px]', typeColor[q.type])}>{typeLabel[q.type]}</span>
        <span className="text-xs text-slate-400">Q{index + 1}</span>
      </div>
      <p className="font-semibold text-sm mb-3">{q.question}</p>

      {q.type === 'mcq' && q.options && typeof q.answer === 'number' && (
        <div className="space-y-1.5">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => !answered && setSelected(i)}
              disabled={answered}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors border',
                !answered && 'border-slate-200 dark:border-slate-700 hover:border-brand-400',
                answered && i === q.answer && 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
                answered && i === selected && i !== q.answer && 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400',
                answered && i !== q.answer && i !== (selected as number) && 'border-slate-200 dark:border-slate-700 opacity-60'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {q.type === 'truefalse' && typeof q.answer === 'boolean' && (
        <div className="flex gap-2">
          {[true, false].map((val) => (
            <button
              key={String(val)}
              onClick={() => !answered && setSelected(val)}
              disabled={answered}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors',
                !answered && 'border-slate-200 dark:border-slate-700 hover:border-brand-400',
                answered && val === q.answer && 'border-emerald-500 bg-emerald-500/10 text-emerald-600',
                answered && val === selected && val !== q.answer && 'border-rose-500 bg-rose-500/10 text-rose-600',
                answered && val !== q.answer && val !== selected && 'border-slate-200 dark:border-slate-700 opacity-60'
              )}
            >
              {val ? 'True' : 'False'}
            </button>
          ))}
        </div>
      )}

      {q.type === 'fillblank' && (
        <FillBlankInput q={q} answered={answered} selected={typeof selected === 'string' ? selected : null} setSelected={setSelected} />
      )}

      {(q.type === 'shortanswer' || q.type === 'scenario') && (
        <OpenAnswerInput q={q} />
      )}

      {answered && (q.type === 'mcq' || q.type === 'truefalse') && (
        <p className={cn('text-xs mt-2 font-medium', isCorrect ? 'text-emerald-600' : 'text-rose-600')}>
          {isCorrect ? 'Correct!' : `Answer: ${q.type === 'truefalse' ? (q.answer ? 'True' : 'False') : q.options?.[q.answer as number]}`}
          {q.explanation && <span className="block text-slate-500 font-normal mt-0.5">{q.explanation}</span>}
        </p>
      )}
    </div>
  );
}

function FillBlankInput({ q, answered, selected, setSelected }: {
  q: QuizQuestion; answered: boolean; selected: string | null;
  setSelected: (v: string) => void;
}) {
  const [value, setValue] = useState('');
  const submit = () => { if (value.trim()) setSelected(value.trim().toLowerCase()); };
  const correct = typeof q.answer === 'string' && selected === q.answer.toLowerCase();
  return (
    <div>
      {!answered ? (
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Type your answer…"
          />
          <button onClick={submit} className="btn-primary text-sm">Check</button>
        </div>
      ) : (
        <div className={cn('p-3 rounded-lg text-sm border', correct ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600' : 'border-rose-500 bg-rose-500/10 text-rose-600')}>
          {correct ? 'Correct!' : `Answer: ${q.answer}`}
        </div>
      )}
    </div>
  );
}

function OpenAnswerInput({ q }: { q: QuizQuestion }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div>
      <textarea rows={2} className="input resize-none text-sm mb-2" placeholder="Write your answer…" />
      <button onClick={() => setRevealed(true)} className="btn-ghost text-sm">
        {revealed ? 'Reference Answer:' : 'Reveal Answer'}
      </button>
      {revealed && typeof q.answer === 'string' && (
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 p-3 rounded-lg bg-brand-500/5 border border-brand-500/20">
          {q.answer}
        </p>
      )}
    </div>
  );
}

function ExamPrepView({ prep }: { prep?: ExamPrep }) {
  if (!prep) return <p className="text-sm text-slate-500">Exam prep is available in Exam Preparation mode.</p>;
  const groups: { title: string; items: string[] }[] = [
    { title: '2-Mark Questions', items: prep.twoMark },
    { title: '5-Mark Questions', items: prep.fiveMark },
    { title: '10-Mark Questions', items: prep.tenMark },
    { title: 'Frequently Asked Theory', items: prep.theory },
  ];
  return (
    <div className="space-y-5">
      {groups.map((g) => g.items.length > 0 && (
        <div key={g.title}>
          <h4 className="font-semibold text-sm text-brand-600 dark:text-brand-400 mb-2">{g.title}</h4>
          <ol className="space-y-1.5 list-decimal pl-5">
            {g.items.map((q, i) => <li key={i} className="text-sm">{q}</li>)}
          </ol>
        </div>
      ))}
      {prep.definitions.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-brand-600 dark:text-brand-400 mb-2">Important Definitions</h4>
          <dl className="space-y-2">
            {prep.definitions.map((d, i) => (
              <div key={i} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <dt className="font-semibold text-sm">{d.term}</dt>
                <dd className="text-sm text-slate-600 dark:text-slate-300 mt-0.5">{d.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
      {prep.formulas.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-brand-600 dark:text-brand-400 mb-2">Formulae</h4>
          <div className="space-y-1.5">
            {prep.formulas.map((f, i) => <div key={i} className="p-2 rounded bg-slate-900 text-accent-300 font-mono text-sm">{f}</div>)}
          </div>
        </div>
      )}
      {prep.diagrams.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-brand-600 dark:text-brand-400 mb-2">Diagrams to Practice</h4>
          <ul className="space-y-1.5 list-disc pl-5">
            {prep.diagrams.map((d, i) => <li key={i} className="text-sm">{d}</li>)}
          </ul>
        </div>
      )}
      {prep.tips.length > 0 && (
        <div>
          <h4 className="font-semibold text-sm text-brand-600 dark:text-brand-400 mb-2">Last-Minute Revision Tips</h4>
          <ul className="space-y-1.5 list-disc pl-5">
            {prep.tips.map((t, i) => <li key={i} className="text-sm">{t}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
