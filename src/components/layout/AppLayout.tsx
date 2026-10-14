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

  // Landing, auth, legal pages can have full width without sidebar if desired, but providing the sidebar for authenticated users gives consistent shell
  const isAuthOrLanding = currentRoute === '/' || currentRoute === '/login' || currentRoute === '/signup' || currentRoute === '/forgot-password' || currentRoute === '/reset-password';
  const showSidebar = !!currentUser && !isAuthOrLanding;

  return (
    <div className="min-h-screen bg-[#0E0B13] text-[#F8F5FC] flex flex-col selection:bg-[#9B5CFF]/30 selection:text-[#F8F5FC]">
      <Navbar currentRoute={currentRoute} navigate={navigate} />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 flex">
        {showSidebar && (
          <Sidebar currentRoute={currentRoute} navigate={navigate} />
        )}
        <main className={`flex-1 min-w-0 pb-20 lg:pb-8 ${showSidebar ? 'lg:pl-6' : ''}`}>
          {children}
        </main>
      </div>

      <MobileNav currentRoute={currentRoute} navigate={navigate} />
      <VisitorTermsIntroModal navigate={navigate} />
    </div>
  );
};
