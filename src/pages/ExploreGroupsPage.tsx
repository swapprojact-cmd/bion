import React, { useState } from 'react';
import { Search, Plus, Users, Globe, Lock, Check } from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { CreateGroupModal } from '../components/modals/CreateGroupModal';

interface ExploreGroupsPageProps {
  navigate: (route: string) => void;
  onlyJoined?: boolean;
}

export const ExploreGroupsPage: React.FC<ExploreGroupsPageProps> = ({
  navigate,
  onlyJoined = false,
}) => {
  const { groups, joinGroup, leaveGroup } = useCommunity();
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const topics = [
    'All',
    'Personal Stories & Support',
    'Literature & Culture',
    'Family & Parenting',
    'Careers & Mentorship',
    'Arts & Media',
  ];

  let filtered = groups;

  if (onlyJoined) {
    filtered = filtered.filter(g => g.is_member);
  }

  if (selectedTopic !== 'All') {
    filtered = filtered.filter(g => g.topic === selectedTopic);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      g => g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q) || g.topic.toLowerCase().includes(q)
    );
  }

  return (
    <div className="bc-page mx-auto max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="bc-page-title">
            {onlyJoined ? 'My Community Groups' : 'Explore Community Circles'}
          </h1>
          <p className="text-xs text-[#B9B0C6] mt-1">
            {onlyJoined
              ? 'Circles you have joined or manage'
              : 'Find interest-based spaces, support circles, and local regional networks'}
          </p>
        </div>

        {currentUser && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-[#9B5CFF]/20 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Circle</span>
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#B9B0C6] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search circles by name, topic, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bc-field pl-10 text-sm"
          />
        </div>

        {/* Interactive Topic Buttons */}
        {!onlyJoined && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {topics.map(t => (
              <button
                key={t}
                onClick={() => setSelectedTopic(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedTopic === t
                    ? 'bg-[#9B5CFF] text-white shadow-sm'
                    : 'bg-[#191321] border border-[#2D233D] text-[#B9B0C6] hover:text-white hover:border-[#3D2E55]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Groups Grid */}
      {filtered.length === 0 ? (
        <div className="bc-panel space-y-3 px-5 py-12 text-center">
          <Users className="w-10 h-10 text-[#9B5CFF] mx-auto opacity-70" />
          <h3 className="text-base font-bold text-white">
            {onlyJoined ? 'You haven’t joined any groups yet' : 'No circles found matching your search'}
          </h3>
          <p className="text-xs text-[#B9B0C6] max-w-sm mx-auto">
            {onlyJoined
              ? 'Explore our community circles to find shared interests and peer discussions.'
              : 'Try clearing your search terms or create a brand new circle for fellow community members.'}
          </p>
          {onlyJoined && (
            <button
              onClick={() => navigate('/explore')}
              className="px-4 py-2 bg-[#9B5CFF] text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Browse All Circles
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map(group => {
            const isMember = group.is_member;
            const isPending = group.membership_status === 'pending';

            return (
              <div
                key={group.id}
                className="bc-panel flex flex-col justify-between p-4 transition-all hover:border-[#514064] sm:p-5 group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[11px] font-semibold text-[#9B5CFF] uppercase tracking-wider line-clamp-1">
                      {group.topic}
                    </span>
                    <span className="text-[11px] text-[#B9B0C6] flex items-center gap-1 shrink-0">
                      {group.visibility === 'private' ? (
                        <span className="flex items-center gap-1 text-[#F05AA6]">
                          <Lock className="w-3 h-3" /> Private
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[#B9B0C6]">
                          <Globe className="w-3 h-3" /> Public
                        </span>
                      )}
                    </span>
                  </div>

                  <h3
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="text-base font-bold text-white group-hover:text-[#9B5CFF] transition-colors cursor-pointer"
                  >
                    {group.name}
                  </h3>

                  <p className="mt-2 text-xs text-[#B9B0C6] line-clamp-3 leading-relaxed">
                    {group.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#2D233D]/60 flex items-center justify-between text-xs">
                  <span className="text-[#B9B0C6]">
                    {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/groups/${group.id}`)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#B9B0C6] hover:text-white transition-colors cursor-pointer"
                    >
                      View
                    </button>

                    {currentUser && (
                      <>
                        {isMember ? (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Joined
                          </span>
                        ) : isPending ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-semibold">
                            Request Pending
                          </span>
                        ) : (
                          <button
                            onClick={() => joinGroup(group.id)}
                            className="px-3 py-1.5 bg-[#9B5CFF]/15 hover:bg-[#9B5CFF]/25 border border-[#9B5CFF]/30 text-[#9B5CFF] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                          >
                            {group.visibility === 'private' ? 'Request Join' : 'Join Circle'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(id: string) => navigate(`/groups/${id}`)}
      />
    </div>
  );
};
