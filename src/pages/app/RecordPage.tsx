import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Mic, Pause, Play, Square, ArrowRight, Save, Trash2, AudioLines, Clock,
} from 'lucide-react';
import { PageHeader, SectionCard, EmptyState } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { useLectures } from '@/lib/hooks';
import { formatDuration } from '@/lib/utils';

type RecState = 'idle' | 'recording' | 'paused' | 'stopped';

export function RecordPage() {
  const { notify } = useToast();
  const { createLecture } = useLectures();

  const [state, setState] = useState<RecState>('idle');
  const [seconds, setSeconds] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [levels, setLevels] = useState<number[]>(new Array(40).fill(0.1));
  const [subject, setSubject] = useState('');
  const [saving, setSaving] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobRef = useRef<Blob | null>(null);

  const stopAnalyser = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);

  const cleanupStream = useCallback(() => {
    stopAnalyser();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
  }, [stopAnalyser]);

  useEffect(() => () => cleanupStream(), [cleanupStream]);

  const startAnalyser = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(data);
      const bars: number[] = [];
      const step = Math.floor(data.length / 40);
      for (let i = 0; i < 40; i++) {
        const v = data[i * step] / 255;
        bars.push(Math.max(0.08, v));
      }
      setLevels(bars);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
      };

      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      recorder.start();
      setState('recording');
      setSeconds(0);
      setLevels(new Array(40).fill(0.1));
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      startAnalyser();
      notify('Recording started', 'info');
    } catch {
      notify('Could not access microphone. Please check permissions.', 'error');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setState('paused');
      if (timerRef.current) clearInterval(timerRef.current);
      stopAnalyser();
      notify('Recording paused', 'info');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      setState('recording');
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      startAnalyser();
      notify('Recording resumed', 'info');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setState('stopped');
    cleanupStream();
    setLevels(new Array(40).fill(0.1));
    notify('Recording stopped', 'success');
  };

  const reset = () => {
    setState('idle');
    setSeconds(0);
    setAudioUrl(null);
    blobRef.current = null;
    setSubject('');
  };

  const saveRecording = async () => {
    if (!blobRef.current) return;
    setSaving(true);
    const fileName = subject
      ? `${subject.replace(/\s+/g, '_')}_lecture.webm`
      : `lecture_${Date.now()}.webm`;

    // Generate a placeholder transcript for the saved recording
    const transcript = `Recording saved: ${fileName}. Duration: ${formatDuration(seconds)}. Audio captured via microphone recording. Subject: ${subject || 'General'}.`;

    await createLecture({
      file_name: fileName,
      subject: subject || 'General',
      duration_seconds: seconds,
      source_type: 'recording',
      status: 'completed',
      transcript,
    });

    setSaving(false);
    notify('Recording saved to your history!', 'success');
    reset();
  };

  const isLive = state === 'recording' || state === 'paused';

  return (
    <div>
      <PageHeader
        title="Record Lecture"
        subtitle="Capture your lecture live. Recording saves automatically to your history."
        icon={Mic}
      />

      <div className="max-w-2xl mx-auto">
        <SectionCard className="text-center">
          {/* Timer */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-slate-400" />
            <span className="text-4xl font-bold font-mono tracking-tight tabular-nums">
              {formatDuration(seconds)}
            </span>
          </div>

          {/* Status pill */}
          <div className={`inline-flex items-center gap-2 chip mb-8 ${
            state === 'recording' ? 'bg-rose-500/10 text-rose-600' :
            state === 'paused' ? 'bg-amber-500/10 text-amber-600' :
            state === 'stopped' ? 'bg-emerald-500/10 text-emerald-600' :
            'bg-slate-500/10 text-slate-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${state === 'recording' ? 'bg-rose-500 animate-pulse' : state === 'paused' ? 'bg-amber-500' : state === 'stopped' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {state === 'idle' ? 'Ready to record' : state.charAt(0).toUpperCase() + state.slice(1)}
          </div>

          {/* Waveform */}
          <div className="flex items-center justify-center gap-1 h-32 mb-8">
            {levels.map((lvl, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-gradient-to-t from-brand-500 to-accent-400 transition-all duration-75"
                style={{
                  height: `${Math.max(8, lvl * 100)}%`,
                  opacity: isLive ? 1 : 0.3,
                }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            {state === 'idle' && (
              <button onClick={startRecording} className="btn-primary px-7 py-3 text-base">
                <Mic className="w-5 h-5" /> Start Recording
              </button>
            )}
            {state === 'recording' && (
              <button onClick={pauseRecording} className="btn-secondary px-6 py-3">
                <Pause className="w-5 h-5" /> Pause
              </button>
            )}
            {state === 'paused' && (
              <button onClick={resumeRecording} className="btn-primary px-6 py-3">
                <Play className="w-5 h-5" /> Resume
              </button>
            )}
            {isLive && (
              <button onClick={stopRecording} className="btn-danger px-6 py-3">
                <Square className="w-4 h-4" /> Stop
              </button>
            )}
            {state === 'stopped' && (
              <button onClick={reset} className="btn-ghost px-5 py-3">
                <Trash2 className="w-4 h-4" /> Discard
              </button>
            )}
          </div>
        </SectionCard>

        {/* Audio preview + save */}
        {state === 'stopped' && audioUrl && (
          <SectionCard title="Audio Preview" icon={AudioLines} className="mt-6 animate-fade-in-scale">
            <audio src={audioUrl} controls className="w-full mb-4" />
            <div>
              <label className="label" htmlFor="subject">Subject (optional)</label>
              <input
                id="subject"
                className="input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Introduction to Biology"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={saveRecording} disabled={saving} className="btn-primary flex-1">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Recording'}
              </button>
              <Link to="/generate" state={{ transcript: `Recording saved. Duration: ${formatDuration(seconds)}.`, title: subject || 'Recorded Lecture' }} className="btn-secondary flex-1 justify-center">
                Generate Notes <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </SectionCard>
        )}

        {state === 'idle' && (
          <div className="mt-6">
            <EmptyState
              icon={AudioLines}
              title="No active recording"
              description="Press Start Recording to capture your lecture. Your audio is processed locally and saved to your history."
            />
          </div>
        )}
      </div>
    </div>
  );
}
