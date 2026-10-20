import React, { useEffect, useState } from 'react';
import { SlidersHorizontal, Database, AlertTriangle, RotateCcw, CheckCircle, Flame, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { DataService } from '../lib/dataService';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../lib/firebase';
import { Profile } from '../types';
import { Avatar } from '../components/common/Avatar';
import { FirebaseStatusModal } from '../components/modals/FirebaseStatusModal';

interface AdminPageProps {
  navigate: (route: string) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ navigate }) => {
  const { isAdmin, resetAllDemoData, firebaseConnected, firebaseConnectionChecked } = useAuth();
  const { posts, groups, reports, refreshAll } = useCommunity();

  const [searchMember, setSearchMember] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [roleUpdateUserId, setRoleUpdateUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!isAdmin) {
      setMembers([]);
      setMembersLoading(false);
      return;
    }

    setMembersLoading(true);
    setMembersError(null);
    DataService.getAdminProfiles()
      .then((items) => { if (!cancelled) setMembers(items); })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMembersError(error instanceof Error ? error.message : 'Could not load members from Firestore.');
          setMembers([]);
        }
      })
      .finally(() => { if (!cancelled) setMembersLoading(false); });

    return () => { cancelled = true; };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Administrator Access Only</h2>
        <p className="text-xs text-[#B9B0C6]">You must be signed in as an authorized platform administrator.</p>
        <button
          onClick={() => navigate('/feed')}
          className="px-4 py-2 bg-[#9B5CFF] text-white text-xs font-semibold rounded-xl"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const handleToggleMod = async (userId: string, currentMod: boolean) => {
    setRoleUpdateUserId(userId);
    setMembersError(null);
    setFeedbackMsg(null);
    try {
      // Role grants must use trusted Firebase Auth custom claims, not a client-side profile edit.
      const setCommunityRole = httpsCallable<
        { uid: string; role: 'moderator'; enabled: boolean },
        { success: boolean }
      >(getFunctions(app), 'setCommunityRole');
      await setCommunityRole({ uid: userId, role: 'moderator', enabled: !currentMod });
      const updatedMembers = await DataService.getAdminProfiles();
      setMembers(updatedMembers);
      setFeedbackMsg(`Moderator role ${currentMod ? 'revoked' : 'granted'}. The member must refresh their sign-in token before new permissions take effect.`);
      await refreshAll();
    } catch (error: unknown) {
      setMembersError(error instanceof Error ? error.message : 'Could not update this moderator role. Check the trusted admin claim and Cloud Function deployment.');
    } finally {
      setRoleUpdateUserId(null);
    }
  };

  const handleResetData = () => {
    if (confirm('Reset all demo state to original fixtures? This clears local testing overrides.')) {
      resetAllDemoData();
      window.location.reload();
    }
  };

  const membersList = members.filter(p =>
    p.display_name.toLowerCase().includes(searchMember.toLowerCase()) ||
    p.username.toLowerCase().includes(searchMember.toLowerCase())
  );

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#9B5CFF] mb-1 flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4" /> Administration
          </div>
          <h1 className="text-2xl font-bold font-display text-white">System Operations</h1>
          <p className="text-xs text-[#B9B0C6] mt-1">
            Platform governance, Firebase configuration, and user permission management.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#191321] border border-[#2D233D] hover:border-[#9B5CFF] text-xs font-semibold text-[#9B5CFF] transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database Setup</span>
          </button>
          <button
            onClick={handleResetData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 text-xs font-semibold transition-colors cursor-pointer"
            title="Reset demo data fixtures"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo State</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[#191321] border border-[#2D233D]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B9B0C6]">Total Members</span>
          <div className="text-2xl font-bold text-white mt-1 font-display">{membersLoading ? '…' : members.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#191321] border border-[#2D233D]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B9B0C6]">Community Circles</span>
          <div className="text-2xl font-bold text-white mt-1 font-display">{groups.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#191321] border border-[#2D233D]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B9B0C6]">Total Posts</span>
          <div className="text-2xl font-bold text-white mt-1 font-display">{posts.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-[#191321] border border-[#2D233D]">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B9B0C6]">Pending Reports</span>
          <div className="text-2xl font-bold text-rose-400 mt-1 font-display">
            {reports.filter(r => r.status === 'pending').length}
          </div>
        </div>
      </div>

      {/* Database Connection Card */}
      <div className="p-5 rounded-2xl bg-[#191321] border border-[#2D233D] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Firebase Cloud Firestore Database</span>
              <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${firebaseConnectionChecked && firebaseConnected ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : firebaseConnectionChecked ? 'bg-rose-500/10 text-rose-300 border-rose-500/20' : 'bg-amber-500/10 text-amber-200 border-amber-500/20'}`}>
                {firebaseConnectionChecked ? (firebaseConnected ? 'Reachable' : 'Not confirmed') : 'Checking…'}
              </span>
            </h3>
            <p className="text-xs text-[#B9B0C6] font-mono mt-0.5">
              ID: ai-studio-bicirclebisexual-7b1ba258-2320-4251-a404-a27b5a1fc949
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowConfigModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-[#F05AA6] hover:opacity-95 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer shrink-0 transition-opacity"
        >
          Manage Firestore & Cloud Sync
        </button>
      </div>

      {/* Member Directory & Role Administration */}
      <div className="bg-[#191321] border border-[#2D233D] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2D233D]">
          <div>
            <h3 className="text-base font-bold text-white">Member Directory & Permissions</h3>
            <p className="text-xs text-[#B9B0C6]">Member records load from Firestore; role changes use a trusted Cloud Function.</p>
          </div>
          <input
            type="text"
            placeholder="Search member..."
            value={searchMember}
            onChange={(e) => setSearchMember(e.target.value)}
            className="px-3 py-1.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF]"
          />
        </div>

        {membersError && (
          <div role="alert" className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-3 text-xs leading-relaxed text-rose-200">
            {membersError}
          </div>
        )}
        {membersLoading ? (
          <div className="flex items-center gap-2 py-5 text-sm text-[#B9B0C6]"><RefreshCw className="h-4 w-4 animate-spin" /> Loading members from Firestore…</div>
        ) : !membersError && membersList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#423354] p-5 text-sm text-[#B9B0C6]">
            {members.length === 0 ? 'No profiles were returned by Firestore for this admin account.' : 'No members match this search.'}
          </div>
        ) : (
        <div className="space-y-2.5">
          {membersList.map(member => (
            <div
              key={member.id}
              className="p-3.5 rounded-xl bg-[#0E0B13] border border-[#2D233D] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <Avatar src={member.avatar_path} name={member.display_name} size="sm" />
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    {member.display_name}
                    {member.is_admin && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">Admin</span>
                    )}
                    {member.is_moderator && !member.is_admin && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-pink-500/20 text-pink-300">Moderator</span>
                    )}
                  </div>
                  <div className="text-[10px] text-[#B9B0C6]">@{member.username}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!member.is_admin && (
                  <button
                    onClick={() => void handleToggleMod(member.id, member.is_moderator)}
                    disabled={roleUpdateUserId === member.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-50 ${
                      member.is_moderator
                        ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20'
                        : 'bg-[#9B5CFF]/15 text-[#9B5CFF] border border-[#9B5CFF]/30 hover:bg-[#9B5CFF]/25'
                    }`}
                  >
                    {roleUpdateUserId === member.id ? 'Saving…' : member.is_moderator ? 'Revoke Mod' : 'Make Moderator'}
                  </button>
                )}
                <button
                  onClick={() => navigate(`/members/${member.id}`)}
                  className="px-3 py-1.5 bg-[#191321] text-[#B9B0C6] hover:text-white rounded-lg text-xs transition-colors"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      <FirebaseStatusModal isOpen={showConfigModal} onClose={() => setShowConfigModal(false)} />
    </div>
  );
};
