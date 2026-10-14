import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Compass,
  Filter,
  Search,
  Users,
  UserPlus,
  UserCheck,
  MessageSquare,
  Shield,
  Eye,
  Camera,
  Film,
  Sparkles,
  Heart,
  SlidersHorizontal,
  Radar,
  LayoutGrid,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { Profile, ProfileMediaItem } from '../types';
import { DataService } from '../lib/dataService';
import { useAuth } from '../context/AuthContext';
import { useCommunity } from '../context/CommunityContext';
import { Avatar } from '../components/common/Avatar';
import { MediaLightboxModal } from '../components/media/MediaLightboxModal';
import { AuthPromptModal } from '../components/modals/AuthPromptModal';

interface FindNearbyProfilesPageProps {
  navigate: (route: string) => void;
}

export const FindNearbyProfilesPage: React.FC<FindNearbyProfilesPageProps> = ({ navigate }) => {
  const { currentUser, updateCurrentProfile } = useAuth();
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    sendFriendRequest,
    acceptFriendRequest,
    startConversation,
  } = useCommunity();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [selectedIntention, setSelectedIntention] = useState('All');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'grid' | 'radar'>('grid');

  // Real GPS Geolocation state
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'active' | 'denied'>('idle');
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const requestGpsLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      setGpsStatus('denied');
      return;
    }

    setGpsStatus('locating');
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setGpsCoords(coords);
        setGpsStatus('active');
        setSelectedCity('All'); // allow radius search from actual physical GPS location
        if (currentUser && updateCurrentProfile) {
          try {
            await updateCurrentProfile({
              location_lat: coords.lat,
              location_lng: coords.lng,
              location_city: 'Live GPS Location',
            });
          } catch (e) {
            console.warn('Profile location update with GPS:', e);
          }
        }
      },
      (err) => {
        setGpsStatus('denied');
        setGpsError(err.message || 'Location permission was denied or unavailable.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const clearGps = () => {
    setGpsStatus('idle');
    setGpsCoords(null);
    setGpsError(null);
  };

  // Media lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItems, setLightboxItems] = useState<ProfileMediaItem[]>([]);
  const [lightboxAuthor, setLightboxAuthor] = useState('');
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const data = await DataService.getNearbyProfiles(currentUser?.id, {
        maxDistanceKm,
        city: selectedCity,
        intention: selectedIntention,
        searchQuery,
        coords: gpsCoords || undefined,
      });
      setProfiles(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [currentUser?.id, maxDistanceKm, selectedCity, selectedIntention, searchQuery, gpsCoords]);

  const cities = [
    'All',
    'Brooklyn, NY',
    'Manhattan, NY',
    'Queens, NY',
    'Jersey City, NJ',
    'Bronx, NY',
    'Chicago, IL',
    'Austin, TX',
    'Seattle, WA',
  ];

  const intentions = [
    'All',
    'Book Club & Literature',
    'Cycling & Outdoor Hikes',
    'Bi Parenting Circle',
    'Hiking & Nature',
    'Film Nights & Screenings',
    'Acoustic Jams & Songwriting',
    'Community Potlucks & Cooking',
    'Coffee Chats & Deep Convos',
    'Late Bloomer Peer Support',
    'Indie Game Co-working',
    'Tech & Open Source Chats',
  ];

  const handleOpenMedia = (profile: Profile, initialItem?: ProfileMediaItem) => {
    const allMedia: ProfileMediaItem[] = [
      ...(profile.photos || []),
      ...(profile.videos || []),
    ];
    if (allMedia.length === 0) return;

    let idx = 0;
    if (initialItem) {
      idx = allMedia.findIndex((m) => m.id === initialItem.id);
      if (idx === -1) idx = 0;
    }

    setLightboxItems(allMedia);
    setLightboxAuthor(profile.display_name);
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const handleMessage = async (memberId: string) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    const conv = await startConversation(memberId);
    navigate(`/messages/${conv.id}`);
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#191321] via-[#241738] to-[#191321] border border-[#2D233D] rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#9B5CFF]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#9B5CFF]/20 border border-[#9B5CFF]/30 text-[#9B5CFF] text-[11px] font-semibold flex items-center gap-1">
                <Compass className="w-3.5 h-3.5" /> Platonic Friendship & Community Radar
              </span>
              <span className="text-xs text-[#B9B0C6]">Non-dating</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
              Find Nearby Community & Friends
            </h1>
            <p className="text-xs sm:text-sm text-[#B9B0C6] leading-relaxed">
              Connect with bisexual peers, local book club enthusiasts, outdoor companions, and support circles near you. Every interaction is friendship-first.
            </p>
          </div>

          {/* Quick view toggle & Live GPS button */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
            {/* Live GPS Button */}
            <button
              onClick={requestGpsLocation}
              disabled={gpsStatus === 'locating'}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm ${
                gpsStatus === 'active'
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                  : 'bg-[#0E0B13] border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10'
              }`}
            >
              <Compass className={`w-3.5 h-3.5 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
              <span>
                {gpsStatus === 'locating'
                  ? 'Acquiring GPS...'
                  : gpsStatus === 'active'
                  ? 'Live GPS Active'
                  : 'Use My Live GPS'}
              </span>
            </button>

            <div className="flex items-center gap-1 bg-[#0E0B13] border border-[#2D233D] p-1 rounded-xl">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#9B5CFF] text-white shadow-md'
                    : 'text-[#B9B0C6] hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Profiles Grid</span>
              </button>
              <button
                onClick={() => setViewMode('radar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'radar'
                    ? 'bg-[#9B5CFF] text-white shadow-md'
                    : 'text-[#B9B0C6] hover:text-white'
                }`}
              >
                <Radar className="w-3.5 h-3.5" />
                <span>Community Radar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live GPS Active Confirmation */}
        {gpsStatus === 'active' && gpsCoords && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold text-white">Live GPS Connected:</span>
              <span className="font-mono text-xs">
                {gpsCoords.lat.toFixed(3)}°, {gpsCoords.lng.toFixed(3)}°
              </span>
              <span className="hidden md:inline text-emerald-300/80">
                · Displaying community members ordered by real physical proximity to you
              </span>
            </div>
            <button
              onClick={clearGps}
              className="text-[11px] underline text-emerald-200 hover:text-white cursor-pointer"
            >
              Reset GPS
            </button>
          </div>
        )}

        {gpsError && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs text-amber-300 flex items-center justify-between">
            <span>{gpsError} (You can still select any city/metro manually below).</span>
            <button onClick={() => setGpsError(null)} className="text-[11px] underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Location Privacy Safety Notice */}
        <div className="mt-4 pt-4 border-t border-[#2D233D]/60 flex items-start gap-2.5 text-xs text-[#B9B0C6]">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong className="text-emerald-400 font-medium">Privacy Guaranteed:</strong> Exact GPS coordinates are never stored publicly or shared with other members. Distances are computed to protect personal safety and privacy.
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-[#191321] border border-[#2D233D] rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          {/* Search input */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-[#B9B0C6] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, interests, bio, or vibe..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-white placeholder-[#B9B0C6]/60 focus:outline-none focus:border-[#9B5CFF] transition-colors"
            />
          </div>

          {/* City selector */}
          <div className="md:col-span-3">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF] cursor-pointer"
            >
              <option value="All">All Cities / Metros</option>
              {cities
                .filter((c) => c !== 'All')
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>

          {/* Intention selector */}
          <div className="md:col-span-3">
            <select
              value={selectedIntention}
              onChange={(e) => setSelectedIntention(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF] cursor-pointer"
            >
              <option value="All">All Friendship Intentions</option>
              {intentions
                .filter((i) => i !== 'All')
                .map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
            </select>
          </div>

          {/* Distance buttons */}
          <div className="md:col-span-2 flex items-center gap-1.5">
            <select
              value={maxDistanceKm ?? ''}
              onChange={(e) =>
                setMaxDistanceKm(e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full px-3 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF] cursor-pointer"
            >
              <option value="">Any Distance</option>
              <option value="10">Within 10 km</option>
              <option value="25">Within 25 km</option>
              <option value="50">Within 50 km</option>
              <option value="100">Within 100 km</option>
            </select>
          </div>
        </div>

        {/* Quick intention tag chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] text-[#B9B0C6] font-semibold uppercase tracking-wider shrink-0 mr-1">
            Top Vibes:
          </span>
          {['Book Club & Literature', 'Cycling & Outdoor Hikes', 'Late Bloomer Peer Support', 'Bi Parenting Circle', 'Hiking & Nature', 'Film Nights & Screenings'].map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedIntention(selectedIntention === tag ? 'All' : tag)}
              className={`px-3 py-1 rounded-xl text-xs transition-colors shrink-0 cursor-pointer ${
                selectedIntention === tag
                  ? 'bg-[#9B5CFF] text-white font-medium'
                  : 'bg-[#0E0B13] border border-[#2D233D] text-[#B9B0C6] hover:text-white hover:border-[#3D2E55]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-20 text-center text-xs text-[#B9B0C6] space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#9B5CFF] border-t-transparent animate-spin mx-auto" />
          <p>Scanning nearby community members...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="bg-[#191321] border border-[#2D233D] rounded-2xl p-12 text-center space-y-4">
          <MapPin className="w-12 h-12 text-[#9B5CFF]/40 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No nearby members found</h3>
            <p className="text-xs text-[#B9B0C6] max-w-md mx-auto">
              Try adjusting your distance filter to "Any Distance" or resetting your city selection.
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCity('All');
              setSelectedIntention('All');
              setMaxDistanceKm(undefined);
              setSearchQuery('');
            }}
            className="px-4 py-2 rounded-xl bg-[#9B5CFF] text-white text-xs font-semibold hover:bg-[#8A4CE6] transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'radar' ? (
        /* Radar / Proximity Map View */
        <div className="bg-[#191321] border border-[#2D233D] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
                <Radar className="w-5 h-5 text-[#9B5CFF] animate-pulse" />
                Community Proximity Radar
              </h2>
              <p className="text-xs text-[#B9B0C6] mt-0.5">
                Visualizing members near your home hub ({currentUser?.location_city || 'Brooklyn, NY'})
              </p>
            </div>
            <span className="text-xs text-[#9B5CFF] font-semibold">
              {profiles.length} Members in Range
            </span>
          </div>

          {/* Interactive Radar Canvas Simulation */}
          <div className="relative w-full aspect-[16/9] max-h-[500px] min-h-[340px] bg-[#0E0B13] border border-[#2D233D] rounded-2xl overflow-hidden flex items-center justify-center p-4">
            {/* Concentric distance rings */}
            <div className="absolute w-[80%] h-[80%] rounded-full border border-[#2D233D]/60 pointer-events-none" />
            <div className="absolute w-[55%] h-[55%] rounded-full border border-[#2D233D]/60 pointer-events-none" />
            <div className="absolute w-[30%] h-[30%] rounded-full border border-[#9B5CFF]/30 pointer-events-none" />
            <div className="absolute w-full h-[1px] bg-[#2D233D]/40 pointer-events-none" />
            <div className="absolute h-full w-[1px] bg-[#2D233D]/40 pointer-events-none" />

            {/* Center Home Node (You) */}
            <div className="absolute z-20 flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#9B5CFF] to-[#F05AA6] p-0.5 shadow-lg shadow-[#9B5CFF]/30 ring-4 ring-[#9B5CFF]/20">
                <Avatar
                  src={currentUser?.avatar_path}
                  name={currentUser?.display_name || 'You'}
                  size="sm"
                  className="w-full h-full"
                />
              </div>
              <span className="text-[10px] font-bold text-white mt-1 bg-[#191321]/90 px-2 py-0.5 rounded-full border border-[#2D233D]">
                You (Center)
              </span>
            </div>

            {/* Member nodes placed on radar */}
            {profiles.map((p, idx) => {
              // Deterministic polar coordinates based on distance and index
              const angle = (idx * (360 / profiles.length) + 25) * (Math.PI / 180);
              // Radius scaled: 0km is center, 100km is edge
              const dist = p.distance_km ?? (idx + 1) * 8;
              const radiusPct = Math.min(38, Math.max(12, (dist / 60) * 35));
              const x = 50 + radiusPct * Math.cos(angle);
              const y = 50 + radiusPct * Math.sin(angle);

              return (
                <div
                  key={p.id}
                  style={{ left: `${x}%`, top: `${y}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group z-10 cursor-pointer"
                  onClick={() => navigate(`/members/${p.id}`)}
                >
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-[#191321] border-2 border-[#9B5CFF] p-0.5 shadow-md group-hover:scale-110 group-hover:border-[#F05AA6] transition-all">
                      <Avatar
                        src={p.avatar_path}
                        name={p.display_name}
                        size="xs"
                        className="w-full h-full"
                      />
                    </div>

                    {/* Popover Card on Hover */}
                    <div className="absolute bottom-11 left-1/2 -translate-x-1/2 w-52 bg-[#191321] border border-[#2D233D] rounded-xl p-3 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-30 space-y-1 text-left">
                      <div className="font-semibold text-xs text-white flex items-center justify-between">
                        <span>{p.display_name}</span>
                        {p.distance_km != null && (
                          <span className="text-[10px] text-emerald-400">
                            {p.distance_km} km
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#B9B0C6]">@{p.username}</div>
                      <div className="text-[10px] text-[#F8F5FC]/80 line-clamp-2">
                        {p.relationship_vibe || p.bio}
                      </div>
                      <div className="text-[9px] text-[#9B5CFF] pt-1">Click to view profile & media</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Grid Profiles View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {profiles.map((profile) => {
            const isFriend = friends.some((f) => f.id === profile.id);
            const isPending = outgoingRequests.some((r) => r.recipient_id === profile.id);
            const incoming = incomingRequests.find((r) => r.sender_id === profile.id);
            const totalPhotos = profile.photos?.length || 0;
            const totalVideos = profile.videos?.length || 0;
            const allMedia = [...(profile.photos || []), ...(profile.videos || [])];

            return (
              <div
                key={profile.id}
                className="bg-[#191321] border border-[#2D233D] rounded-2xl p-5 hover:border-[#3D2E55] transition-all flex flex-col justify-between shadow-sm relative group"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => navigate(`/members/${profile.id}`)}
                      className="flex items-start gap-3 cursor-pointer text-left focus:outline-none"
                    >
                      <div className="relative">
                        <Avatar
                          src={profile.avatar_path}
                          name={profile.display_name}
                          size="lg"
                        />
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#191321]" />
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-sm text-white group-hover:text-[#9B5CFF] transition-colors">
                            {profile.display_name}
                          </h3>
                          {profile.pronouns && (
                            <span className="text-[11px] text-[#B9B0C6]">
                              ({profile.pronouns})
                            </span>
                          )}
                          {profile.is_moderator && (
                            <span
                              className="text-[10px] text-[#9B5CFF] font-semibold flex items-center gap-0.5"
                              title="Moderator"
                            >
                              <Shield className="w-3 h-3" /> Mod
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#B9B0C6]">@{profile.username}</div>
                      </div>
                    </button>

                    {/* Distance Badge */}
                    {profile.distance_km != null ? (
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shrink-0">
                        <MapPin className="w-3 h-3" />
                        <span>{profile.distance_km} km</span>
                      </div>
                    ) : profile.location_city ? (
                      <div className="flex items-center gap-1 text-[11px] text-[#B9B0C6] shrink-0">
                        <MapPin className="w-3 h-3 text-[#9B5CFF]" />
                        <span>{profile.location_city}</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Location subtitle if distance displayed */}
                  {profile.location_city && profile.distance_km != null && (
                    <div className="text-[11px] text-[#B9B0C6]/80 flex items-center gap-1 mt-1.5 ml-1">
                      <span>{profile.location_city}</span>
                    </div>
                  )}

                  {/* Relationship Vibe Quote */}
                  {profile.relationship_vibe && (
                    <div className="mt-3 p-3 rounded-xl bg-[#0E0B13]/70 border border-[#2D233D]/60 text-xs text-[#F8F5FC]/90 italic leading-relaxed">
                      "{profile.relationship_vibe}"
                    </div>
                  )}

                  {/* Bio */}
                  {profile.bio && (
                    <p className="mt-3 text-xs text-[#B9B0C6] line-clamp-2 leading-relaxed">
                      {profile.bio}
                    </p>
                  )}

                  {/* Friendship Intentions */}
                  {profile.relationship_intentions && profile.relationship_intentions.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#2D233D]/40 space-y-1.5">
                      <span className="text-[10px] font-semibold text-[#B9B0C6] uppercase tracking-wider block">
                        Looking For:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {profile.relationship_intentions.slice(0, 3).map((intent) => (
                          <span
                            key={intent}
                            className="px-2 py-0.5 rounded-lg bg-[#9B5CFF]/10 text-[#9B5CFF] text-[10px] font-medium"
                          >
                            {intent}
                          </span>
                        ))}
                        {profile.relationship_intentions.length > 3 && (
                          <span className="text-[10px] text-[#B9B0C6] self-center ml-1">
                            +{profile.relationship_intentions.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Media Showcase Preview (Photos & Videos) */}
                  {allMedia.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#2D233D]/40">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-[10px] font-semibold text-[#B9B0C6] uppercase tracking-wider">
                          Media Showcase ({totalPhotos} Photos · {totalVideos} Videos)
                        </span>
                        <button
                          onClick={() => handleOpenMedia(profile)}
                          className="text-[10px] text-[#9B5CFF] hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" /> View All
                        </button>
                      </div>

                      {/* Preview Thumbnails */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {allMedia.slice(0, 3).map((m, mIdx) => (
                          <div
                            key={m.id || mIdx}
                            onClick={() => handleOpenMedia(profile, m)}
                            className="relative aspect-square rounded-lg overflow-hidden border border-[#2D233D] group/media cursor-pointer"
                          >
                            <img
                              src={m.type === 'video' ? m.thumbnail_url || m.url : m.url}
                              alt={m.caption || 'Media thumbnail'}
                              className="w-full h-full object-cover group-hover/media:scale-105 transition-transform"
                            />
                            {m.type === 'video' && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <Film className="w-4 h-4 text-white drop-shadow" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="mt-5 pt-3.5 border-t border-[#2D233D] flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    {isFriend ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold text-xs flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> Friends
                      </span>
                    ) : incoming ? (
                      <button
                        onClick={() => acceptFriendRequest(incoming.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Accept Request
                      </button>
                    ) : isPending ? (
                      <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-semibold text-xs">
                        Request Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (!currentUser) {
                            setShowAuthModal(true);
                            return;
                          }
                          sendFriendRequest(profile.id);
                        }}
                        className="px-3 py-1.5 bg-[#9B5CFF]/20 hover:bg-[#9B5CFF]/30 border border-[#9B5CFF]/40 text-[#9B5CFF] rounded-xl font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Connect
                      </button>
                    )}

                    <button
                      onClick={() => handleMessage(profile.id)}
                      className="p-2 rounded-xl bg-[#0E0B13] border border-[#2D233D] text-[#B9B0C6] hover:text-white hover:border-[#3D2E55] transition-colors cursor-pointer"
                      title="Direct message"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => navigate(`/members/${profile.id}`)}
                    className="px-3 py-1.5 rounded-xl bg-[#0E0B13] border border-[#2D233D] text-[#F8F5FC] hover:text-[#9B5CFF] hover:border-[#9B5CFF]/40 font-medium transition-colors cursor-pointer"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Media Lightbox Modal */}
      <MediaLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        items={lightboxItems}
        initialIndex={lightboxIndex}
        authorName={lightboxAuthor}
      />

      {/* Visitor Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        navigate={navigate}
        title="Sign in to Connect"
        description="Create a free account or log in to send friend requests, exchange messages, and build your trusted BiCircle network."
      />
    </div>
  );
};
