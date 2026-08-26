import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Bold, Italic, Underline, Heading1, Heading2, Heading3, List, ListOrdered,
  Table, Link2, Image, Undo2, Redo2, Save, ArrowLeft, Quote, CheckCircle2,
} from 'lucide-react';
import { useNotes } from '@/lib/hooks';
import { useToast } from '@/context/ToastContext';

const TOOLS = [
  { icon: Bold, cmd: 'bold', label: 'Bold' },
  { icon: Italic, cmd: 'italic', label: 'Italic' },
  { icon: Underline, cmd: 'underline', label: 'Underline' },
  { icon: Heading1, cmd: 'formatBlock', arg: 'h1', label: 'Heading 1' },
  { icon: Heading2, cmd: 'formatBlock', arg: 'h2', label: 'Heading 2' },
  { icon: Heading3, cmd: 'formatBlock', arg: 'h3', label: 'Heading 3' },
  { icon: Quote, cmd: 'formatBlock', arg: 'blockquote', label: 'Quote' },
  { icon: List, cmd: 'insertUnorderedList', label: 'Bullet List' },
  { icon: ListOrdered, cmd: 'insertOrderedList', label: 'Numbered List' },
];

export function EditorPage() {
  const { id } = useParams();
  const { notes, updateNote } = useNotes();
  const { notify } = useToast();
  const note = notes.find((n) => n.id === id);

  const editorRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(note?.title ?? '');
  const [subject, setSubject] = useState(note?.subject ?? '');
  const [tags, setTags] = useState<string[]>(note?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  useEffect(() => {
    if (!note) return;
    setTitle(note.title);
    setSubject(note.subject ?? '');
    setTags(note.tags);
    if (editorRef.current && !editorRef.current.innerHTML) {
      editorRef.current.innerHTML = note.content.editorHtml || note.content.completeNotes || '';
    }
  }, [note]);

  const exec = (cmd: string, arg?: string) => {
    document.execCommand(cmd, false, arg);
    editorRef.current?.focus();
    setDirty(true);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) { exec('createLink', url); }
  };

  const insertImage = () => {
    const url = prompt('Enter image URL:');
    if (url) { exec('insertImage', url); }
  };

  const insertTable = () => {
    const html = `<table><thead><tr><th>Column 1</th><th>Column 2</th></tr></thead><tbody><tr><td>&nbsp;</td><td>&nbsp;</td></tr></tbody></table><p><br/></p>`;
    document.execCommand('insertHTML', false, html);
    setDirty(true);
  };

  const getContentHtml = useCallback(() => editorRef.current?.innerHTML ?? '', []);

  const save = async () => {
    if (!note) return;
    setSaving(true);
    const html = getContentHtml();
    const ok = await updateNote(note.id, {
      title,
      subject,
      tags,
      content: { ...note.content, editorHtml: html, completeNotes: html },
    });
    setSaving(false);
    if (ok) {
      setDirty(false);
      setLastSaved(new Date().toLocaleTimeString());
      notify('Notes saved', 'success');
    } else {
      notify('Save failed. Please try again.', 'error');
    }
  };

  // Autosave every 30s if dirty
  useEffect(() => {
    if (!dirty || !note) return;
    const t = setTimeout(() => { void save(); }, 30000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dirty, note, title, subject, tags]);

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput('');
  };

  if (!note) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Note not found.</p>
        <Link to="/notes" className="btn-primary mt-4">Back to Notes</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <Link to="/notes" className="btn-ghost text-sm">
          <ArrowLeft className="w-4 h-4" /> All Notes
        </Link>
        <div className="flex items-center gap-3">
          {lastSaved && !dirty && (
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Saved at {lastSaved}
            </span>
          )}
          {dirty && <span className="text-xs text-amber-500">Unsaved changes</span>}
          <button onClick={save} disabled={saving} className="btn-primary text-sm">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="card p-4 mb-4 space-y-3">
        <input
          className="w-full text-2xl font-bold bg-transparent outline-none"
          value={title}
          onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
          placeholder="Note title"
        />
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            className="input flex-1"
            value={subject}
            onChange={(e) => { setSubject(e.target.value); setDirty(true); }}
            placeholder="Subject"
          />
          <div className="flex items-center gap-2 flex-1">
            <div className="flex flex-wrap gap-1.5 items-center flex-1">
              {tags.map((t) => (
                <span key={t} className="chip bg-brand-500/10 text-brand-600 dark:text-brand-400">
                  #{t}
                  <button onClick={() => { setTags(tags.filter((x) => x !== t)); setDirty(true); }} className="hover:text-rose-500">×</button>
                </span>
              ))}
              <input
                className="flex-1 min-w-[80px] bg-transparent text-sm outline-none"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tag…"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="card p-2 mb-4 sticky top-20 z-20 glass-strong">
        <div className="flex items-center gap-1 flex-wrap">
          {TOOLS.map((t) => (
            <button
              key={t.label}
              onClick={() => exec(t.cmd, t.arg)}
              className="btn-ghost p-2 rounded-lg"
              title={t.label}
              aria-label={t.label}
            >
              <t.icon className="w-4 h-4" />
            </button>
          ))}
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
          <button onClick={insertTable} className="btn-ghost p-2 rounded-lg" title="Table" aria-label="Insert table">
            <Table className="w-4 h-4" />
          </button>
          <button onClick={insertLink} className="btn-ghost p-2 rounded-lg" title="Hyperlink" aria-label="Insert link">
            <Link2 className="w-4 h-4" />
          </button>
          <button onClick={insertImage} className="btn-ghost p-2 rounded-lg" title="Image" aria-label="Insert image">
            <Image className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
          <button onClick={() => exec('undo')} className="btn-ghost p-2 rounded-lg" title="Undo" aria-label="Undo">
            <Undo2 className="w-4 h-4" />
          </button>
          <button onClick={() => exec('redo')} className="btn-ghost p-2 rounded-lg" title="Redo" aria-label="Redo">
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={() => setDirty(true)}
        className="card p-6 min-h-[500px] prose-notes focus:outline-none"
        style={{ outline: 'none' }}
      />
    </div>
  );
}
