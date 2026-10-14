import React, { useState } from 'react';
import { User, Lock, Shield, KeyRound, Download, Trash2, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DataService } from '../lib/dataService';
import { Avatar } from '../components/common/Avatar';

interface SettingsPageProps {
  section?: 'profile' | 'privacy' | 'security' | 'account';
  navigate: (route: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  section = 'profile',
  navigate,
}) => {
  const { currentUser, userPrivate, updateCurrentProfile, updateCurrentPrivate, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'privacy' | 'security' | 'account'>(section);

  // Profile fields
  const [displayName, setDisplayName] = useState(currentUser?.display_name || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [pronouns, setPronouns] = useState(currentUser?.pronouns || '');
  const [avatarPath, setAvatarPath] = useState(currentUser?.avatar_path || '');
  const [interestsText, setInterestsText] = useState((currentUser?.interests || []).join(', '));

  // Privacy fields
  const [visibility, setVisibility] = useState(currentUser?.visibility || 'public');
  const [messagingPermission, setMessagingPermission] = useState(userPrivate?.messaging_permission || 'everyone');
  const [identityNotes, setIdentityNotes] = useState(userPrivate?.identity_notes || '');
  const [allowFriendRequests, setAllowFriendRequests] = useState(userPrivate?.allow_friend_requests ?? true);

  // Security fields
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');

  // Status flags
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!currentUser) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const interests = interestsText
      .split(',')
      .map(i => i.trim())
      .filter(Boolean);

    await updateCurrentProfile({
      display_name: displayName,
      bio,
      pronouns,
      avatar_path: avatarPath || null,
      interests,
      visibility,
    });

    setSavedMessage('Profile updated successfully.');
    setTimeout(() => setSavedMessage(null), 2500);
  };

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCurrentProfile({ visibility });
    await updateCurrentPrivate({
      messaging_permission: messagingPermission as any,
      identity_notes: identityNotes,
      allow_friend_requests: allowFriendRequests,
    });

    setSavedMessage('Privacy preferences saved.');
    setTimeout(() => setSavedMessage(null), 2500);
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMessage('Password updated successfully.');
    setCurrentPass('');
    setNewPass('');
    setTimeout(() => setSavedMessage(null), 2500);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const json = await DataService.exportUserData(currentUser.id);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bicircle-data-export-${currentUser.username}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you absolutely certain? This will delete your profile and personal data. This cannot be undone.')) {
      await DataService.deactivateUser(currentUser.id);
      logout();
      navigate('/');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Settings & Preferences</h1>
        <p className="text-xs text-[#B9B0C6] mt-1">
          Manage your public profile, privacy boundaries, and account safety
        </p>
      </div>

      {savedMessage && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Tabs Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation pills */}
        <div className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-left ${
              activeTab === 'profile'
                ? 'bg-[#9B5CFF] text-white shadow-sm'
                : 'bg-[#191321] text-[#B9B0C6] hover:text-white border border-[#2D233D]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & Persona</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-left ${
              activeTab === 'privacy'
                ? 'bg-[#9B5CFF] text-white shadow-sm'
                : 'bg-[#191321] text-[#B9B0C6] hover:text-white border border-[#2D233D]'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Privacy & Boundaries</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-left ${
              activeTab === 'security'
                ? 'bg-[#9B5CFF] text-white shadow-sm'
                : 'bg-[#191321] text-[#B9B0C6] hover:text-white border border-[#2D233D]'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Security & Sessions</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer text-left ${
              activeTab === 'account'
                ? 'bg-[#9B5CFF] text-white shadow-sm'
                : 'bg-[#191321] text-[#B9B0C6] hover:text-white border border-[#2D233D]'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Data & Deletion</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="md:col-span-3 bg-[#191321] border border-[#2D233D] rounded-2xl p-6 sm:p-7 shadow-sm">
          {/* PROFILE SECTION */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h2 className="text-base font-bold text-white mb-2">Public Profile Details</h2>

              <div className="flex items-center gap-4 pb-3 border-b border-[#2D233D]">
                <Avatar src={avatarPath} name={displayName} size="lg" />
                <div className="flex-1">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1">
                    Avatar Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={avatarPath}
                    onChange={(e) => setAvatarPath(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1">
                  Public Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF]"
                />
                <p className="text-[11px] text-[#B9B0C6]/70 mt-1">
                  This is the name other members see on posts and comments.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    disabled
                    value={currentUser.username}
                    className="w-full px-3.5 py-2.5 bg-[#0E0B13]/50 border border-[#2D233D] rounded-xl text-xs text-[#B9B0C6] opacity-70"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1">
                    Pronouns
                  </label>
                  <input
                    type="text"
                    placeholder="she/her, they/them, he/him, etc."
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1">
                  Bio / Community Introduction
                </label>
                <textarea
                  rows={3}
                  placeholder="Share a bit about yourself, books you enjoy, hobbies, or what brings you to BiCircle..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1">
                  Interests & Topics (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="Book Club, Late Bloomers, Cycling, Creative Writing..."
                  value={interestsText}
                  onChange={(e) => setInterestsText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-[#9B5CFF]/20 transition-all cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          )}

          {/* PRIVACY SECTION */}
          {activeTab === 'privacy' && (
            <form onSubmit={handleSavePrivacy} className="space-y-4">
              <h2 className="text-base font-bold text-white mb-2">Privacy & Visibility Controls</h2>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1">
                  Profile Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF]"
                >
                  <option value="public">Public (Visible to all community members)</option>
                  <option value="members_only">Members Only (Requires logged-in session)</option>
                  <option value="private">Private (Only accepted friends)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1">
                  Who Can Send Direct Messages
                </label>
                <select
                  value={messagingPermission}
                  onChange={(e) => setMessagingPermission(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF]"
                >
                  <option value="everyone">All community members</option>
                  <option value="friends_only">Accepted friends only</option>
                  <option value="none">Nobody (Disable inbound messages)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1">
                  Private Identity Notes (Stored in confidential table, never displayed publicly)
                </label>
                <textarea
                  rows={2}
                  value={identityNotes}
                  onChange={(e) => setIdentityNotes(e.target.value)}
                  placeholder="Optional reflections on orientation or coming out timeline, saved for your eyes only."
                  className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF] resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-[#9B5CFF]/20 transition-all cursor-pointer"
                >
                  Save Privacy Preferences
                </button>
              </div>
            </form>
          )}

          {/* SECURITY SECTION */}
          {activeTab === 'security' && (
            <form onSubmit={handleSaveSecurity} className="space-y-4">
              <h2 className="text-base font-bold text-white mb-2">Account Security</h2>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF]"
                />
              </div>

              {/* Active Sessions box */}
              <div className="pt-3 border-t border-[#2D233D] space-y-2">
                <span className="text-xs font-bold text-white block">Active Browser Sessions</span>
                <div className="p-3 rounded-xl bg-[#0E0B13] border border-[#2D233D] flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-white">Current Session (AI Studio / Web Browser)</div>
                    <div className="text-[10px] text-emerald-400">● Active now</div>
                  </div>
                  <span className="text-[10px] text-[#B9B0C6]">Secure Cookie / Token</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!newPass}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-[#9B5CFF]/20 transition-all cursor-pointer disabled:opacity-40"
                >
                  Update Password
                </button>
              </div>
            </form>
          )}

          {/* ACCOUNT & DATA SECTION */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h2 className="text-base font-bold text-white mb-2">Data Rights & Account Control</h2>

              {/* Export Data */}
              <div className="p-4 rounded-xl bg-[#0E0B13] border border-[#2D233D] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-xs text-white">
                  <Download className="w-4 h-4 text-[#9B5CFF]" /> Export Your Personal Data
                </div>
                <p className="text-xs text-[#B9B0C6] leading-relaxed">
                  Download a machine-readable JSON archive of your BiCircle profile, public posts, comments, privacy preferences, and friend rosters.
                </p>
                <button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="px-4 py-2 bg-[#9B5CFF]/20 hover:bg-[#9B5CFF]/30 border border-[#9B5CFF]/40 text-[#9B5CFF] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  {isExporting ? 'Preparing archive...' : 'Download My Data (.json)'}
                </button>
              </div>

              {/* Deactivate / Delete Account */}
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-xs text-rose-300">
                  <Trash2 className="w-4 h-4 text-rose-400" /> Account Deactivation & Permanent Deletion
                </div>
                <p className="text-xs text-[#B9B0C6] leading-relaxed">
                  Permanently erase your BiCircle membership, posts, direct messages, and profile records. In accordance with safety policies, reports regarding resolved abuse or harassment are retained in anonymized format.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-md shadow-rose-600/20"
                >
                  Permanently Delete My Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
