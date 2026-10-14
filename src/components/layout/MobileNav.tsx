import React from 'react';
import { Home, Compass, MessageSquare, Bell, User, Radar, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';

interface MobileNavProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentRoute, navigate }) => {
  const { currentUser } = useAuth();
  const { unreadNotifsCount } = useCommunity();

  if (!currentUser) return null;

  const items: Array<{
    label: string;
    path: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { label: 'Feed', path: '/feed', icon: Home },
    { label: 'Nearby', path: '/nearby', icon: Radar },
    { label: 'Match', path: '/see-your-match', icon: Heart },
    { label: 'Circles', path: '/explore', icon: Compass },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Profile', path: `/members/${currentUser.id}`, icon: User },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E0B13]/95 backdrop-blur-md border-t border-[#2D233D] px-2 py-1.5 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentRoute === item.path || (item.path !== '/feed' && currentRoute.startsWith(item.path));
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-medium transition-colors relative cursor-pointer ${
              isActive ? 'text-[#9B5CFF]' : 'text-[#B9B0C6] hover:text-white'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5" />
            <span>{item.label}</span>
            {item.badge !== undefined && (
              <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-[#F05AA6] ring-1 ring-[#0E0B13]" />
            )}
          </button>
        );
      })}
    </nav>
  );
};
