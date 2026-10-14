import React from 'react';
import {
  Home,
  Compass,
  Users2,
  UserCheck,
  MessageSquare,
  Bell,
  ShieldAlert,
  ShieldCheck,
  Settings,
  HelpCircle,
  FileText,
  SlidersHorizontal,
  BookOpen,
  Radar,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';

interface SidebarProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, navigate }) => {
  const { currentUser, isModerator, isAdmin } = useAuth();
  const { unreadNotifsCount, reports } = useCommunity();

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  const navItems = [
    { label: 'Community Feed', path: '/feed', icon: Home },
    { label: 'Find Nearby Profiles', path: '/nearby', icon: Radar },
    { label: 'Explore Circles', path: '/explore', icon: Compass },
    { label: 'My Groups', path: '/groups', icon: Users2 },
    { label: 'Resource Library', path: '/resources', icon: BookOpen },
    { label: 'Friends & Circles', path: '/friends', icon: UserCheck },
    { label: 'Direct Messages', path: '/messages', icon: MessageSquare },
    {
      label: 'Notifications',
      path: '/notifications',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
    },
    { label: 'Community Safety', path: '/safety', icon: ShieldAlert },
  ];

  const restrictedItems = [
    ...(isModerator
      ? [
          {
            label: 'Moderation Queue',
            path: '/moderation',
            icon: ShieldCheck,
            badge: pendingReportsCount > 0 ? pendingReportsCount : undefined,
            badgeColor: 'bg-rose-500/20 text-rose-300',
          },
        ]
      : []),
    ...(isAdmin
      ? [
          {
            label: 'Admin Console',
            path: '/admin',
            icon: SlidersHorizontal,
          },
        ]
      : []),
  ];

  const settingsItems = [
    { label: 'Settings & Privacy', path: '/settings/profile', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:flex flex-col gap-6 py-6 pr-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Primary Navigation */}
      <div className="space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#B9B0C6]/60">
          Community
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.path || (item.path !== '/feed' && currentRoute.startsWith(item.path));
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#9B5CFF]/15 to-transparent text-white border-l-2 border-[#9B5CFF]'
                  : 'text-[#B9B0C6] hover:text-white hover:bg-[#191321]'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#9B5CFF]' : 'text-[#B9B0C6]'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[#F05AA6] text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Moderation / Admin section */}
      {restrictedItems.length > 0 && (
        <div className="space-y-1 pt-2 border-t border-[#2D233D]/60">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#9B5CFF]">
            Staff Operations
          </div>
          {restrictedItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute.startsWith(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#9B5CFF]/15 text-[#9B5CFF] border-l-2 border-[#9B5CFF]'
                    : 'text-[#B9B0C6] hover:text-white hover:bg-[#191321]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-[#9B5CFF]" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${item.badgeColor || 'bg-purple-500/20 text-purple-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Settings */}
      <div className="space-y-1 pt-2 border-t border-[#2D233D]/60">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#B9B0C6]/60">
          Preferences
        </div>
        {settingsItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute.startsWith('/settings');
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-[#9B5CFF]/15 to-transparent text-white border-l-2 border-[#9B5CFF]'
                  : 'text-[#B9B0C6] hover:text-white hover:bg-[#191321]'
              }`}
            >
              <Icon className="w-4 h-4 text-[#B9B0C6]" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Public information links */}
      <div className="mt-auto pt-4 border-t border-[#2D233D]/60 text-[11px] text-[#B9B0C6]/70 space-y-2 px-3">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          <button onClick={() => navigate('/about')} className="hover:text-white transition-colors cursor-pointer">
            About
          </button>
          <button onClick={() => navigate('/guidelines')} className="hover:text-white transition-colors cursor-pointer">
            Guidelines
          </button>
          <button onClick={() => navigate('/privacy')} className="hover:text-white transition-colors cursor-pointer">
            Privacy
          </button>
          <button onClick={() => navigate('/terms')} className="hover:text-white transition-colors cursor-pointer">
            Terms
          </button>
        </div>
        <div className="text-[10px] text-[#B9B0C6]/50">
          BiCircle © 2026 · Not a dating app
        </div>
      </div>
    </aside>
  );
};
