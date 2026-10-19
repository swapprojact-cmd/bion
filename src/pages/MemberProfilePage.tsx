import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  UserPlus,
  UserCheck,
  MessageSquare,
  Shield,
  Flag,
  Ban,
  Calendar,
  Sparkles,
  MapPin,
  Heart,
  Camera,
  Film,
  Plus,
  Trash2,
  Share2,
  ExternalLink,
  MessageCircle,
  Eye,
  CheckCircle2,
  Upload,
  X,
  Link,
} from 'lucide-react';
import { Profile, ProfileMediaItem } from '../types';
import { DataService, calculateDistanceKm } from '../lib/dataService';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';
import { PostCard } from '../components/feed/PostCard';
import { ReportModal } from '../components/modals/ReportModal';
import { MediaLightboxModal } from '../components/media/MediaLightboxModal';
import { AuthPromptModal } from '../components/modals/AuthPromptModal';

interface MemberProfilePageProps {
  memberId: string;
  navigate: (route: string) => void;
}

export const MemberProfilePage: React.FC<MemberProfilePageProps> = ({
  memberId,
  navigate,
}) => {
  const { currentUser } = useAuth();
  const {
    friends,
    incomingRequests,
    outgoingRequests,
    sendFriendRequest,
    acceptFriendRequest,
    removeFriend,
    blockUser,
    startConversation,
    posts,
    addProfilePhoto,
    addProfileVideo,
    deleteProfileMedia,
  } = useCommunity();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'about' | 'photos' | 'videos' | 'posts'>('about');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Lightbox modal state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxItems, setLightboxItems] = useState<ProfileMediaItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Add media modal/form states for self profile
  const [showAddPhoto, setShowAddPhoto] = useState(false);
  const [photoTab, setPhotoTab] = useState<'upload' | 'url'>('upload');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoTitle, setPhotoTitle] = useState('');
  const [photoIs18Plus, setPhotoIs18Plus] = useState(false);
  const [isSubmittingPhoto, setIsSubmittingPhoto] = useState(false);

  const [showAddVideo, setShowAddVideo] = useState(false);
  const [videoTab, setVideoTab] = useState<'upload' | 'url'>('upload');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoCaption, setVideoCaption] = useState('');
  const [videoThumbnail, setVideoThumbnail] = useState('');
  const [videoDuration, setVideoDuration] = useState('');
  const [videoIs18Plus, setVideoIs18Plus] = useState(false);
  const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);

  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    DataService.getProfileById(memberId).then((p) => {
      setProfile(p);
      setLoading(false);
    });
  }, [memberId]);

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-[#B9B0C6]">
        Loading member profile...
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-16 text-center space-y-3">
        <h2 className="text-xl font-bold text-white">Member not found</h2>
        <button
          onClick={() => navigate('/feed')}
          className="px-4 py-2 bg-[#9B5CFF] text-white text-xs font-semibold rounded-xl"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const isSelf = currentUser?.id === profile.id;
  const isFriend = friends.some((f) => f.id === profile.id);
  const isOutgoingPending = outgoingRequests.some((r) => r.recipient_id === profile.id);
  const incomingReq = incomingRequests.find((r) => r.sender_id === profile.id);
  const userPosts = posts.filter((p) => p.author_id === profile.id);

  const distanceKm =
    !isSelf && currentUser?.location_lat && currentUser?.location_lng && profile.location_lat && profile.location_lng
      ? calculateDistanceKm(
          currentUser.location_lat,
          currentUser.location_lng,
          profile.location_lat,
          profile.location_lng
        )
      : null;

  const photosList = profile.photos || [];
  const videosList = profile.videos || [];

  const handleOpenLightbox = (items: ProfileMediaItem[], index: number) => {
    setLightboxItems(items);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleMessage = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    const conv = await startConversation(profile.id);
    navigate(`/messages/${conv.id}`);
  };

  const handleBlock = async () => {
    if (confirm(`Block @${profile.username}? You will no longer see each other's content.`)) {
      await blockUser(profile.id);
      navigate('/feed');
    }
  };

  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl.trim()) return;
    setIsSubmittingPhoto(true);
    try {
      const updated = await addProfilePhoto({
        url: photoUrl.trim(),
        caption: photoCaption.trim() || undefined,
        is_18_plus: photoIs18Plus,
      });
      setProfile(updated);
      setPhotoUrl('');
      setPhotoCaption('');
      setPhotoTitle('');
      setPhotoIs18Plus(false);
      setShowAddPhoto(false);
      setFeedbackMsg('Photo added to your profile gallery!');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to add photo');
    } finally {
      setIsSubmittingPhoto(false);
    }
  };

  const handleCreateVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoUrl.trim()) return;
    setIsSubmittingVideo(true);
    try {
      const updated = await addProfileVideo({
        url: videoUrl.trim(),
        title: videoTitle.trim() || 'Community Video',
        caption: videoCaption.trim() || undefined,
        thumbnail_url: videoThumbnail.trim() || undefined,
        is_18_plus: videoIs18Plus,
      });
      setProfile(updated);
      setVideoUrl('');
      setVideoTitle('');
      setVideoCaption('');
      setVideoThumbnail('');
      setVideoDuration('');
      setVideoIs18Plus(false);
      setShowAddVideo(false);
      setFeedbackMsg('Video added to your profile gallery!');
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to add video');
    } finally {
      setIsSubmittingVideo(false);
    }
  };

  const handleDeleteMedia = async (mediaId: string, type: 'photo' | 'video') => {
    if (!confirm('Are you sure you want to remove this media item from your profile?')) return;
    try {
      const updated = await deleteProfileMedia(mediaId, type);
      setProfile(updated);
    } catch (err: any) {
      alert(err.message || 'Failed to delete media');
    }
  };

  return (
    <div className="bc-page mx-auto max-w-4xl space-y-5">
      {/* Navigation top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/nearby')}
          className="flex items-center gap-2 text-xs text-[#B9B0C6] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Nearby Profiles
        </button>

        {isSelf && (
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#9B5CFF]/15 border border-[#9B5CFF]/30 text-[#9B5CFF] font-medium">
            This is your public profile
          </span>
        )}
      </div>

      {feedbackMsg && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bc-panel relative space-y-6 overflow-hidden p-4 pt-7 shadow-xl sm:p-8 sm:pt-10">
        {/* Subtle decorative gradient top bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#9B5CFF] via-[#F05AA6] to-[#9B5CFF]" />

        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="relative">
              <Avatar src={profile.avatar_path} name={profile.display_name} size="xl" />
              {profile.show_in_nearby && (
                <span
                  title="Profile is visible in Nearby Discovery"
                  className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#191321]"
                />
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold font-display text-white">
                  {profile.display_name}
                </h1>
                {profile.pronouns && (
                  <span className="text-xs text-[#B9B0C6]">({profile.pronouns})</span>
                )}
                {profile.is_moderator && (
                  <span className="text-xs text-[#9B5CFF] font-semibold flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Moderator
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-[#B9B0C6] flex-wrap">
                <span>@{profile.username}</span>
                {profile.location_city && (
                  <>
                    <span aria-hidden="true" className="text-[#B9B0C6]/40">·</span>
                    <span className="flex items-center gap-1 text-[#F05AA6]">
                      <MapPin className="w-3.5 h-3.5" />
                      {profile.location_city}
                    </span>
                  </>
                )}
                {distanceKm !== null && (
                  <>
                    <span aria-hidden="true" className="text-[#B9B0C6]/40">·</span>
                    <span className="text-emerald-400 font-mono text-[11px]">
                      ~{distanceKm < 1 ? '< 1 km away' : `${distanceKm} km away`}
                    </span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-[#B9B0C6]/70 pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Member since{' '}
                  {new Date(profile.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {!isSelf && currentUser && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {isFriend ? (
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" /> Connected Friends
                  </span>
                  <button
                    onClick={() => removeFriend(profile.id)}
                    className="p-2 rounded-xl bg-[#0E0B13] border border-[#2D233D] text-[#B9B0C6] hover:text-rose-400 hover:border-rose-500/30 text-xs transition-colors cursor-pointer"
                    title="Remove Friendship"
                  >
                    Disconnect
                  </button>
                </div>
              ) : incomingReq ? (
                <button
                  onClick={() => acceptFriendRequest(incomingReq.id)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  Accept Request
                </button>
              ) : isOutgoingPending ? (
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
                  Request Pending
                </span>
              ) : (
                <button
                  onClick={() => sendFriendRequest(profile.id)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#9B5CFF]/20 hover:bg-[#9B5CFF]/30 border border-[#9B5CFF]/40 text-[#9B5CFF] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Connect / Add Friend</span>
                </button>
              )}

              {/* Direct Message button */}
              <button
                onClick={handleMessage}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md shadow-[#9B5CFF]/20"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>
            </div>
          )}

          {!isSelf && !currentUser && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#9B5CFF]/20 hover:bg-[#9B5CFF]/30 border border-[#9B5CFF]/40 text-[#9B5CFF] rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Connect / Add Friend</span>
              </button>
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md shadow-[#9B5CFF]/20"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Message</span>
              </button>
            </div>
          )}

          {isSelf && (
            <button
              onClick={() => navigate('/settings/profile')}
              className="px-4 py-2 rounded-xl bg-[#0E0B13] border border-[#2D233D] text-xs font-semibold text-[#B9B0C6] hover:text-white transition-colors cursor-pointer"
            >
              Edit Profile & Privacy
            </button>
          )}
        </div>

        {/* Relationship Vibe Banner */}
        {profile.relationship_vibe && (
          <div className="p-3.5 rounded-xl bg-[#0E0B13]/80 border border-[#2D233D] flex items-start gap-3">
            <Heart className="w-4 h-4 text-[#F05AA6] shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-semibold text-[#B9B0C6] uppercase tracking-wider block">
                Connection Vibe
              </span>
              <p className="text-xs text-[#F8F5FC]/90 italic mt-0.5">
                "{profile.relationship_vibe}"
              </p>
            </div>
          </div>
        )}

        {/* Relationship Intentions */}
        {profile.relationship_intentions && profile.relationship_intentions.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-[#B9B0C6] uppercase tracking-wider block">
              Looking to Connect For
            </span>
            <div className="flex flex-wrap gap-1.5">
              {profile.relationship_intentions.map((intent) => (
                <span
                  key={intent}
                  className="px-2.5 py-1 rounded-lg bg-[#9B5CFF]/15 border border-[#9B5CFF]/30 text-white text-xs font-medium"
                >
                  {intent}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Safety Actions */}
        {!isSelf && currentUser && (
          <div className="flex items-center gap-4 pt-3 border-t border-[#2D233D]/60 text-xs text-[#B9B0C6]">
            <button
              onClick={() => setShowReportModal(true)}
              className="hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Flag className="w-3.5 h-3.5 text-rose-400" /> Report Account
            </button>
            <button
              onClick={handleBlock}
              className="hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Ban className="w-3.5 h-3.5 text-amber-400" /> Block Member
            </button>
          </div>
        )}
      </div>

      {/* Profile Section Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2D233D] pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'about'
              ? 'bg-[#9B5CFF]/20 text-white border border-[#9B5CFF]/40'
              : 'text-[#B9B0C6] hover:text-white hover:bg-[#191321]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#9B5CFF]" />
          <span>About & Connection Prompts</span>
        </button>

        <button
          onClick={() => setActiveTab('photos')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'photos'
              ? 'bg-[#9B5CFF]/20 text-white border border-[#9B5CFF]/40'
              : 'text-[#B9B0C6] hover:text-white hover:bg-[#191321]'
          }`}
        >
          <Camera className="w-3.5 h-3.5 text-[#F05AA6]" />
          <span>Photos ({photosList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('videos')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'videos'
              ? 'bg-[#9B5CFF]/20 text-white border border-[#9B5CFF]/40'
              : 'text-[#B9B0C6] hover:text-white hover:bg-[#191321]'
          }`}
        >
          <Film className="w-3.5 h-3.5 text-[#9B5CFF]" />
          <span>Videos ({videosList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'posts'
              ? 'bg-[#9B5CFF]/20 text-white border border-[#9B5CFF]/40'
              : 'text-[#B9B0C6] hover:text-white hover:bg-[#191321]'
          }`}
        >
          <MessageCircle className="w-3.5 h-3.5 text-[#B9B0C6]" />
          <span>Posts ({userPosts.length})</span>
        </button>
      </div>

      {/* Tab: About & Connection Prompts */}
      {activeTab === 'about' && (
        <div className="space-y-6">
          {/* Bio card */}
          <div className="bg-[#191321] border border-[#2D233D] rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              About {profile.display_name.split(' ')[0]}
            </h3>
            {profile.bio ? (
              <p className="text-sm text-[#F8F5FC] leading-relaxed whitespace-pre-line">
                {profile.bio}
              </p>
            ) : (
              <p className="text-xs text-[#B9B0C6] italic">No bio written yet.</p>
            )}
          </div>

          {/* Prompts Section */}
          {profile.prompts && profile.prompts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#F05AA6]" />
                <span>Conversation Starters & Prompts</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile.prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="p-5 rounded-2xl bg-[#191321] border border-[#2D233D] hover:border-[#9B5CFF]/40 transition-colors space-y-2 relative"
                  >
                    <span className="text-[11px] font-semibold text-[#9B5CFF] uppercase tracking-wider block">
                      {prompt.question}
                    </span>
                    <p className="text-xs sm:text-sm text-[#F8F5FC] leading-relaxed">
                      "{prompt.answer}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests: Zero-pill text metadata with separators */}
          {profile.interests && profile.interests.length > 0 && (
            <div className="bg-[#191321] border border-[#2D233D] rounded-2xl p-6 space-y-2">
              <span className="text-[11px] font-semibold text-[#B9B0C6] uppercase tracking-wider block">
                Circles & Shared Passions
              </span>
              <div className="text-xs text-[#9B5CFF] flex flex-wrap items-center gap-1.5">
                {profile.interests.map((interest, idx) => (
                  <React.Fragment key={interest}>
                    <span>{interest}</span>
                    {idx < profile.interests.length - 1 && (
                      <span aria-hidden="true" className="text-[#B9B0C6]/50">
                        ·
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Photos */}
      {activeTab === 'photos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#F05AA6]" />
              <span>Photo Gallery ({photosList.length})</span>
            </h3>

            {isSelf && (
              <button
                onClick={() => setShowAddPhoto(!showAddPhoto)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#9B5CFF] hover:bg-[#8A4CE6] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Photo</span>
              </button>
            )}
          </div>

          {/* Add Photo Form for Self */}
          {isSelf && showAddPhoto && (
            <form
              onSubmit={handleCreatePhoto}
              className="p-5 rounded-2xl bg-[#191321] border border-[#9B5CFF]/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Add Photo to Your Gallery
                </h4>
                <div className="flex items-center gap-1 bg-[#0E0B13] p-1 rounded-xl border border-[#2D233D]">
                  <button
                    type="button"
                    onClick={() => setPhotoTab('upload')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                      photoTab === 'upload'
                        ? 'bg-[#9B5CFF] text-white'
                        : 'text-[#B9B0C6] hover:text-white'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoTab('url')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                      photoTab === 'url'
                        ? 'bg-[#9B5CFF] text-white'
                        : 'text-[#B9B0C6] hover:text-white'
                    }`}
                  >
                    <Link className="w-3 h-3" />
                    <span>Paste Link</span>
                  </button>
                </div>
              </div>

              {photoTab === 'upload' ? (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    id="profile-photo-file-input"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          setPhotoUrl(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  {!photoUrl ? (
                    <label
                      htmlFor="profile-photo-file-input"
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#2D233D] hover:border-[#9B5CFF] rounded-xl cursor-pointer bg-[#0E0B13] hover:bg-[#0E0B13]/80 transition-all group"
                    >
                      <Camera className="w-6 h-6 text-[#9B5CFF] mb-1.5" />
                      <span className="text-xs font-medium text-white group-hover:text-[#9B5CFF] transition-colors">
                        Select photo from your phone or computer
                      </span>
                      <span className="text-[11px] text-[#B9B0C6] mt-0.5">
                        Supports JPG, PNG, WEBP, GIF
                      </span>
                    </label>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-[#2D233D] bg-black max-h-48 flex items-center justify-center">
                      <img src={photoUrl} alt="Preview" className="max-h-48 object-contain" />
                      <button
                        type="button"
                        onClick={() => setPhotoUrl('')}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/75 hover:bg-rose-600 text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="url"
                    placeholder="Paste image URL (e.g. Unsplash, hosting link)..."
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-white placeholder-[#B9B0C6]/50 focus:outline-none focus:border-[#9B5CFF]"
                  />
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Optional Title (e.g. Community Potluck, Brooklyn Bike Trail)..."
                  value={photoTitle}
                  onChange={(e) => setPhotoTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-white placeholder-[#B9B0C6]/50 focus:outline-none focus:border-[#9B5CFF]"
                />
                <textarea
                  rows={2}
                  placeholder="Optional Caption or context..."
                  value={photoCaption}
                  onChange={(e) => setPhotoCaption(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-white placeholder-[#B9B0C6]/50 focus:outline-none focus:border-[#9B5CFF] resize-none"
                />

                {/* 18+ Content check */}
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0E0B13] border border-[#2D233D] cursor-pointer hover:border-amber-500/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={photoIs18Plus}
                    onChange={(e) => setPhotoIs18Plus(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-[#191321] border-[#2D233D]"
                  />
                  <div className="text-[11px]">
                    <span className="font-semibold text-amber-300">🔞 Mark as 18+ / Sensitive Content</span>
                    <span className="text-[#B9B0C6] ml-1.5">(Protected behind adult verification)</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPhoto(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#B9B0C6] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPhoto || !photoUrl.trim()}
                  className="px-4 py-1.5 bg-[#9B5CFF] text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingPhoto ? 'Adding...' : 'Save Photo'}
                </button>
              </div>
            </form>
          )}

          {photosList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#191321] border border-[#2D233D] space-y-2">
              <Camera className="w-8 h-8 text-[#B9B0C6]/50 mx-auto" />
              <p className="text-xs text-[#B9B0C6]">No photos shared yet.</p>
              {isSelf && (
                <button
                  onClick={() => setShowAddPhoto(true)}
                  className="px-3 py-1.5 bg-[#9B5CFF]/20 text-[#9B5CFF] rounded-lg text-xs font-medium inline-block mt-2"
                >
                  Add your first photo
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {photosList.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenLightbox(photosList, idx)}
                  className="group relative bg-[#191321] border border-[#2D233D] rounded-xl overflow-hidden cursor-pointer hover:border-[#9B5CFF]/60 transition-all shadow-md"
                >
                  <div className="aspect-square w-full bg-[#0E0B13] overflow-hidden relative">
                    {item.is_18_plus && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-amber-500/90 text-black font-extrabold text-[10px] z-10 shadow">
                        🔞 18+
                      </span>
                    )}
                    <img
                      src={item.url}
                      alt={item.caption || 'Profile photo'}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-3 bg-[#191321] border-t border-[#2D233D] flex items-center justify-between">
                    <div className="truncate pr-2">
                      <div className="text-xs font-semibold text-white truncate">
                        {item.title || item.caption || 'Community moment'}
                      </div>
                      <div className="text-[11px] text-[#B9B0C6]">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>

                    {isSelf && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMedia(item.id, 'photo');
                        }}
                        className="p-1.5 text-[#B9B0C6] hover:text-rose-400 rounded-lg hover:bg-[#0E0B13] transition-colors"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Videos */}
      {activeTab === 'videos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Film className="w-4 h-4 text-[#9B5CFF]" />
              <span>Video Reels & Stories ({videosList.length})</span>
            </h3>

            {isSelf && (
              <button
                onClick={() => setShowAddVideo(!showAddVideo)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#9B5CFF] hover:bg-[#8A4CE6] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Video</span>
              </button>
            )}
          </div>

          {/* Add Video Form for Self */}
          {isSelf && showAddVideo && (
            <form
              onSubmit={handleCreateVideo}
              className="p-5 rounded-2xl bg-[#191321] border border-[#9B5CFF]/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Add Video Clip to Your Gallery
                </h4>
                <div className="flex items-center gap-1 bg-[#0E0B13] p-1 rounded-xl border border-[#2D233D]">
                  <button
                    type="button"
                    onClick={() => setVideoTab('upload')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                      videoTab === 'upload'
                        ? 'bg-[#9B5CFF] text-white'
                        : 'text-[#B9B0C6] hover:text-white'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoTab('url')}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                      videoTab === 'url'
                        ? 'bg-[#9B5CFF] text-white'
                        : 'text-[#B9B0C6] hover:text-white'
                    }`}
                  >
                    <Link className="w-3 h-3" />
                    <span>Paste Link</span>
                  </button>
                </div>
              </div>

              {videoTab === 'upload' ? (
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="video/*"
                    id="profile-video-file-input"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (!videoTitle) {
                        setVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          setVideoUrl(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  {!videoUrl ? (
                    <label
                      htmlFor="profile-video-file-input"
                      className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#2D233D] hover:border-[#9B5CFF] rounded-xl cursor-pointer bg-[#0E0B13] hover:bg-[#0E0B13]/80 transition-all group"
                    >
                      <Film className="w-6 h-6 text-[#9B5CFF] mb-1.5" />
                      <span className="text-xs font-medium text-white group-hover:text-[#9B5CFF] transition-colors">
                        Select video clip from your phone or computer
                      </span>
                      <span className="text-[11px] text-[#B9B0C6] mt-0.5">
                        Supports MP4, MOV, WebM (reels, clips, intros)
                      </span>
                    </label>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden border border-[#2D233D] bg-black max-h-56 flex items-center justify-center">
                      <video src={videoUrl} controls className="max-h-56 w-full object-contain" />
                      <button
                        type="button"
                        onClick={() => setVideoUrl('')}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/75 hover:bg-rose-600 text-white transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input
                    type="url"
                    placeholder="Paste video URL (.mp4 or HTML5 video link)..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-white placeholder-[#B9B0C6]/50 focus:outline-none focus:border-[#9B5CFF]"
                  />
                </div>
              )}

              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Video Title (e.g. Acoustic Song Snippet, Bi Picnic Intro)..."
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-white placeholder-[#B9B0C6]/50 focus:outline-none focus:border-[#9B5CFF]"
                />
                <input
                  type="text"
                  placeholder="Approx Duration (e.g. 0:45, 1:12)..."
                  value={videoDuration}
                  onChange={(e) => setVideoDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-white placeholder-[#B9B0C6]/50 focus:outline-none focus:border-[#9B5CFF]"
                />
                <textarea
                  rows={2}
                  placeholder="Optional Video caption or description..."
                  value={videoCaption}
                  onChange={(e) => setVideoCaption(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-white placeholder-[#B9B0C6]/50 focus:outline-none focus:border-[#9B5CFF] resize-none"
                />

                {/* 18+ Content check */}
                <label className="flex items-center gap-2.5 p-2 rounded-xl bg-[#0E0B13] border border-[#2D233D] cursor-pointer hover:border-amber-500/40 transition-colors">
                  <input
                    type="checkbox"
                    checked={videoIs18Plus}
                    onChange={(e) => setVideoIs18Plus(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-[#191321] border-[#2D233D]"
                  />
                  <div className="text-[11px]">
                    <span className="font-semibold text-amber-300">🔞 Mark as 18+ / Sensitive Content</span>
                    <span className="text-[#B9B0C6] ml-1.5">(Protected behind adult verification)</span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddVideo(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-[#B9B0C6] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVideo || !videoUrl.trim()}
                  className="px-4 py-1.5 bg-[#9B5CFF] text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingVideo ? 'Adding...' : 'Save Video'}
                </button>
              </div>
            </form>
          )}

          {videosList.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#191321] border border-[#2D233D] space-y-2">
              <Film className="w-8 h-8 text-[#B9B0C6]/50 mx-auto" />
              <p className="text-xs text-[#B9B0C6]">No video clips shared yet.</p>
              {isSelf && (
                <button
                  onClick={() => setShowAddVideo(true)}
                  className="px-3 py-1.5 bg-[#9B5CFF]/20 text-[#9B5CFF] rounded-lg text-xs font-medium inline-block mt-2"
                >
                  Add your first video clip
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {videosList.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenLightbox(videosList, idx)}
                  className="group bg-[#191321] border border-[#2D233D] rounded-2xl overflow-hidden cursor-pointer hover:border-[#9B5CFF]/60 transition-all shadow-md relative"
                >
                  <div className="aspect-video w-full bg-black relative flex items-center justify-center overflow-hidden">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title || 'Video preview'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        preload="metadata"
                      />
                    )}
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover:bg-black/20 transition-all">
                      <div className="w-12 h-12 rounded-full bg-[#9B5CFF]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Film className="w-5 h-5 ml-0.5" />
                      </div>
                    </div>

                    {item.duration && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white font-mono text-[10px]">
                        {item.duration}
                      </span>
                    )}
                  </div>

                  <div className="p-4 bg-[#191321] border-t border-[#2D233D] flex items-start justify-between gap-2">
                    <div className="space-y-0.5 truncate">
                      <h4 className="text-xs font-bold text-white truncate">
                        {item.title || 'Community Video'}
                      </h4>
                      {item.caption && (
                        <p className="text-[11px] text-[#B9B0C6] truncate">
                          {item.caption}
                        </p>
                      )}
                    </div>

                    {isSelf && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMedia(item.id, 'video');
                        }}
                        className="p-1.5 text-[#B9B0C6] hover:text-rose-400 rounded-lg hover:bg-[#0E0B13] transition-colors shrink-0"
                        title="Delete video"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Posts */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Community Posts ({userPosts.length})
          </h3>

          {userPosts.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#191321] border border-[#2D233D] text-center text-xs text-[#B9B0C6]">
              No posts published yet.
            </div>
          ) : (
            userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onNavigateToGroup={(groupId) => navigate(`/groups/${groupId}`)}
              />
            ))
          )}
        </div>
      )}

      {/* Media Lightbox */}
      <MediaLightboxModal
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        items={lightboxItems}
        initialIndex={lightboxIndex}
        authorName={profile.display_name}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="profile"
        targetId={profile.id}
        targetLabel={`@${profile.username}`}
      />
    </div>
  );
};
