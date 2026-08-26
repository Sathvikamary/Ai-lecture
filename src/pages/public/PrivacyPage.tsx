import { Shield, Database, BrainCircuit, HardDrive, Lock, Cookie, UserCheck, FileLock2 } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/ui';

const SECTIONS = [
  { icon: Database, title: 'Data Collection', body: 'We collect only the information necessary to provide the service: your name, email, profile details, and the lecture content you record or upload. We do not collect data from third-party sources or track your activity outside the application.' },
  { icon: BrainCircuit, title: 'AI Processing', body: 'When you record or upload content, our AI engine processes it to generate notes, summaries, flashcards, and quizzes. Processing happens to produce your structured output. Your content is not used to train external models or shared with third-party AI providers.' },
  { icon: HardDrive, title: 'File Storage', body: 'Your recordings and uploaded files are stored securely in an authenticated database. Each user can only access their own files through row-level security policies enforced at the database level. Files are never publicly accessible.' },
  { icon: UserCheck, title: 'User Privacy', body: 'Your notes, recordings, and profile are private to your account. Other users cannot see, access, or search your data. You control what you share via export links, and you can delete your data at any time from Settings.' },
  { icon: Lock, title: 'Security', body: 'We use industry-standard security practices: passwords are hashed (never stored in plain text), all data in transit is encrypted via HTTPS, and row-level security ensures users can only access their own records. Sessions expire automatically.' },
  { icon: Cookie, title: 'Cookies', body: 'We use essential cookies to maintain your authenticated session and remember your preferences (like theme and font size). We do not use advertising or third-party tracking cookies. You can clear cookies by signing out.' },
  { icon: FileLock2, title: 'User Rights', body: 'You have the right to access, export, modify, and delete your data at any time. Use the Export page to download your notes, or the Settings page to update your profile or delete your account. Deleting your account permanently removes all associated data.' },
];

export function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <PageHeader title="Privacy Policy" subtitle="Your data, your control. Last updated August 2026." icon={Shield} />

      <div className="card p-6 mb-8 bg-brand-500/5 border-brand-500/20">
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          We take your privacy seriously. This policy explains what data we collect, how we use it,
          and the controls you have. By using Synapse, you agree to the practices described here.
        </p>
      </div>

      <div className="space-y-5">
        {SECTIONS.map((s, i) => (
          <SectionCard key={s.title}>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
                <s.icon className="w-5 h-5 text-brand-500" />
              </div>
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="text-xs text-slate-400">{String(i + 1).padStart(2, '0')}</span>
                  {s.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">{s.body}</p>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>

      <div className="card p-6 mt-8 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Questions about your privacy? Email us at <span className="text-brand-500 font-medium">sk0981@srmist.edu.in</span>
        </p>
      </div>
    </div>
  );
}
