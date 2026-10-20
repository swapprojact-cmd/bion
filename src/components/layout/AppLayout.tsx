import React from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { VisitorTermsIntroModal } from '../modals/VisitorTermsIntroModal';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';

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
  const { currentUser, firebaseConnected, firebaseConnectionChecked } = useAuth();
  const { dataSyncWarnings } = useCommunity();

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
          {firebaseConnectionChecked && !firebaseConnected && (
            <div role="status" className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-100">
              <strong className="font-semibold">Database connection not confirmed.</strong>{' '}
              Some posts, messages, or profile changes may not save. Refresh the page after checking the Firebase project and Firestore rules.
            </div>
          )}
          {currentUser && dataSyncWarnings.length > 0 && (
            <div role="alert" className="mt-3 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
              <strong className="font-semibold">Some account data could not sync:</strong>{' '}
              {dataSyncWarnings.join(', ')}. Check the deployed Firestore rules and indexes. Other sections can continue loading.
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
