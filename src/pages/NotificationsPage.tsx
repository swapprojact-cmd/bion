import React from 'react';
import { Bell, Check, Heart, MessageSquare, UserCheck, ShieldAlert, Users, ArrowRight } from 'lucide-react';
import { Notification } from '../types';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';

interface NotificationsPageProps {
  navigate: (route: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useCommunity();

  if (!currentUser) return null;

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'post_like':
        return <Heart className="w-4 h-4 text-[#F05AA6]" />;
      case 'post_comment':
        return <MessageSquare className="w-4 h-4 text-[#9B5CFF]" />;
      case 'friend_request':
      case 'friend_accepted':
        return <UserCheck className="w-4 h-4 text-emerald-400" />;
      case 'group_invite':
      case 'group_approved':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'mod_alert':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      default:
        return <Bell className="w-4 h-4 text-[#9B5CFF]" />;
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    markNotificationRead(notif.id);

    if (notif.reference_type === 'post') {
      navigate('/feed');
    } else if (notif.reference_type === 'user') {
      navigate(notif.reference_id ? `/members/${notif.reference_id}` : '/friends');
    } else if (notif.reference_type === 'group') {
      navigate(notif.reference_id ? `/groups/${notif.reference_id}` : '/groups');
    } else if (notif.reference_type === 'conversation') {
      navigate(notif.reference_id ? `/messages/${notif.reference_id}` : '/messages');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Notifications</h1>
          <p className="text-xs text-[#B9B0C6] mt-1">Activity across your posts, friendships, and circles</p>
        </div>

        {notifications.some(n => !n.read_at) && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#191321] border border-[#2D233D] hover:border-[#9B5CFF] text-xs font-semibold text-[#9B5CFF] transition-colors cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#191321] border border-[#2D233D] text-center space-y-3">
          <Bell className="w-10 h-10 text-[#9B5CFF] mx-auto opacity-70" />
          <h3 className="text-base font-bold text-white">No notifications yet</h3>
          <p className="text-xs text-[#B9B0C6] max-w-sm mx-auto">
            When members like your posts, comment, or send friend requests, you'll see them right here.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map(notif => {
            const isUnread = !notif.read_at;
            const actor = notif.actor;

            return (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isUnread
                    ? 'bg-[#191321] border-[#9B5CFF]/40 shadow-sm shadow-[#9B5CFF]/10'
                    : 'bg-[#191321]/60 border-[#2D233D] hover:border-[#3D2E55]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar src={actor?.avatar_path} name={actor?.display_name || 'Member'} size="md" />
                    <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#0E0B13] border border-[#2D233D]">
                      {getIcon(notif.type)}
                    </div>
                  </div>

                  <div className="text-xs">
                    <div className="text-[#F8F5FC]">
                      <span className="font-semibold text-white">{actor?.display_name || 'A community member'}</span>{' '}
                      <span className="text-[#B9B0C6]">{notif.message}</span>
                    </div>
                    <span className="text-[10px] text-[#B9B0C6]/60 mt-0.5 block">
                      {new Date(notif.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-[#F05AA6]" />
                  )}
                  <ArrowRight className="w-4 h-4 text-[#B9B0C6]/50" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
