import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { VisitorTermsIntroModal } from '../modals/VisitorTermsIntroModal';
import { useAuth } from '../../context/AuthContext';
import { WifiOff } from 'lucide-react';

interface AppLayoutProps {
  currentRoute: string;
  navigate: (route: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentRoute,
  navigate,
  children,
}) => {
  const { currentUser, firebaseConnected } = useAuth();

  // Keep public and authentication pages focused; authenticated pages get the desktop sidebar.
  const isAuthOrLanding = currentRoute === '/' || currentRoute === '/login' || currentRoute === '/signup' || currentRoute === '/forgot-password' || currentRoute === '/reset-password';
  const showSidebar = !!currentUser && !isAuthOrLanding;

  return (
    <div className="min-h-screen overflow-x-clip bg-[#0E0B13] text-[#F8F5FC] flex flex-col selection:bg-[#9B5CFF]/30 selection:text-[#F8F5FC]">
      <Navbar currentRoute={currentRoute} navigate={navigate} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 flex">
        {showSidebar && (
          <Sidebar currentRoute={currentRoute} navigate={navigate} />
        )}
        <main className={'flex-1 min-w-0 pb-24 lg:pb-8 ' + (showSidebar ? 'lg:pl-6' : '')}>
          {firebaseConnected === false && (
            <div role="alert" className="mb-4 flex items-start gap-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3.5 text-sm text-amber-100">
              <WifiOff className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
              <div className="min-w-0">
                <p className="font-semibold">BiCircle cannot reach its database right now.</p>
                <p className="mt-1 text-xs leading-relaxed text-amber-100/80">Your changes may not save. Check your connection and refresh the page before trying again.</p>
              </div>
            </div>
          )}
          {children}
        </main>
      </div>

      <MobileNav currentRoute={currentRoute} navigate={navigate} />
      <VisitorTermsIntroModal navigate={navigate} />
    </div>
  );
};
