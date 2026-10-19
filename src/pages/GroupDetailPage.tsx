import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Globe, Lock, ShieldCheck, Check, Plus, AlertCircle, UserCheck } from 'lucide-react';
import { Group, GroupMember, Post } from '../types';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { CreatePostCard } from '../components/feed/CreatePostCard';
import { PostCard } from '../components/feed/PostCard';
import { Avatar } from '../components/common/Avatar';

interface GroupDetailPageProps {
  groupId: string;
  navigate: (route: string) => void;
}

export const GroupDetailPage: React.FC<GroupDetailPageProps> = ({
  groupId,
  navigate,
}) => {
  const { groups, joinGroup, leaveGroup, getGroupMembers, approveGroupMember, rejectGroupMember, posts } = useCommunity();
  const { currentUser, isModerator: isPlatformMod } = useAuth();

  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'members' | 'requests'>('posts');
  const [loadingMembers, setLoadingMembers] = useState(false);

  const group = groups.find(g => g.id === groupId || g.slug === groupId);
  const canViewMemberList = !!currentUser && !!group && (
    group.visibility === 'public'
    || group.is_member === true
    || group.owner_id === currentUser?.id
    || isPlatformMod
  );

  useEffect(() => {
    let cancelled = false;
    if (!group || !canViewMemberList) {
      setMembers([]);
      setLoadingMembers(false);
      return;
    }

    setLoadingMembers(true);
    getGroupMembers(group.id).then(res => {
      if (!cancelled) setMembers(res);
    }).catch(error => {
      console.error('Unable to load circle members:', error);
      if (!cancelled) setMembers([]);
    }).finally(() => {
      if (!cancelled) setLoadingMembers(false);
    });

    return () => { cancelled = true; };
  }, [group?.id, canViewMemberList]);

  if (!group) {
    return (
      <div className="py-12 text-center space-y-3">
        <h2 className="text-xl font-bold text-white">Group not found</h2>
        <button
          onClick={() => navigate('/explore')}
          className="px-4 py-2 bg-[#9B5CFF] text-white text-xs font-semibold rounded-xl"
        >
          Return to Explore
        </button>
      </div>
    );
  }

  const isOwner = group.owner_id === currentUser?.id;
  const isGroupMod = isOwner || members.some(m => m.user_id === currentUser?.id && (m.role === 'moderator' || m.role === 'owner')) || isPlatformMod;
  const isMember = group.is_member;
  const isPending = group.membership_status === 'pending';
  const groupPosts = posts.filter(p => p.group_id === group.id);
  const pendingRequests = members.filter(m => m.membership_status === 'pending');

  const canViewContent = group.visibility === 'public' || isMember || isGroupMod;

  return (
    <div className="space-y-6 py-4">
      <button
        onClick={() => navigate('/explore')}
        className="flex items-center gap-2 text-xs text-[#B9B0C6] hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> All Circles
      </button>

      {/* Group Hero Card */}
      <div className="bg-[#191321] border border-[#2D233D] rounded-2xl p-6 sm:p-8 space-y-5 shadow-lg relative overflow-hidden">
        {/* Subtle accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6]" />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-[#9B5CFF] uppercase tracking-wider">
                {group.topic}
              </span>
              <span aria-hidden="true" className="text-[#2D233D]">·</span>
              <span className="text-xs text-[#B9B0C6] flex items-center gap-1">
                {group.visibility === 'private' ? (
                  <span className="flex items-center gap-1 text-[#F05AA6]">
                    <Lock className="w-3.5 h-3.5" /> Private Circle
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[#B9B0C6]">
                    <Globe className="w-3.5 h-3.5" /> Public Circle
                  </span>
                )}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
              {group.name}
            </h1>

            <p className="text-xs sm:text-sm text-[#B9B0C6] max-w-2xl leading-relaxed">
              {group.description}
            </p>
          </div>

          {/* Action button */}
          {currentUser && (
            <div className="shrink-0 flex items-center gap-2">
              {isMember ? (
                <button
                  onClick={() => leaveGroup(group.id)}
                  className="px-4 py-2 rounded-xl bg-[#0E0B13] border border-[#2D233D] hover:border-rose-500/50 hover:text-rose-400 text-xs font-medium text-[#B9B0C6] transition-colors cursor-pointer"
                >
                  Leave Circle
                </button>
              ) : isPending ? (
                <span className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                  Membership Pending
                </span>
              ) : (
                <button
                  onClick={() => joinGroup(group.id)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-[#9B5CFF]/25 transition-all cursor-pointer"
                >
                  {group.visibility === 'private' ? 'Request to Join' : 'Join Circle'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Group Rules Box */}
        {group.rules && (
          <div className="p-3.5 rounded-xl bg-[#0E0B13]/80 border border-[#2D233D] text-xs text-[#B9B0C6] space-y-1">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#9B5CFF]" /> Circle Rules & Guidelines
            </span>
            <p className="leading-relaxed">{group.rules}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#2D233D]/60">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'posts'
                ? 'bg-[#9B5CFF] text-white'
                : 'text-[#B9B0C6] hover:text-white'
            }`}
          >
            Discussions ({groupPosts.length})
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'members'
                ? 'bg-[#9B5CFF] text-white'
                : 'text-[#B9B0C6] hover:text-white'
            }`}
          >
            Members ({members.filter(m => m.membership_status === 'active').length})
          </button>

          {isGroupMod && group.visibility === 'private' && (
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-[#9B5CFF] text-white'
                  : 'text-[#B9B0C6] hover:text-white'
              }`}
            >
              <span>Join Requests</span>
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#F05AA6] text-white text-[10px]">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Content based on tab */}
      {activeTab === 'posts' && (
        <div className="space-y-5">
          {!canViewContent ? (
            <div className="p-12 rounded-2xl bg-[#191321] border border-[#2D233D] text-center space-y-3">
              <Lock className="w-10 h-10 text-[#F05AA6] mx-auto opacity-80" />
              <h3 className="text-base font-bold text-white">This is a Private Circle</h3>
              <p className="text-xs text-[#B9B0C6] max-w-sm mx-auto">
                Only approved circle members can view and participate in discussions. Request membership above to join.
              </p>
            </div>
          ) : (
            <>
              {currentUser && isMember && (
                <CreatePostCard defaultGroupId={group.id} />
              )}

              {groupPosts.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#191321] border border-[#2D233D] text-center text-xs text-[#B9B0C6]">
                  No posts in this circle yet. Start the conversation!
                </div>
              ) : (
                <div className="space-y-4">
                  {groupPosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onNavigateToProfile={(userId) => navigate(`/members/${userId}`)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div className="bg-[#191321] border border-[#2D233D] rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white mb-2">Circle Roster</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {members
              .filter(m => m.membership_status === 'active')
              .map(m => {
                const p = m.profile;
                return (
                  <div
                    key={m.user_id}
                    onClick={() => navigate(`/members/${m.user_id}`)}
                    className="p-3 rounded-xl bg-[#0E0B13] border border-[#2D233D] flex items-center justify-between gap-3 hover:border-[#9B5CFF] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Avatar src={p?.avatar_path} name={p?.display_name || 'Member'} size="sm" />
                      <div className="truncate">
                        <div className="text-xs font-semibold text-white truncate">
                          {p?.display_name || 'Member'}
                        </div>
                        <div className="text-[10px] text-[#B9B0C6] truncate">
                          @{p?.username}
                        </div>
                      </div>
                    </div>
                    {m.role === 'owner' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold shrink-0">
                        Owner
                      </span>
                    ) : m.role === 'moderator' ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-semibold shrink-0">
                        Mod
                      </span>
                    ) : null}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {activeTab === 'requests' && isGroupMod && (
        <div className="bg-[#191321] border border-[#2D233D] rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white mb-2">Pending Membership Requests</h3>
          {pendingRequests.length === 0 ? (
            <p className="text-xs text-[#B9B0C6]">No pending join requests.</p>
          ) : (
            <div className="space-y-2.5">
              {pendingRequests.map(req => {
                const p = req.profile;
                return (
                  <div
                    key={req.user_id}
                    className="p-3.5 rounded-xl bg-[#0E0B13] border border-[#2D233D] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={p?.avatar_path} name={p?.display_name || 'Member'} size="sm" />
                      <div>
                        <div className="text-xs font-semibold text-white">{p?.display_name}</div>
                        <div className="text-[10px] text-[#B9B0C6]">@{p?.username}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => approveGroupMember(group.id, req.user_id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectGroupMember(group.id, req.user_id)}
                        className="px-3 py-1.5 bg-[#2D233D] hover:bg-rose-500/20 hover:text-rose-300 text-[#B9B0C6] rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
