import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { SettingsProvider } from '@/context/SettingsContext';
import { ToastProvider } from '@/context/ToastContext';
import { PublicLayout, AppLayout } from '@/components/Layouts';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import { HomePage } from '@/pages/public/HomePage';
import { AboutPage } from '@/pages/public/AboutPage';
import { ContactPage } from '@/pages/public/ContactPage';
import { PrivacyPage } from '@/pages/public/PrivacyPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { FounderLoginPage } from '@/pages/auth/FounderLoginPage';

import { DashboardPage } from '@/pages/app/DashboardPage';
import { RecordPage } from '@/pages/app/RecordPage';
import { UploadPage } from '@/pages/app/UploadPage';
import { GeneratePage } from '@/pages/app/GeneratePage';
import { EditorPage } from '@/pages/app/EditorPage';
import { NotesPage } from '@/pages/app/NotesPage';
import { HistoryPage } from '@/pages/app/HistoryPage';
import { SearchPage } from '@/pages/app/SearchPage';
import { ExportPage } from '@/pages/app/ExportPage';
import { SettingsPage } from '@/pages/app/SettingsPage';
import { AdminPage } from '@/pages/app/AdminPage';

function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <p className="text-6xl font-bold text-gradient">404</p>
      <p className="text-lg text-slate-500 mt-2">Page not found</p>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
              <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
              <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
              <Route path="/privacy" element={<PublicLayout><PrivacyPage /></PublicLayout>} />
              <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
              <Route path="/signup" element={<PublicLayout><SignupPage /></PublicLayout>} />
              <Route path="/founder-login" element={<PublicLayout><FounderLoginPage /></PublicLayout>} />

              {/* Protected routes */}
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
              <Route path="/record" element={<ProtectedRoute><AppLayout><RecordPage /></AppLayout></ProtectedRoute>} />
              <Route path="/upload" element={<ProtectedRoute><AppLayout><UploadPage /></AppLayout></ProtectedRoute>} />
              <Route path="/generate" element={<ProtectedRoute><AppLayout><GeneratePage /></AppLayout></ProtectedRoute>} />
              <Route path="/editor/:id" element={<ProtectedRoute><AppLayout><EditorPage /></AppLayout></ProtectedRoute>} />
              <Route path="/notes" element={<ProtectedRoute><AppLayout><NotesPage /></AppLayout></ProtectedRoute>} />
              <Route path="/history" element={<ProtectedRoute><AppLayout><HistoryPage /></AppLayout></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><AppLayout><SearchPage /></AppLayout></ProtectedRoute>} />
              <Route path="/export" element={<ProtectedRoute><AppLayout><ExportPage /></AppLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AppLayout><AdminPage /></AppLayout></ProtectedRoute>} />

              <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </SettingsProvider>
  );
}
