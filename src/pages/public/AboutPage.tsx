import { Target, Eye, Sparkles, GraduationCap, BookOpen, Zap, Heart, Crown, Star } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/ui';

const BENEFITS = [
  { icon: Zap, title: 'Save Hours Weekly', desc: 'AI organizes your lectures into structured notes instantly, so you spend time studying, not transcribing.' },
  { icon: BookOpen, title: 'Never Miss a Point', desc: 'Even if you zone out for a moment, the AI captures every key concept, definition, and example mentioned.' },
  { icon: GraduationCap, title: 'Ace Your Exams', desc: 'Auto-generated flashcards and quizzes turn passive listening into active recall practice.' },
];

const WORKFLOW = [
  { step: 'Input', title: 'Capture or Upload', desc: 'Record lectures live with waveform visualization, or upload existing audio files (MP3, WAV, M4A) and documents (PDF, DOCX, TXT).' },
  { step: 'Process', title: 'AI Analysis', desc: 'Our AI engine performs speech-to-text transcription, topic detection, keyword extraction, and grammatical correction on your content.' },
  { step: 'Generate', title: 'Structured Output', desc: 'Get complete notes, key points, definitions, formulas, important dates, examples, FAQs, quiz questions, and flashcards — all organized.' },
  { step: 'Refine', title: 'Edit & Export', desc: 'Refine notes in a rich text editor, then export to PDF, Word, or plain text. Share links with classmates or print for offline study.' },
];

const TEAM = [
  {
    name: 'Kasu Sathvika Mary',
    role: 'Founder',
    icon: Crown,
    bio: 'Sathvika is the visionary behind Synapse. As a student herself, she experienced firsthand the struggle of keeping up with lectures and organizing notes. She founded Synapse with a simple mission: to give every student a smarter way to learn. She leads product direction, design, and the overall strategy of the platform.',
    email: 'sk0981@srmist.edu.in',
  },
  {
    name: 'Anujaa C',
    role: 'Co-Founder',
    icon: Star,
    bio: 'Anujaa is the technical backbone of Synapse. As co-founder, she drives the engineering and AI capabilities that power the platform. Her passion for building tools that solve real student problems helped shape Synapse into the powerful note-taking companion it is today.',
    email: '',
  },
];

export function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <PageHeader
        title="About Synapse"
        subtitle="The smartest way to turn lectures into knowledge."
        icon={Sparkles}
      />

      <div className="prose-notes max-w-none mb-12">
        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          Synapse was built for one reason: students spend too much time transcribing and organizing
          lecture material, and not enough time actually learning it. We combine speech recognition,
          natural language processing, and structured note generation into a single workspace — so
          the moment a lecture ends, your study materials are already ready.
        </p>
      </div>

      {/* Founders */}
      <h2 className="text-2xl font-bold mt-14 mb-6">Meet the Founders</h2>
      <div className="grid md:grid-cols-2 gap-5 mb-14">
        {TEAM.map((m) => (
          <div key={m.name} className="card p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center shrink-0">
                <m.icon className="w-6 h-6 text-brand-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{m.name}</h3>
                <span className="chip bg-brand-500/10 text-brand-600 dark:text-brand-400 text-xs mt-1">{m.role}</span>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{m.bio}</p>
            {m.email && (
              <a href={`mailto:${m.email}`} className="inline-flex items-center gap-2 mt-4 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">
                {m.email}
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Purpose */}
      <SectionCard title="Our Purpose" icon={Target} className="mb-6">
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          To remove the busywork from learning. Every feature in Synapse exists to give you back
          time — recording, transcription, note generation, flashcards, quizzes, and export are all
          automated so you can focus on understanding and reviewing, not on shuffling papers and
          replaying audio at 0.5x speed.
        </p>
      </SectionCard>

      {/* Benefits */}
      <h2 className="text-2xl font-bold mt-14 mb-6">Benefits for Students</h2>
      <div className="grid md:grid-cols-3 gap-5 mb-14">
        {BENEFITS.map((b) => (
          <div key={b.title} className="card p-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500/15 to-accent-500/15 flex items-center justify-center mb-4">
              <b.icon className="w-5 h-5 text-brand-500" />
            </div>
            <h3 className="font-semibold mb-2">{b.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{b.desc}</p>
          </div>
        ))}
      </div>

      {/* AI Workflow */}
      <h2 className="text-2xl font-bold mb-6">The AI-Powered Workflow</h2>
      <div className="space-y-4 mb-14">
        {WORKFLOW.map((w, i) => (
          <div key={w.title} className="card p-6 flex gap-5">
            <div className="flex flex-col items-center shrink-0">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 font-bold text-sm">
                {i + 1}
              </div>
              {i < WORKFLOW.length - 1 && <div className="w-px h-full bg-slate-200 dark:bg-slate-700 mt-2 flex-1" />}
            </div>
            <div>
              <span className="chip bg-accent-500/10 text-accent-600 dark:text-accent-400 mb-2">{w.step}</span>
              <h3 className="font-semibold text-lg">{w.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{w.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mission & Vision */}
      <div className="grid md:grid-cols-2 gap-5">
        <SectionCard title="Our Mission" icon={Heart}>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            To make high-quality study materials accessible to every student, regardless of how fast
            they take notes or how complex the lecture is. We believe the tools you use to learn
            should work as hard as you do.
          </p>
        </SectionCard>
        <SectionCard title="Our Vision" icon={Eye}>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            A world where no student ever loses a key insight because they were busy writing down the
            previous sentence. Where every lecture becomes structured, searchable, and study-ready the
            instant it ends.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
