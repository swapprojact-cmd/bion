import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Flame,
  Users,
  ShieldAlert,
  HeartHandshake,
  MapPin,
  Compass,
  Radar,
  ArrowRight,
  UserPlus,
} from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { CreatePostCard } from '../components/feed/CreatePostCard';
import { PostCard } from '../components/feed/PostCard';
import { Avatar } from '../components/common/Avatar';
import { LocationPermissionBanner } from '../components/common/LocationPermissionBanner';
import { store, calculateDistanceKm } from '../lib/dataService';
import { CURRENT_WEEKLY_PROMPT } from '../lib/resourcesData';

interface FeedPageProps {
  navigate: (route: string) => void;
}

export const FeedPage: React.FC<FeedPageProps> = ({ navigate }) => {
  const { posts, sortFeed, setSortFeed, isLoadingFeed, groups } = useCommunity();
  const { currentUser } = useAuth();

  // Social feed filter: all, nearby, circles
  const [feedChannel, setFeedChannel] = useState<'all' | 'nearby' | 'circles'>('all');
  const [gpsActive, setGpsActive] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Request browser GPS for feed proximity
  const handleActivateGps = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setGpsActive(true);
      },
      (err) => {
        alert('Could not access GPS location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Nearby community members for the top social spotlight / stories bar
  const myLat = userCoords?.lat ?? currentUser?.location_lat ?? 40.6782;
  const myLng = userCoords?.lng ?? currentUser?.location_lng ?? -73.9442;

  const nearbyMembers = store.profiles
    .filter((p) => p.id !== currentUser?.id && p.status === 'active' && p.show_in_nearby !== false)
    .map((p) => {
      const dist = calculateDistanceKm(myLat, myLng, p.location_lat, p.location_lng);
      return { ...p, distance: dist };
    })
    .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))
    .slice(0, 8);

  // Filter posts based on channel
  const filteredPosts = posts.filter((post) => {
    if (feedChannel === 'circles') {
      return post.group_id != null;
    }
    if (feedChannel === 'nearby') {
      const author = store.profiles.find((p) => p.id === post.author_id);
      const isNearbyAuthor =
        author?.location_city ||
        (author?.location_lat != null &&
          author?.location_lng != null &&
          calculateDistanceKm(myLat, myLng, author.location_lat, author.location_lng) != null &&
          (calculateDistanceKm(myLat, myLng, author.location_lat, author.location_lng) ?? 999) <=
            50);
      const hasLocationTag = post.body.includes('📍');
      return isNearbyAuthor || hasLocationTag;
    }
    return true;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 py-2 sm:py-4">
      {/* Main Feed Column */}
      <div className="lg:col-span-2 min-w-0 space-y-3 sm:space-y-5">
        {/* Real GPS Location Prompt Banner */}
        <LocationPermissionBanner
          onLocationUpdate={(c) => {
            setUserCoords(c);
            setGpsActive(true);
          }}
        />

        {/* Visitor Access Mode Notice */}
        {!currentUser && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#191321] via-[#241738] to-[#191321] border border-[#9B5CFF]/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>👋 Visitor Preview Mode</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#9B5CFF]/20 text-[#D8D0E3] text-[10px] border border-[#9B5CFF]/40 font-medium">
                  Limited Access
                </span>
              </div>
              <p className="text-xs text-[#B9B0C6] mt-1 max-w-lg leading-relaxed">
                You're exploring public posts and nearby members. Sign in or create an account for full access: posting reflections, uploading photos & videos, direct messaging, and joining circles.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all"
              >
                Join Free
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-3 py-2 bg-[#0E0B13] border border-[#2D233D] hover:bg-[#191321] text-xs font-semibold text-white rounded-xl cursor-pointer transition-all"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* Top Social Stories / Nearby Members Spotlight Carousel */}
        <div className="hidden sm:block bg-[#191321] border border-[#2D233D] rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Radar className="w-3.5 h-3.5 text-[#9B5CFF] animate-pulse" />
              <span>Nearby Members & Friends</span>
            </span>
            <button
              onClick={() => navigate('/nearby')}
              className="text-[#9B5CFF] hover:underline flex items-center gap-1 text-[11px] cursor-pointer"
            >
              <span>Explore Map & Grid</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-3.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {/* Current user story avatar */}
            {currentUser && (
              <div
                onClick={() => navigate(`/members/${currentUser.id}`)}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
              >
                <div className="relative p-0.5 rounded-full ring-2 ring-emerald-500/70 group-hover:ring-emerald-400 transition-all">
                  <Avatar src={currentUser.avatar_path} name={currentUser.display_name} size="md" />
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#191321]" />
                </div>
                <span className="text-[11px] text-white font-medium truncate max-w-[64px]">
                  You
                </span>
              </div>
            )}

            {/* Nearby members */}
            {nearbyMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => navigate(`/members/${member.id}`)}
                className="flex flex-col items-center gap-1.5 shrink-0 cursor-pointer group"
                title={`${member.display_name} · ${member.location_city || 'Nearby'} (${
                  member.distance != null ? `${member.distance} km` : 'Near'
                })`}
              >
                <div className="relative p-0.5 rounded-full ring-2 ring-[#9B5CFF]/70 group-hover:ring-[#F05AA6] group-hover:scale-105 transition-all">
                  <Avatar src={member.avatar_path} name={member.display_name} size="md" />
                  {member.distance != null && member.distance <= 15 && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#191321]" />
                  )}
                </div>
                <div className="text-center">
                  <span className="text-[11px] text-white font-medium truncate max-w-[68px] block">
                    {member.display_name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-[#B9B0C6] font-mono block">
                    {member.distance != null ? `${member.distance}km` : member.location_city?.split(',')[0] || 'Near'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Post Creation */}
        {currentUser ? (
          <CreatePostCard onPostCreated={() => {}} />
        ) : (
          <div className="p-5 rounded-2xl bg-[#191321] border border-[#2D233D] text-center space-y-2">
            <h3 className="text-sm font-bold text-white">Join the BiCircle Community</h3>
            <p className="text-xs text-[#B9B0C6] max-w-md mx-auto">
              Sign in or create your free account to publish reflections, upload photos & videos, and connect with nearby friends.
            </p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={() => navigate('/signup')}
                className="px-4 py-2 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Join BiCircle
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 bg-[#0E0B13] border border-[#2D233D] text-[#B9B0C6] hover:text-white text-xs font-semibold rounded-xl cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* Social Feed Navigation Channels */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center sm:justify-between gap-2 sm:gap-3 pb-2 sm:pb-1 border-b border-[#2D233D]/60 pt-1">
          {/* Feed Channel Tabs */}
          <div className="flex w-full sm:w-auto items-center gap-1 bg-[#191321] p-1 rounded-xl border border-[#2D233D] overflow-x-auto">
            <button
              onClick={() => setFeedChannel('all')}
              className={`flex shrink-0 items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                feedChannel === 'all'
                  ? 'bg-[#0E0B13] text-white shadow-sm'
                  : 'text-[#B9B0C6] hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#9B5CFF]" />
              <span>All Community</span>
            </button>

            <button
              onClick={() => setFeedChannel('nearby')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                feedChannel === 'nearby'
                  ? 'bg-emerald-500/20 text-emerald-300 font-bold shadow-sm border border-emerald-500/30'
                  : 'text-[#B9B0C6] hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Nearby Feed</span>
              {gpsActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
            </button>

            <button
              onClick={() => setFeedChannel('circles')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                feedChannel === 'circles'
                  ? 'bg-[#0E0B13] text-white shadow-sm'
                  : 'text-[#B9B0C6] hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#F05AA6]" />
              <span>Circles</span>
            </button>
          </div>

          {/* Sort Toggles: Latest / Popular */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            {feedChannel === 'nearby' && !gpsActive && (
              <button
                onClick={handleActivateGps}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all cursor-pointer"
              >
                <Compass className="w-3 h-3" />
                <span>Calibrate GPS</span>
              </button>
            )}

            <div className="flex items-center gap-1 bg-[#191321] p-1 rounded-xl border border-[#2D233D]">
              <button
                onClick={() => setSortFeed('latest')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  sortFeed === 'latest' ? 'bg-[#0E0B13] text-white' : 'text-[#B9B0C6] hover:text-white'
                }`}
                title="Latest posts"
              >
                <Clock className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSortFeed('popular')}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  sortFeed === 'popular' ? 'bg-[#0E0B13] text-white' : 'text-[#B9B0C6] hover:text-white'
                }`}
                title="Most popular posts"
              >
                <Flame className="w-3.5 h-3.5 text-[#F05AA6]" />
              </button>
            </div>
          </div>
        </div>

        {/* Nearby channel explanation banner */}
        {feedChannel === 'nearby' && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Showing posts, photo moments, and questions from members near your area.
              </span>
            </div>
            <button
              onClick={() => navigate('/nearby')}
              className="text-[11px] underline font-medium text-white hover:text-emerald-200"
            >
              View Member Radar →
            </button>
          </div>
        )}

        {/* Posts Stream */}
        {isLoadingFeed ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 rounded-2xl bg-[#191321]/60 border border-[#2D233D] animate-pulse"
              />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-6 sm:p-12 rounded-2xl bg-[#191321] border border-[#2D233D] text-center space-y-3">
            <HeartHandshake className="w-10 h-10 text-[#9B5CFF] mx-auto opacity-70" />
            <h3 className="text-base font-bold text-white">
              {feedChannel === 'nearby'
                ? 'No nearby posts in this radius yet'
                : 'No community posts in this channel yet'}
            </h3>
            <p className="text-xs text-[#B9B0C6] max-w-sm mx-auto">
              {feedChannel === 'nearby'
                ? 'Be the first local member to share a post or tip with your neighborhood!'
                : 'Be the first to share a reflection, book tip, or question in BiCircle!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onNavigateToGroup={(groupId) => navigate(`/groups/${groupId}`)}
                onNavigateToProfile={(userId) => navigate(`/members/${userId}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Right Column / Widgets */}
      <div className="hidden lg:flex flex-col gap-5">
        {/* Weekly Community Prompt */}
        <div className="p-5 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-[#F05AA6]">
              <Sparkles className="w-4 h-4" /> Weekly Prompt
            </span>
            <button
              onClick={() => navigate('/resources')}
              className="text-[11px] text-[#9B5CFF] hover:underline lowercase font-normal cursor-pointer"
            >
              library →
            </button>
          </div>
          <p className="text-xs text-[#F8F5FC] font-medium leading-relaxed italic">
            "{CURRENT_WEEKLY_PROMPT.question}"
          </p>
          <div className="text-[11px] text-[#B9B0C6] pt-1">
            {CURRENT_WEEKLY_PROMPT.responseCount} members have shared reflections this week.
          </div>
        </div>

        {/* Find Nearby Friends Widget */}
        <div className="p-5 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Compass className="w-4 h-4" /> Local Discovery
            </span>
            <button
              onClick={() => navigate('/nearby')}
              className="text-[11px] text-[#9B5CFF] hover:underline lowercase font-normal cursor-pointer"
            >
              radar →
            </button>
          </div>
          <p className="text-xs text-[#B9B0C6] leading-relaxed">
            Find bisexual book lovers, cycling partners, and peer support companions in your metro area.
          </p>
          <button
            onClick={() => navigate('/nearby')}
            className="w-full py-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Radar className="w-3.5 h-3.5" />
            <span>Open Nearby Radar</span>
          </button>
        </div>

        {/* Community Commitment Reminder */}
        <div className="p-5 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-[#9B5CFF]" />
            Community Standard
          </div>
          <p className="text-xs text-[#B9B0C6] leading-relaxed">
            BiCircle is dedicated to genuine friendship, support, and discussions. Romantic solicitation and dating ads are strictly prohibited to maintain a safe haven for all members.
          </p>
          <button
            onClick={() => navigate('/guidelines')}
            className="text-[11px] text-[#9B5CFF] hover:underline font-semibold block pt-1 cursor-pointer"
          >
            Read Community Guidelines →
          </button>
        </div>

        {/* Recommended Circles */}
        <div className="p-5 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#F05AA6]" /> Explore Circles
            </h3>
            <button
              onClick={() => navigate('/explore')}
              className="text-[11px] text-[#9B5CFF] hover:underline cursor-pointer"
            >
              All
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {groups.slice(0, 4).map((group) => (
              <div
                key={group.id}
                onClick={() => navigate(`/groups/${group.id}`)}
                className="group cursor-pointer p-2.5 rounded-xl bg-[#0E0B13]/60 border border-[#2D233D]/60 hover:border-[#9B5CFF]/60 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-white group-hover:text-[#9B5CFF] transition-colors line-clamp-1">
                    {group.name}
                  </span>
                  <span className="text-[10px] text-[#B9B0C6] shrink-0 ml-2">
                    {group.member_count} mem
                  </span>
                </div>
                <p className="text-[11px] text-[#B9B0C6] line-clamp-1 mt-1">
                  {group.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
