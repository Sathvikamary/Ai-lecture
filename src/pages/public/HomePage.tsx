import { Link } from 'react-router-dom';
import {
  Sparkles, Mic, FileText, Search, Brain, Zap, ArrowRight, Star,
  CheckCircle2, Upload, BookOpen, Wand2, Quote,
} from 'lucide-react';

const FEATURES = [
  { icon: Mic, title: 'Record Lectures', desc: 'Capture lectures live with real-time waveform and automatic saving.', color: 'from-rose-500/20 to-rose-500/5' },
  { icon: Upload, title: 'Upload Anything', desc: 'Drop audio (MP3, WAV, M4A) or documents (PDF, DOCX, TXT).', color: 'from-brand-500/20 to-brand-500/5' },
  { icon: Brain, title: 'AI Note Generation', desc: 'Auto-extract key points, definitions, formulas, dates & examples.', color: 'from-accent-500/20 to-accent-500/5' },
  { icon: Wand2, title: 'Flashcards & Quizzes', desc: 'Turn any lecture into study-ready flashcards and quiz questions.', color: 'from-violet-500/20 to-violet-500/5' },
  { icon: Search, title: 'Smart Search', desc: 'Find notes by title, subject, keyword, tag or date instantly.', color: 'from-emerald-500/20 to-emerald-500/5' },
  { icon: FileText, title: 'Export Anywhere', desc: 'Download as PDF, Word or plain text. Print or share links.', color: 'from-amber-500/20 to-amber-500/5' },
];

const STEPS = [
  { icon: Mic, title: 'Record or Upload', desc: 'Capture a lecture live or upload an existing audio file or document.' },
  { icon: Sparkles, title: 'AI Processes It', desc: 'Our AI extracts key points, definitions, formulas, and generates study aids.' },
  { icon: BookOpen, title: 'Review & Edit', desc: 'Open notes in a rich editor. Tweak, organize, and add your own notes.' },
  { icon: Zap, title: 'Study & Export', desc: 'Use flashcards, take quizzes, and export notes in any format.' },
];

const TESTIMONIALS = [
  { name: 'Sarah Chen', role: 'Biology Major, Stanford', text: 'Synapse cut my study time in half. The flashcards alone are worth it — I just record the lecture and everything is organized by the time I get home.', avatar: 'SC' },
  { name: 'Marcus Johnson', role: 'Engineering Student, MIT', text: 'The formula extraction is scary good. It caught equations my professor mentioned once and I would have totally missed. A genuine lifesaver for exams.', avatar: 'MJ' },
  { name: 'Priya Patel', role: 'Law Student, Oxford', text: 'I upload my case PDFs and get structured notes with definitions and key points in seconds. The export to Word feature is perfectly integrated.', avatar: 'PP' },
];

export function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 chip bg-brand-500/10 text-brand-600 dark:text-brand-400 mb-6 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            AI-powered lecture notes for students
          </div>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.05] animate-slide-up">
            Transform Every Lecture into <span className="text-gradient">Smart AI Notes</span>.
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mt-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Record lectures, upload files, and let AI generate complete notes, key points, flashcards, and quizzes — all in one beautiful workspace.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/signup" className="btn-primary text-base px-7 py-3 group">
              Get Started Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/about" className="btn-secondary text-base px-7 py-3">Learn More</Link>
          </div>

          {/* Floating preview card */}
          <div className="mt-16 max-w-5xl mx-auto animate-fade-in-scale" style={{ animationDelay: '0.3s' }}>
            <div className="glass-strong rounded-3xl shadow-glass-lg p-2">
              <div className="rounded-2xl bg-white/40 dark:bg-slate-900/40 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/50 dark:border-slate-700/50">
                  <div className="w-3 h-3 rounded-full bg-rose-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-3 text-xs text-slate-400">synapse.app/dashboard</span>
                </div>
                <div className="grid sm:grid-cols-3 gap-4 p-6 text-left">
                  {[
                    { label: 'Total Lectures', value: '24', icon: Mic, c: 'text-rose-500' },
                    { label: 'AI Notes', value: '186', icon: Brain, c: 'text-brand-500' },
                    { label: 'Flashcards', value: '1,240', icon: Zap, c: 'text-accent-500' },
                  ].map((s) => (
                    <div key={s.label} className="card p-4">
                      <s.icon className={`w-5 h-5 ${s.c} mb-2`} />
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-slate-500">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="px-6 pb-6 text-left">
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-brand-500" />
                      <span className="text-sm font-semibold">AI Generated Notes — Introduction to Cell Biology</span>
                    </div>
                    <div className="space-y-2">
                      {['Cell theory: all living things are made of cells', 'Mitochondria is the powerhouse of the cell', 'Photosynthesis converts light to energy'].map((p) => (
                        <div key={p} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything you need to ace your classes</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-4">Powerful AI tools designed for how students actually study.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="card p-6 hover:shadow-glass hover:-translate-y-1 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="w-6 h-6 text-slate-700 dark:text-slate-200" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How it works</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-4">From lecture to study-ready notes in four simple steps.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 relative">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative">
              <div className="card p-6 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-brand-500" />
                  </div>
                  <span className="text-3xl font-bold text-slate-200 dark:text-slate-700">{i + 1}</span>
                </div>
                <h3 className="font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{s.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowRight className="hidden lg:block w-5 h-5 text-slate-300 dark:text-slate-600 absolute top-1/2 -right-3 -translate-y-1/2 z-10" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Loved by students everywhere</h2>
          <div className="flex items-center justify-center gap-1 mt-4">
            {[1,2,3,4,5].map((i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            <span className="text-sm text-slate-500 ml-2">4.9/5 from 2,000+ students</span>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card p-6 flex flex-col">
              <Quote className="w-8 h-8 text-brand-400/40 mb-3" />
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 flex-1">"{t.text}"</p>
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white text-sm font-semibold">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-accent-600 p-10 sm:p-16 text-center text-white">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 0%, transparent 50%)' }} />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Start taking smarter notes today</h2>
            <p className="text-white/80 mt-4 max-w-xl mx-auto">Join thousands of students who never miss a key point again. Free to get started.</p>
            <Link to="/signup" className="inline-flex items-center gap-2 bg-white text-brand-600 font-semibold rounded-xl px-7 py-3 mt-8 hover:scale-105 transition-transform">
              Create your free account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
