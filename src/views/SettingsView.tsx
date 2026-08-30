import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchUserJournals, fetchUserGoals, signOut } from '../lib/firebase';
import { clearLocalDraft, formatDate } from '../lib/utils';
import { 
  Settings as SettingsIcon, 
  User as UserIcon, 
  ShieldCheck, 
  Download, 
  Trash2, 
  LogOut, 
  Flame, 
  HardDrive,
  Database
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';

interface SettingsViewProps {
  navigate: (path: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ navigate, onShowToast }) => {
  const { user, userProfile, logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleClearDrafts = () => {
    if (!user) return;
    clearLocalDraft(user.uid);
    onShowToast('success', 'Local browser draft storage cleared.');
  };

  const handleExportJSON = async () => {
    if (!user) return;
    try {
      setExporting(true);
      const [journals, goals] = await Promise.all([
        fetchUserJournals(user.uid),
        fetchUserGoals(user.uid),
      ]);

      const data = {
        exportDate: new Date().toISOString(),
        user: {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
        },
        journals,
        goals,
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `personal-gemini-journal-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      onShowToast('success', 'Journal data exported as JSON.');
    } catch (err) {
      onShowToast('error', 'Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const handleConfirmSignOut = async () => {
    try {
      await logout();
      setShowLogoutModal(false);
      navigate('/');
    } catch (err) {
      onShowToast('error', 'Sign out failed.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-stone-900" />
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-stone-900">
            Account & Settings
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Manage your profile, data exports, and private storage settings.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-2xl border border-stone-200 object-cover shadow-2xs"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xl">
              {(user?.displayName || 'U')[0]}
            </div>
          )}

          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900">
              {user?.displayName || 'Journaler'}
            </h3>
            <p className="text-xs text-stone-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                <Flame className="w-3 h-3 text-amber-600 fill-amber-600" />
                <span>{userProfile?.writingStreak || 1} Day Streak</span>
              </span>
            </div>
          </div>
        </div>

        {/* Security & Data Isolation Card */}
        <div className="pt-6 border-t border-stone-100 space-y-3">
          <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
            Security & Firestore Privacy
          </h4>
          <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Owner-Bound Document Authorization</span>
            </div>
            <p className="leading-relaxed">
              Your journals and goals are stored in Cloud Firestore under <code className="bg-white px-1.5 py-0.5 rounded border border-stone-200">/users/{user?.uid}</code>. Security rules restrict all read and write privileges exclusively to your authenticated UID.
            </p>
          </div>
        </div>

        {/* Data Export & Backup */}
        <div className="pt-6 border-t border-stone-100 space-y-3">
          <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
            Data Portability
          </h4>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <p className="text-xs font-semibold text-stone-900">Export All Data (JSON)</p>
              <p className="text-[11px] text-stone-500">
                Download a complete, offline JSON backup of all your journals, reflections, and goals.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              disabled={exporting}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-semibold rounded-xl shadow-2xs transition-colors self-start sm:self-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{exporting ? 'Exporting...' : 'Export JSON'}</span>
            </button>
          </div>
        </div>

        {/* Maintenance Actions */}
        <div className="pt-6 border-t border-stone-100 space-y-3">
          <h4 className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
            Storage Maintenance
          </h4>
          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-200">
            <div>
              <p className="text-xs font-semibold text-stone-900">Clear Local Browser Drafts</p>
              <p className="text-[11px] text-stone-500">
                Removes temporary local unsaved scratchpad drafts stored on this machine.
              </p>
            </div>
            <button
              onClick={handleClearDrafts}
              className="px-3.5 py-1.5 bg-stone-200/80 hover:bg-stone-300 text-stone-800 text-xs font-medium rounded-lg transition-colors"
            >
              Clear Drafts
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-6 border-t border-stone-100 flex justify-end">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out of Account</span>
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Sign Out?"
        message="Are you sure you want to sign out of your Personal Gemini Journal workspace?"
        confirmText="Sign Out"
        isDanger={false}
        onConfirm={handleConfirmSignOut}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
};
