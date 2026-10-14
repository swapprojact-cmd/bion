import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CommunityProvider } from './context/CommunityContext';
import { AppLayout } from './components/layout/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/AboutPage';
import { GuidelinesPage } from './pages/GuidelinesPage';
import { LegalPages } from './pages/LegalPages';
import { AuthPages } from './pages/AuthPages';
import { FeedPage } from './pages/FeedPage';
import { ExploreGroupsPage } from './pages/ExploreGroupsPage';
import { GroupDetailPage } from './pages/GroupDetailPage';
import { MemberProfilePage } from './pages/MemberProfilePage';
import { FriendsPage } from './pages/FriendsPage';
import { MessagesPage } from './pages/MessagesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { SettingsPage } from './pages/SettingsPage';
import { SafetyPage } from './pages/SafetyPage';
import { ModerationPage } from './pages/ModerationPage';
import { AdminPage } from './pages/AdminPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { FindNearbyProfilesPage } from './pages/FindNearbyProfilesPage';
import { SeeYourMatchPage } from './pages/SeeYourMatchPage';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      return p === '' ? '/' : p;
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', path);
      setCurrentRoute(path);
      window.scrollTo(0, 0);
    }
  };

  // Route Resolver
  const renderCurrentPage = () => {
    // Exact routes
    if (currentRoute === '/') {
      return <LandingPage navigate={navigate} />;
    }
    if (currentRoute === '/about') {
      return <AboutPage navigate={navigate} />;
    }
    if (currentRoute === '/guidelines') {
      return <GuidelinesPage navigate={navigate} />;
    }
    if (currentRoute === '/privacy') {
      return <LegalPages navigate={navigate} type="privacy" />;
    }
    if (currentRoute === '/terms') {
      return <LegalPages navigate={navigate} type="terms" />;
    }
    if (currentRoute === '/login') {
      return <AuthPages mode="login" navigate={navigate} />;
    }
    if (currentRoute === '/signup') {
      return <AuthPages mode="signup" navigate={navigate} />;
    }
    if (currentRoute === '/forgot-password') {
      return <AuthPages mode="forgot" navigate={navigate} />;
    }
    if (currentRoute === '/reset-password') {
      return <AuthPages mode="reset" navigate={navigate} />;
    }
    if (currentRoute === '/see-your-match') {
      return <SeeYourMatchPage />;
    }
    if (currentRoute === '/feed') {
      return <FeedPage navigate={navigate} />;
    }
    if (currentRoute === '/explore') {
      return <ExploreGroupsPage navigate={navigate} onlyJoined={false} />;
    }
    if (currentRoute === '/nearby' || currentRoute === '/profiles' || currentRoute === '/explore-members') {
      return <FindNearbyProfilesPage navigate={navigate} />;
    }
    if (currentRoute === '/groups') {
      return <ExploreGroupsPage navigate={navigate} onlyJoined={true} />;
    }
    if (currentRoute === '/resources') {
      return <ResourcesPage navigate={navigate} />;
    }
    if (currentRoute === '/friends') {
      return <FriendsPage navigate={navigate} />;
    }
    if (currentRoute === '/messages') {
      return <MessagesPage navigate={navigate} />;
    }
    if (currentRoute === '/notifications') {
      return <NotificationsPage navigate={navigate} />;
    }
    if (currentRoute === '/safety') {
      return <SafetyPage navigate={navigate} />;
    }
    if (currentRoute === '/moderation') {
      return <ModerationPage navigate={navigate} />;
    }
    if (currentRoute === '/admin') {
      return <AdminPage navigate={navigate} />;
    }

    // Dynamic routes
    if (currentRoute.startsWith('/groups/')) {
      const groupId = currentRoute.replace('/groups/', '');
      return <GroupDetailPage groupId={groupId} navigate={navigate} />;
    }
    if (currentRoute.startsWith('/members/')) {
      const memberId = currentRoute.replace('/members/', '');
      return <MemberProfilePage memberId={memberId} navigate={navigate} />;
    }
    if (currentRoute.startsWith('/messages/')) {
      const convId = currentRoute.replace('/messages/', '');
      return <MessagesPage conversationId={convId} navigate={navigate} />;
    }
    if (currentRoute.startsWith('/settings')) {
      const sub = currentRoute.replace('/settings/', '') as any;
      return <SettingsPage section={sub || 'profile'} navigate={navigate} />;
    }

    // Fallback to feed or landing
    return <FeedPage navigate={navigate} />;
  };

  return (
    <AuthProvider>
      <CommunityProvider>
        <AppLayout currentRoute={currentRoute} navigate={navigate}>
          {renderCurrentPage()}
        </AppLayout>
      </CommunityProvider>
    </AuthProvider>
  );
}
