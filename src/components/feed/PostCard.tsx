import React, { useState } from 'react';
import { Heart, MessageSquare, MoreHorizontal, Flag, Trash2, Ban, Shield, Film, MapPin, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Post, ProfileMediaItem } from '../../types';
import { Avatar } from '../common/Avatar';
import { CommentSection } from './CommentSection';
import { ReportModal } from '../modals/ReportModal';
import { MediaLightboxModal } from '../media/MediaLightboxModal';
import { AuthPromptModal } from '../modals/AuthPromptModal';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';

interface PostCardProps {
  post: Post;
  onNavigateToGroup?: (groupId: string) => void;
  onNavigateToProfile?: (userId: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onNavigateToGroup,
  onNavigateToProfile,
}) => {
  const { currentUser, isModerator } = useAuth();
  const { toggleLike, deletePost, blockUser } = useCommunity();
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [revealed18Plus, setRevealed18Plus] = useState<boolean>(!post.is_18_plus);
  const [isLiking, setIsLiking] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const author = post.author;
  const isAuthor = currentUser?.id === post.author_id;
  const canDelete = isAuthor || isModerator;

  const handleLike = async () => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (isLiking) return;
    setIsLiking(true);
    try {
      await toggleLike(post.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this post?')) {
      await deletePost(post.id);
    }
  };

  const handleBlock = async () => {
    if (confirm(`Block @${author?.username}? You won't see each other's content or messages.`)) {
      await blockUser(post.author_id);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <article className="bc-panel relative overflow-hidden p-4 text-[#F8F5FC] transition-colors hover:border-[#514064] sm:p-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <button
            onClick={() => onNavigateToProfile && onNavigateToProfile(post.author_id)}
            className="cursor-pointer focus:outline-none"
          >
            <Avatar src={author?.avatar_path} name={author?.display_name || 'Member'} size="md" />
          </button>
          <div>
            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
              <button
                onClick={() => onNavigateToProfile && onNavigateToProfile(post.author_id)}
                className="font-semibold text-sm text-white hover:text-[#9B5CFF] transition-colors text-left"
              >
                {author?.display_name || 'Member'}
              </button>
              {author?.pronouns && (
                <span className="text-xs text-[#B9B0C6]/80 font-normal">({author.pronouns})</span>
              )}
              {author?.is_moderator && (
                <span className="text-[11px] text-[#9B5CFF] font-medium flex items-center gap-0.5" title="Community Moderator">
                  <Shield className="w-3 h-3" /> Mod
                </span>
              )}
            </div>

            {/* Zero-pill metadata line */}
            <div className="flex items-center gap-1.5 text-xs text-[#B9B0C6] mt-0.5 flex-wrap">
              <span>@{author?.username || 'member'}</span>
              <span aria-hidden="true">·</span>
              <span>{formatDate(post.created_at)}</span>
              {post.is_18_plus && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                    🔞 18+
                  </span>
                </>
              )}
              {author?.location_city && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" />
                    {author.location_city}
                  </span>
                </>
              )}
              {post.group && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    onClick={() => onNavigateToGroup && onNavigateToGroup(post.group!.id)}
                    className="text-[#9B5CFF] hover:underline text-left cursor-pointer font-medium"
                  >
                    {post.group.name}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 text-[#B9B0C6] hover:text-white rounded-lg hover:bg-[#2D233D]/50 transition-colors"
            title="More actions"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              className="absolute right-0 top-8 w-44 bg-[#0E0B13] border border-[#2D233D] rounded-xl shadow-xl py-1 z-20 text-xs text-[#F8F5FC]"
              onMouseLeave={() => setShowMenu(false)}
            >
              {canDelete && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    handleDelete();
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-rose-500/10 text-rose-400 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete post
                </button>
              )}
              {!isAuthor && (
                <>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[#2D233D] flex items-center gap-2 text-[#B9B0C6] hover:text-white"
                  >
                    <Flag className="w-3.5 h-3.5 text-rose-400" /> Report post
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleBlock();
                    }}
                    className="w-full px-3 py-2 text-left hover:bg-[#2D233D] flex items-center gap-2 text-amber-400"
                  >
                    <Ban className="w-3.5 h-3.5" /> Block @{author?.username}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 18+ Content Shield Check */}
      {post.is_18_plus && !revealed18Plus ? (
        <div className="mt-3.5 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-amber-300 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>🔞 18+ Mature Content</span>
          </div>
          <p className="text-[11px] text-[#B9B0C6] max-w-sm mx-auto">
            This post was marked as 18+ sensitive content by the author. By clicking reveal, you confirm you are 18 years or older.
          </p>
          <div className="pt-1">
            <button
              onClick={() => setRevealed18Plus(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>I am 18+ · View Content</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Body */}
          <div className="mt-3.5 text-sm text-[#F8F5FC] leading-relaxed whitespace-pre-line font-normal">
            {post.body}
          </div>

          {/* Video if present */}
          {post.video_url && (
            <div className="mt-3.5 rounded-xl overflow-hidden border border-[#2D233D] bg-black">
              <video
                src={post.video_url}
                controls
                className="w-full max-h-96 object-contain"
                preload="metadata"
              >
                Your browser does not support HTML5 video.
              </video>
            </div>
          )}

          {/* Photos if present */}
          {post.media_paths && post.media_paths.length > 0 && (
            <div className="mt-3.5 rounded-xl overflow-hidden border border-[#2D233D] grid grid-cols-1 gap-1">
              {post.media_paths.map((imgUrl, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setLightboxIndex(i);
                    setLightboxOpen(true);
                  }}
                  className="cursor-pointer group relative overflow-hidden max-h-96"
                >
                  <img
                    src={imgUrl}
                    alt="Community shared media"
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-white font-medium">
                    Click to expand
                  </div>
                </div>
              ))}
            </div>
          )}

          {post.is_18_plus && revealed18Plus && (
            <div className="mt-2 text-right">
              <button
                onClick={() => setRevealed18Plus(false)}
                className="text-[10px] text-amber-400/80 hover:text-amber-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <EyeOff className="w-3 h-3" />
                <span>Hide 18+ content</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* Footer / Interaction buttons */}
      <div className="mt-4 pt-3 border-t border-[#2D233D]/60 flex items-center justify-between text-xs text-[#B9B0C6]">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-colors cursor-pointer ${
              post.has_liked
                ? 'text-[#F05AA6] bg-[#F05AA6]/10 font-semibold'
                : 'hover:text-white hover:bg-[#2D233D]/40'
            }`}
          >
            <Heart className={`w-4 h-4 ${post.has_liked ? 'fill-[#F05AA6]' : ''}`} />
            <span>{post.likes_count || 0}</span>
          </button>

          <button
            onClick={() => {
              if (!currentUser) {
                setShowAuthModal(true);
                return;
              }
              setShowComments(!showComments);
            }}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:text-white hover:bg-[#2D233D]/40 transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-[#9B5CFF]" />
            <span>{post.comments_count || 0}</span>
          </button>
        </div>

        <span className="text-[11px] text-[#B9B0C6]/60">
          {post.visibility === 'group_only' ? 'Circle members' : 'Community'}
        </span>
      </div>

      {/* Comments section */}
      {showComments && (
        <CommentSection postId={post.id} />
      )}

      {/* Media Lightbox */}
      {post.media_paths && post.media_paths.length > 0 && (
        <MediaLightboxModal
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          items={post.media_paths.map((p, idx) => ({
            id: `post_media_${post.id}_${idx}`,
            type: 'photo' as const,
            url: p,
            caption: post.body.slice(0, 80),
            created_at: post.created_at,
          }))}
          initialIndex={lightboxIndex}
          authorName={author?.display_name}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetType="post"
        targetId={post.id}
        targetLabel={`"${post.body.slice(0, 30)}..."`}
      />

      {/* Visitor Auth Prompt Modal */}
      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        navigate={(r) => {
          if (typeof window !== 'undefined') {
            window.location.assign(r);
          }
        }}
        title="Sign in to interact"
        description="Join BiCircle to like posts, participate in community discussions, leave comments, and connect with people near you."
      />
    </article>
  );
};
