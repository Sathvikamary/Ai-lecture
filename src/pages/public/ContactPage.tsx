import { useState } from 'react';
import { Mail, MessageSquare, Clock, HelpCircle, ChevronDown, Send, LifeBuoy } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/ui';
import { useToast } from '@/context/ToastContext';
import { validateEmail } from '@/lib/utils';

const FAQS = [
  { q: 'How does AI note generation work?', a: 'After you record a lecture or upload a file, our AI engine analyzes the content to extract key points, definitions, formulas, important dates, and examples. It then structures everything into organized notes, flashcards, and quiz questions.' },
  { q: 'What file formats are supported?', a: 'For audio we support MP3, WAV, and M4A. For documents we support PDF, DOCX, and TXT files. You can also record lectures live directly in the app.' },
  { q: 'Are my notes private?', a: 'Yes. Each user has their own private workspace. Your recordings, notes, and data are only accessible to you through your authenticated account. We never share your content with third parties.' },
  { q: 'Can I export my notes?', a: 'Absolutely. You can export any note as PDF, Microsoft Word (.docx), or plain text. You can also print notes or generate a shareable link.' },
  { q: 'What note styles are available?', a: 'You can generate notes in four styles: Short Notes for quick overviews, Detailed Notes for comprehensive coverage, Bullet Points for scannable summaries, and Exam Preparation Mode for focused study.' },
  { q: 'Is there a free plan?', a: 'Yes, you can create a free account and start generating notes immediately. The free plan includes recording, uploads, AI generation, and export features.' },
];

export function ContactPage() {
  const { notify } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!validateEmail(form.email)) errs.email = 'Valid email is required';
    if (!form.subject.trim()) errs.subject = 'Subject is required';
    if (form.message.trim().length < 10) errs.message = 'Message must be at least 10 characters';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSending(true);
    await new Promise((r) => setTimeout(r, 800));
    setSending(false);
    setForm({ name: '', email: '', subject: '', message: '' });
    notify('Message sent! We will get back to you soon.', 'success');
  };

  const set = (k: string, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <PageHeader title="Contact & Support" subtitle="We are here to help. Reach out anytime." icon={LifeBuoy} />

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        {[
          { icon: Mail, title: 'Email Support', value: 'sk0981@srmist.edu.in', desc: 'We reply within 24 hours' },
          { icon: MessageSquare, title: 'Live Chat', value: 'Available 9–6 EST', desc: 'Click the chat bubble (coming soon)' },
          { icon: Clock, title: 'Response Time', value: 'Under 24 hours', desc: 'Average first response' },
        ].map((c) => (
          <div key={c.title} className="card p-5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center mb-3">
              <c.icon className="w-5 h-5 text-brand-500" />
            </div>
            <h3 className="font-semibold">{c.title}</h3>
            <p className="text-sm font-medium text-brand-600 dark:text-brand-400 mt-1">{c.value}</p>
            <p className="text-xs text-slate-500 mt-1">{c.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Contact form */}
        <SectionCard title="Send us a message" className="lg:col-span-3">
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label" htmlFor="name">Name</label>
                <input id="name" className="input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your name" />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="label" htmlFor="email">Email</label>
                <input id="email" type="email" className="input" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@example.com" />
                {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email}</p>}
              </div>
            </div>
            <div>
              <label className="label" htmlFor="subject">Subject</label>
              <input id="subject" className="input" value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder="How can we help?" />
              {errors.subject && <p className="text-xs text-rose-500 mt-1">{errors.subject}</p>}
            </div>
            <div>
              <label className="label" htmlFor="message">Message</label>
              <textarea id="message" rows={5} className="input resize-none" value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="Tell us more..." />
              {errors.message && <p className="text-xs text-rose-500 mt-1">{errors.message}</p>}
            </div>
            <button type="submit" disabled={sending} className="btn-primary w-full">
              {sending ? 'Sending...' : 'Send Message'}
              <Send className="w-4 h-4" />
            </button>
          </form>
        </SectionCard>

        {/* FAQ */}
        <div className="lg:col-span-2">
          <SectionCard title="FAQs" icon={HelpCircle}>
            <div className="space-y-2">
              {FAQS.map((f, i) => (
                <div key={i} className="border-b border-slate-200/50 dark:border-slate-700/50 last:border-0">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex items-center justify-between w-full py-3 text-left text-sm font-medium"
                    aria-expanded={openFaq === i}
                  >
                    {f.q}
                    <ChevronDown className={`w-4 h-4 transition-transform shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 pb-3 leading-relaxed animate-fade-in">{f.a}</p>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
