import React from 'react';
import { Home, Compass, MessageSquare, Bell, User } from 'lucide-react';
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

  const items = [
    { label: 'Home', path: '/feed', icon: Home },
    { label: 'Explore', path: '/explore', icon: Compass },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Alerts', path: '/notifications', icon: Bell, badge: unreadNotifsCount },
    { label: 'Profile', path: `/members/${currentUser.id}`, icon: User },
  ];

  return (
    <nav
      aria-label="Main mobile navigation"
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[#2D233D] bg-[#0E0B13]/95 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-md"
    >
      <div className="mx-auto flex w-full max-w-lg items-stretch justify-around gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentRoute === item.path ||
            (item.path !== '/feed' && currentRoute.startsWith(item.path)) ||
            (item.path === '/explore' && currentRoute === '/nearby') ||
            (item.path === '/explore' && currentRoute === '/see-your-match');

          return (
            <button
              key={item.path}
              type="button"
              aria-label={item.badge ? `${item.label}, ${item.badge} unread notifications` : item.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => navigate(item.path)}
              className={`relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B5CFF] ${isActive ? 'text-[#B995FF]' : 'text-[#B9B0C6] hover:text-white'}`}
            >
              <span className="relative">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.label === 'Alerts' && item.badge > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#F05AA6] px-1 text-[9px] font-bold text-white">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </span>
              <span className="max-w-full truncate">{item.label}</span>
              {isActive && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#9B5CFF]" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
