import React, { useState } from 'react';
import { Bell, MessageSquare, Shield, ChevronDown, LogOut, Settings, User, Flame } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';
import { Avatar } from '../common/Avatar';

interface NavbarProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentRoute, navigate }) => {
  const { currentUser, logout } = useAuth();
  const { unreadNotifsCount } = useCommunity();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0E0B13]/90 backdrop-blur-md border-b border-[#2D233D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate(currentUser ? '/feed' : '/')}
            className="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-none"
          >
            {/* BiCircle SVG Icon */}
            <div className="w-9 h-9 rounded-xl bg-[#191321] border border-[#3D2E55] flex items-center justify-center p-1.5 shadow-md shadow-[#9B5CFF]/10 group-hover:border-[#9B5CFF] transition-all">
              <svg viewBox="0 0 32 32" className="w-full h-full">
                <circle cx="12" cy="16" r="8" fill="#F05AA6" fillOpacity="0.8" />
                <circle cx="20" cy="16" r="8" fill="#9B5CFF" fillOpacity="0.8" style={{ mixBlendMode: 'screen' }} />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-display tracking-tight text-white group-hover:text-[#F8F5FC] transition-colors">
                  BiCircle
                </span>
                <span className="hidden sm:inline-block text-[11px] text-[#B9B0C6] font-normal tracking-wide">
                  Find your people. Be yourself.
                </span>
              </div>
            </div>
          </button>

          {currentUser && (
            <nav className="hidden md:flex items-center gap-1 pl-2 border-l border-[#2D233D]">
              <button
                onClick={() => navigate('/feed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentRoute === '/feed'
                    ? 'bg-[#9B5CFF]/20 text-white font-semibold'
                    : 'text-[#B9B0C6] hover:text-white hover:bg-[#191321]'
                }`}
              >
                Feed
              </button>
              <button
                onClick={() => navigate('/nearby')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  currentRoute === '/nearby' || currentRoute === '/profiles'
                    ? 'bg-[#9B5CFF]/20 text-[#9B5CFF] font-semibold'
                    : 'text-[#B9B0C6] hover:text-white hover:bg-[#191321]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Find Nearby
              </button>
              <button
                onClick={() => navigate('/explore')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  currentRoute === '/explore'
                    ? 'bg-[#9B5CFF]/20 text-white font-semibold'
                    : 'text-[#B9B0C6] hover:text-white hover:bg-[#191321]'
                }`}
              >
                Circles
              </button>
            </nav>
          )}
        </div>

        {/* Right tools */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {currentUser ? (
            <>
              {/* Messages Icon */}
              <button
                onClick={() => navigate('/messages')}
                className={`relative p-2 rounded-xl text-[#B9B0C6] hover:text-white hover:bg-[#191321] border border-transparent hover:border-[#2D233D] transition-colors cursor-pointer ${
                  currentRoute.startsWith('/messages') ? 'text-[#9B5CFF] bg-[#191321] border-[#2D233D]' : ''
                }`}
                title="Direct Messages"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              {/* Notifications Icon with Badge */}
              <button
                onClick={() => navigate('/notifications')}
                className={`relative p-2 rounded-xl text-[#B9B0C6] hover:text-white hover:bg-[#191321] border border-transparent hover:border-[#2D233D] transition-colors cursor-pointer ${
                  currentRoute === '/notifications' ? 'text-[#9B5CFF] bg-[#191321] border-[#2D233D]' : ''
                }`}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifsCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#F05AA6] rounded-full ring-2 ring-[#0E0B13]" />
                )}
              </button>

              {/* Current User Avatar dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 rounded-full ring-2 ring-transparent hover:ring-[#9B5CFF]/50 transition-all cursor-pointer group"
                >
                  <Avatar src={currentUser.avatar_path} name={currentUser.display_name} size="sm" />
                  <span className="text-xs text-white font-medium hidden sm:inline max-w-[100px] truncate">
                    {currentUser.display_name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#B9B0C6] group-hover:text-white transition-colors" />
                </button>

                {showUserMenu && (
                  <div
                    className="absolute right-0 top-12 w-56 bg-[#0E0B13] border border-[#2D233D] rounded-2xl shadow-2xl py-2 z-50 text-xs text-[#F8F5FC]"
                    onMouseLeave={() => setShowUserMenu(false)}
                  >
                    <div className="px-3.5 py-2.5 border-b border-[#2D233D]">
                      <div className="font-semibold text-white">{currentUser.display_name}</div>
                      <div className="text-[11px] text-[#B9B0C6]">@{currentUser.username}</div>
                      {currentUser.is_admin && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#9B5CFF]/20 text-[#9B5CFF] text-[10px] font-semibold">
                          Community Admin
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate(`/members/${currentUser.id}`);
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-[#191321] flex items-center gap-2 text-[#B9B0C6] hover:text-white transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-[#9B5CFF]" /> My Profile & Gallery
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/nearby');
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-[#191321] flex items-center gap-2 text-[#B9B0C6] hover:text-white transition-colors"
                    >
                      <Flame className="w-3.5 h-3.5 text-emerald-400" /> Find Nearby Friends
                    </button>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/settings/profile');
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-[#191321] flex items-center gap-2 text-[#B9B0C6] hover:text-white transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" /> Settings & Location
                    </button>
                    {currentUser.is_admin && (
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/admin');
                        }}
                        className="w-full px-3.5 py-2 text-left hover:bg-[#191321] flex items-center gap-2 text-[#B9B0C6] hover:text-white transition-colors"
                      >
                        <Shield className="w-3.5 h-3.5 text-[#9B5CFF]" /> Admin Console
                      </button>
                    )}
                    <div className="my-1.5 border-t border-[#2D233D]" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                        navigate('/');
                      }}
                      className="w-full px-3.5 py-2 text-left hover:bg-rose-500/10 flex items-center gap-2 text-rose-400 hover:text-rose-300 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#B9B0C6] hover:text-white hover:bg-[#191321] border border-transparent hover:border-[#2D233D] transition-all cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 shadow-md shadow-[#9B5CFF]/20 transition-all cursor-pointer"
              >
                Join BiCircle
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
