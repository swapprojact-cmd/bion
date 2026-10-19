import React from 'react';
import { Home, Compass, MessageSquare, User, Heart } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileNavProps {
  currentRoute: string;
  navigate: (route: string) => void;
}

type MobileNavItem = {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const MobileNav: React.FC<MobileNavProps> = ({ currentRoute, navigate }) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  // Keep the most-used destinations visible on every phone-sized screen.
  // Notification access remains in the top navigation; matching stays distinct from friendship.
  const items: MobileNavItem[] = [
    { label: 'Home', path: '/feed', icon: Home },
    { label: 'Explore', path: '/explore', icon: Compass },
    { label: 'See Your Match', path: '/see-your-match', icon: Heart },
    { label: 'Messages', path: '/messages', icon: MessageSquare },
    { label: 'Profile', path: `/members/${currentUser.id}`, icon: User },
  ];

  return (
    <nav
      aria-label="Main mobile navigation"
      className="lg:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[#342744] bg-[#100C16]/95 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl"
    >
      <div className="mx-auto flex w-full max-w-lg items-stretch justify-around gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentRoute === item.path ||
            (item.path !== '/feed' && currentRoute.startsWith(item.path)) ||
            (item.path === '/explore' && (currentRoute === '/groups' || currentRoute.startsWith('/groups/'))) ||
            (item.path.startsWith('/members/') && currentRoute.startsWith('/members/'));

          return (
            <button
              key={item.path}
              type="button"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => navigate(item.path)}
              className={`relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A5FF] ${isActive ? 'text-[#D8C1FF]' : 'text-[#9D91AD] hover:text-white'}`}
            >
              <span className="relative">
                {isActive && <span aria-hidden="true" className="absolute -inset-2 rounded-xl bg-[#9B5CFF]/12" />}
                <Icon className={`relative h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} aria-hidden="true" />
              </span>
              <span className="max-w-full truncate">{item.label}</span>
              {isActive && <span className="absolute inset-x-4 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6]" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
