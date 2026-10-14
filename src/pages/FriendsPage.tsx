import React, { useState } from 'react';
import { UserCheck, UserPlus, Users, MessageSquare, Trash2, Check, X, Search } from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';
import { store } from '../lib/dataService';

interface FriendsPageProps {
  navigate: (route: string) => void;
}

export const FriendsPage: React.FC<FriendsPageProps> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    sendFriendRequest,
    startConversation,
  } = useCommunity();

  const [activeTab, setActiveTab] = useState<'friends' | 'incoming' | 'outgoing' | 'discover'>('friends');
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentUser) return null;

  const handleMessage = async (friendId: string) => {
    const conv = await startConversation(friendId);
    navigate(`/messages/${conv.id}`);
  };

  // Discover members not already friends or pending
  const existingFriendIds = new Set(friends.map(f => f.id));
  const pendingRecipientIds = new Set(outgoingRequests.map(r => r.recipient_id));
  const incomingSenderIds = new Set(incomingRequests.map(r => r.sender_id));

  const discoverMembers = store.profiles.filter(p =>
    p.id !== currentUser.id &&
    !existingFriendIds.has(p.id) &&
    !pendingRecipientIds.has(p.id) &&
    !incomingSenderIds.has(p.id)
  );

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display text-white">Friends & Connections</h1>
        <p className="text-xs text-[#B9B0C6] mt-1">
          Build authentic, platonic connections with fellow bisexual community members
        </p>
      </div>

      {/* Segmented Filter Bar */}
      <div className="flex items-center gap-2 border-b border-[#2D233D] pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('friends')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'friends'
              ? 'bg-[#9B5CFF] text-white'
              : 'text-[#B9B0C6] hover:text-white bg-[#191321]'
          }`}
        >
          My Friends ({friends.length})
        </button>

        <button
          onClick={() => setActiveTab('incoming')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'incoming'
              ? 'bg-[#9B5CFF] text-white'
              : 'text-[#B9B0C6] hover:text-white bg-[#191321]'
          }`}
        >
          <span>Incoming Requests</span>
          {incomingRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[#F05AA6] text-white text-[10px]">
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('outgoing')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'outgoing'
              ? 'bg-[#9B5CFF] text-white'
              : 'text-[#B9B0C6] hover:text-white bg-[#191321]'
          }`}
        >
          Outgoing Requests ({outgoingRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('discover')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'discover'
              ? 'bg-[#9B5CFF] text-white'
              : 'text-[#B9B0C6] hover:text-white bg-[#191321]'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5 text-[#F05AA6]" />
          <span>Discover Members</span>
        </button>
      </div>

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="space-y-4">
          {friends.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#191321] border border-[#2D233D] text-center space-y-3">
              <UserCheck className="w-10 h-10 text-[#9B5CFF] mx-auto opacity-70" />
              <h3 className="text-base font-bold text-white">No friends yet</h3>
              <p className="text-xs text-[#B9B0C6] max-w-sm mx-auto">
                Explore community circles or discover members with shared interests to send a friendly request.
              </p>
              <button
                onClick={() => setActiveTab('discover')}
                className="px-4 py-2 bg-[#9B5CFF] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Discover Members
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.map(friend => (
                <div
                  key={friend.id}
                  className="p-4 rounded-2xl bg-[#191321] border border-[#2D233D] flex items-center justify-between gap-3 hover:border-[#3D2E55] transition-colors"
                >
                  <div
                    onClick={() => navigate(`/members/${friend.id}`)}
                    className="flex items-center gap-3 cursor-pointer truncate"
                  >
                    <Avatar src={friend.avatar_path} name={friend.display_name} size="md" />
                    <div className="truncate">
                      <div className="font-semibold text-sm text-white truncate hover:text-[#9B5CFF] transition-colors">
                        {friend.display_name}
                      </div>
                      <div className="text-xs text-[#B9B0C6] truncate">@{friend.username}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleMessage(friend.id)}
                      className="p-2 rounded-xl bg-[#0E0B13] border border-[#2D233D] hover:border-[#9B5CFF] text-[#9B5CFF] transition-colors cursor-pointer"
                      title="Direct Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${friend.display_name} from friends?`)) {
                          removeFriend(friend.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-[#0E0B13] border border-[#2D233D] hover:border-rose-500/30 text-[#B9B0C6] hover:text-rose-400 transition-colors cursor-pointer"
                      title="Remove Friend"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Incoming Requests Tab */}
      {activeTab === 'incoming' && (
        <div className="space-y-3">
          {incomingRequests.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#191321] border border-[#2D233D] text-center text-xs text-[#B9B0C6]">
              No pending incoming friend requests.
            </div>
          ) : (
            incomingRequests.map(req => {
              const sender = req.sender;
              return (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-[#191321] border border-[#2D233D] flex items-center justify-between gap-3"
                >
                  <div
                    onClick={() => sender && navigate(`/members/${sender.id}`)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Avatar src={sender?.avatar_path} name={sender?.display_name || 'Member'} size="md" />
                    <div>
                      <div className="text-sm font-semibold text-white">{sender?.display_name}</div>
                      <div className="text-xs text-[#B9B0C6]">@{sender?.username}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => acceptFriendRequest(req.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => declineFriendRequest(req.id)}
                      className="px-3.5 py-1.5 bg-[#0E0B13] border border-[#2D233D] hover:border-rose-500/30 text-[#B9B0C6] hover:text-rose-400 rounded-xl text-xs cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Outgoing Requests Tab */}
      {activeTab === 'outgoing' && (
        <div className="space-y-3">
          {outgoingRequests.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#191321] border border-[#2D233D] text-center text-xs text-[#B9B0C6]">
              No pending outgoing friend requests.
            </div>
          ) : (
            outgoingRequests.map(req => {
              const recipient = req.recipient;
              return (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-[#191321] border border-[#2D233D] flex items-center justify-between gap-3"
                >
                  <div
                    onClick={() => recipient && navigate(`/members/${recipient.id}`)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Avatar src={recipient?.avatar_path} name={recipient?.display_name || 'Member'} size="md" />
                    <div>
                      <div className="text-sm font-semibold text-white">{recipient?.display_name}</div>
                      <div className="text-xs text-[#B9B0C6]">@{recipient?.username}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => declineFriendRequest(req.id)}
                    className="px-3 py-1.5 bg-[#0E0B13] border border-[#2D233D] text-xs text-[#B9B0C6] hover:text-rose-400 rounded-xl cursor-pointer"
                  >
                    Cancel Request
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Discover Members Tab */}
      {activeTab === 'discover' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {discoverMembers.map(member => (
              <div
                key={member.id}
                className="p-4 rounded-2xl bg-[#191321] border border-[#2D233D] flex flex-col justify-between gap-3"
              >
                <div
                  onClick={() => navigate(`/members/${member.id}`)}
                  className="flex items-start gap-3 cursor-pointer"
                >
                  <Avatar src={member.avatar_path} name={member.display_name} size="md" />
                  <div>
                    <div className="text-sm font-semibold text-white hover:text-[#9B5CFF] transition-colors">
                      {member.display_name}
                    </div>
                    <div className="text-xs text-[#B9B0C6]">@{member.username}</div>
                    {member.bio && (
                      <p className="mt-1.5 text-xs text-[#B9B0C6] line-clamp-2 leading-relaxed">
                        {member.bio}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-[#2D233D]/60 flex items-center justify-between">
                  <div className="text-[11px] text-[#9B5CFF] truncate max-w-[200px]">
                    {member.interests.join(' · ')}
                  </div>
                  <button
                    onClick={() => sendFriendRequest(member.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#9B5CFF]/15 hover:bg-[#9B5CFF]/25 border border-[#9B5CFF]/30 text-[#9B5CFF] rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Connect</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
