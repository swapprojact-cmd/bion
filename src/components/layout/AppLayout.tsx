import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { VisitorTermsIntroModal } from '../modals/VisitorTermsIntroModal';
import { useAuth } from '../../context/AuthContext';

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
  const { currentUser } = useAuth();

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
          {children}
        </main>
      </div>

      <MobileNav currentRoute={currentRoute} navigate={navigate} />
      <VisitorTermsIntroModal navigate={navigate} />
    </div>
  );
};
