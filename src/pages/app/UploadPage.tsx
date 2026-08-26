import { useState, useRef, useCallback, type DragEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload, FileAudio, FileText, X, CheckCircle2, ArrowRight, FileType2, AlertCircle,
} from 'lucide-react';
import { PageHeader, SectionCard, EmptyState } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useLectures } from '@/lib/hooks';
import { formatBytes, cn } from '@/lib/utils';
import { extractFileText, EXTRACTABLE_TYPES } from '@/lib/file-extract';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  text?: string;
  status: 'uploading' | 'extracting' | 'done' | 'error';
  error?: string;
}

const AUDIO_TYPES = ['mp3', 'wav', 'm4a', 'webm', 'ogg'];
const ACCEPTED = [...AUDIO_TYPES, ...EXTRACTABLE_TYPES];

export function UploadPage() {
  const { notify } = useToast();
  const { createLecture } = useLectures();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [subject, setSubject] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    for (const file of arr) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
      if (!ACCEPTED.includes(ext)) {
        notify(`Unsupported file type: .${ext}`, 'error');
        continue;
      }
      const id = Math.random().toString(36).slice(2);
      const uploaded: UploadedFile = {
        id, name: file.name, size: file.size, type: file.type || ext, progress: 0, status: 'uploading',
      };
      setFiles((f) => [...f, uploaded]);

      // Stage 1: upload progress
      for (let p = 10; p <= 50; p += 10) {
        await new Promise((r) => setTimeout(r, 60));
        setFiles((f) => f.map((x) => (x.id === id ? { ...x, progress: p } : x)));
      }

      // Stage 2: text extraction (documents only)
      if (EXTRACTABLE_TYPES.includes(ext)) {
        setFiles((f) => f.map((x) => (x.id === id ? { ...x, status: 'extracting', progress: 60 } : x)));
        try {
          const text = await extractFileText(file);
          setFiles((f) => f.map((x) => (x.id === id ? { ...x, progress: 100, status: 'done', text } : x)));
          notify(`${file.name}: ${text.split(/\s+/).length} words extracted`, 'success');
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Could not extract text';
          setFiles((f) => f.map((x) => (x.id === id ? { ...x, status: 'error', error: msg } : x)));
          notify(`${file.name}: ${msg}`, 'error');
        }
      } else {
        // Audio files — no in-browser transcription; store a note for history.
        setFiles((f) => f.map((x) => (x.id === id ? {
          ...x, progress: 100, status: 'done',
          text: `[Audio file: ${file.name}. Transcription requires playback — use the Record feature for live capture.]`,
        } : x)));
        notify(`${file.name} uploaded`, 'success');
      }
    }
  }, [notify]);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles((f) => f.filter((x) => x.id !== id));
  };

  const doneFiles = files.filter((f) => f.status === 'done' && f.text && !f.text.startsWith('[Audio'));
  const combinedText = doneFiles.map((f) => f.text ?? '').join('\n\n');

  const saveAll = async () => {
    const toSave = files.filter((f) => f.status === 'done');
    if (toSave.length === 0) return;
    for (const f of toSave) {
      await createLecture({
        file_name: f.name,
        subject: subject || 'General',
        duration_seconds: 0,
        source_type: 'upload',
        status: 'completed',
        transcript: f.text,
      });
    }
    notify(`${toSave.length} file(s) saved to your history!`, 'success');
    setFiles([]);
    setSubject('');
  };

  const fileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    return AUDIO_TYPES.includes(ext) ? FileAudio : FileText;
  };

  const statusLabel = (f: UploadedFile) => {
    if (f.status === 'uploading') return 'Uploading…';
    if (f.status === 'extracting') return 'Extracting text…';
    if (f.status === 'done') return 'Ready';
    if (f.status === 'error') return 'Failed';
    return '';
  };

  return (
    <div>
      <PageHeader
        title="Upload Audio / PDF"
        subtitle="Upload lecture recordings or documents. We support MP3, WAV, M4A, PDF, DOCX, PPTX, and TXT."
        icon={Upload}
      />

      <div className="max-w-3xl mx-auto">
        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'card p-10 border-2 border-dashed cursor-pointer text-center transition-all',
            dragging ? 'border-brand-500 bg-brand-500/5 scale-[1.01]' : 'border-slate-300 dark:border-slate-700 hover:border-brand-400'
          )}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED.map((e) => `.${e}`).join(',')}
            className="hidden"
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/15 to-accent-500/15 flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-brand-500" />
          </div>
          <h3 className="font-semibold text-lg">Drop files here or click to browse</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Audio: MP3, WAV, M4A · Documents: PDF, DOCX, PPTX, TXT
          </p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <SectionCard title="Uploaded Files" className="mt-6 animate-fade-in">
            <div className="space-y-3">
              {files.map((f) => {
                const Icon = fileIcon(f.name);
                return (
                  <div key={f.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-brand-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.name}</p>
                      <p className="text-xs text-slate-500">{formatBytes(f.size)}</p>
                      {(f.status === 'uploading' || f.status === 'extracting') && (
                        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${f.progress}%` }} />
                        </div>
                      )}
                      {f.status === 'done' && (
                        <p className="text-xs text-emerald-500 flex items-center gap-1 mt-1">
                          <CheckCircle2 className="w-3 h-3" /> {statusLabel(f)}
                          {f.text && !f.text.startsWith('[Audio') && (
                            <span className="text-slate-400">· {f.text.split(/\s+/).length} words</span>
                          )}
                        </p>
                      )}
                      {f.status === 'error' && (
                        <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" /> {f.error}
                        </p>
                      )}
                    </div>
                    <button onClick={() => removeFile(f.id)} className="btn-ghost p-2 rounded-lg" aria-label="Remove file">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
              <label className="label" htmlFor="subj">Subject (optional)</label>
              <input id="subj" className="input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Organic Chemistry" />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <button onClick={saveAll} disabled={files.filter((f) => f.status === 'done').length === 0} className="btn-primary flex-1">
                Save {files.filter((f) => f.status === 'done').length} File{files.filter((f) => f.status === 'done').length !== 1 ? 's' : ''} to History
              </button>
              <Link
                to="/generate"
                state={{ transcript: combinedText, title: subject || 'Uploaded Lecture' }}
                className="btn-secondary flex-1 justify-center"
              >
                <FileType2 className="w-4 h-4" /> Generate Notes <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </SectionCard>
        )}

        {files.length === 0 && (
          <div className="mt-6">
            <EmptyState
              icon={FileText}
              title="No files uploaded yet"
              description="Drag and drop your lecture files above, or click to browse. Documents are processed and their text is extracted automatically."
            />
          </div>
        )}
      </div>
    </div>
  );
}
