import { Link } from 'react-router-dom';
import { Brain, Github, Twitter, Linkedin, Crown } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">Synapse</span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
              Transform every lecture into smart, organized AI notes. Built for students.
            </p>
            <div className="flex gap-3 mt-4">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg glass flex items-center justify-center text-slate-500 hover:text-brand-500 transition-colors"
                  aria-label="Social link"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/about" className="hover:text-brand-500">About</Link></li>
              <li><Link to="/contact" className="hover:text-brand-500">Contact</Link></li>
              <li><Link to="/privacy" className="hover:text-brand-500">Privacy</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Features</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li>AI Note Generation</li>
              <li>Lecture Recording</li>
              <li>Smart Search</li>
              <li>Flashcards & Quiz</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-3">Get Started</h4>
            <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
              <li><Link to="/signup" className="hover:text-brand-500">Create Account</Link></li>
              <li><Link to="/login" className="hover:text-brand-500">Sign In</Link></li>
              <li><Link to="/founder-login" className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium hover:text-amber-700 dark:hover:text-amber-300 transition-colors"><Crown className="w-3.5 h-3.5" /> Founder Login</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Synapse. All rights reserved.</p>
          <p className="text-xs text-slate-400">Made for students, by students.</p>
        </div>
      </div>
    </footer>
  );
}
