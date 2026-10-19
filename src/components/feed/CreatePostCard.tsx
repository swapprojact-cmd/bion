import React, { useState, useRef } from 'react';
import {
  Image,
  Send,
  Users,
  ShieldAlert,
  Sparkles,
  Film,
  Upload,
  Link,
  X,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { Avatar } from '../common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useCommunity } from '../../context/CommunityContext';

interface CreatePostCardProps {
  defaultGroupId?: string | null;
  onPostCreated?: () => void;
}

export const CreatePostCard: React.FC<CreatePostCardProps> = ({
  defaultGroupId = null,
  onPostCreated,
}) => {
  const { currentUser } = useAuth();
  const { groups, createPost } = useCommunity();
  const [body, setBody] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | ''>(defaultGroupId || '');
  
  // Media states
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [mediaTab, setMediaTab] = useState<'upload' | 'url'>('upload');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaFilePreview, setMediaFilePreview] = useState<string | null>(null);
  const [mediaFileName, setMediaFileName] = useState<string | null>(null);
  const [locationTag, setLocationTag] = useState<string>('');
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [is18Plus, setIs18Plus] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!currentUser) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'photo');
    setMediaFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setMediaFilePreview(reader.result);
        setMediaUrl(reader.result); // store as data URL for persistent rendering
      }
    };
    reader.readAsDataURL(file);
  };

  const clearMedia = () => {
    setMediaUrl('');
    setMediaFilePreview(null);
    setMediaFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() && !mediaUrl) return;

    // Safety check against blatant romantic/hookup solicitations
    const lower = body.toLowerCase();
    if (
      lower.includes('seeking fwb') ||
      lower.includes('hookup tonight') ||
      lower.includes('hot single looking') ||
      lower.includes('looking for casual sex')
    ) {
      setError(
        'BiCircle is strictly for friendship and community discussions. Romantic or hookup solicitations are not permitted.'
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const isVideo = mediaType === 'video' && mediaUrl.trim().length > 0;
      const media = !isVideo && mediaUrl.trim() ? [mediaUrl.trim()] : [];
      const video = isVideo ? mediaUrl.trim() : undefined;

      // Append location tag to post if specified
      let finalBody = body.trim();
      if (locationTag.trim()) {
        finalBody = `${finalBody}\n\n📍 ${locationTag.trim()}`;
      }

      await createPost(
        finalBody,
        selectedGroupId ? selectedGroupId : null,
        media,
        selectedGroupId ? 'group_only' : 'public',
        video,
        is18Plus,
        locationTag.trim() || undefined
      );

      setBody('');
      clearMedia();
      setLocationTag('');
      setIs18Plus(false);
      setShowMediaInput(false);
      setShowLocationInput(false);
      if (onPostCreated) onPostCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to publish post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bc-panel p-4 text-[#F8F5FC] sm:p-5">
      <div className="flex items-start gap-3">
        <Avatar src={currentUser.avatar_path} name={currentUser.display_name} size="md" />
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <textarea
              rows={3}
              placeholder={`Share a story, book recommendation, local meetup, or question, ${
                currentUser.display_name.split(' ')[0]
              }...`}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (error) setError(null);
              }}
              className="bc-field min-h-28 resize-y text-sm transition-colors"
            />

            {/* Media Upload Area */}
            {showMediaInput && (
              <div className="mt-3 p-3.5 rounded-xl bg-[#0E0B13] border border-[#2D233D] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMediaTab('upload')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        mediaTab === 'upload'
                          ? 'bg-[#9B5CFF] text-white shadow-sm'
                          : 'text-[#B9B0C6] hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload from Device</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMediaTab('url')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                        mediaTab === 'url'
                          ? 'bg-[#9B5CFF] text-white shadow-sm'
                          : 'text-[#B9B0C6] hover:text-white'
                      }`}
                    >
                      <Link className="w-3.5 h-3.5" />
                      <span>Paste URL</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowMediaInput(false);
                      clearMedia();
                    }}
                    className="p-1 text-[#B9B0C6] hover:text-white rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {mediaTab === 'upload' ? (
                  <div className="space-y-2.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="feed-post-file-input"
                    />
                    {!mediaFilePreview ? (
                      <label
                        htmlFor="feed-post-file-input"
                        className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#2D233D] hover:border-[#9B5CFF] rounded-xl cursor-pointer bg-[#191321]/50 hover:bg-[#191321] transition-all group"
                      >
                        <div className="flex items-center gap-2 text-[#9B5CFF] mb-1">
                          <Image className="w-5 h-5" />
                          <Film className="w-5 h-5 text-[#F05AA6]" />
                        </div>
                        <span className="text-xs font-medium text-white group-hover:text-[#9B5CFF] transition-colors">
                          Click to select photo or video from device
                        </span>
                        <span className="text-[11px] text-[#B9B0C6] mt-0.5">
                          Supports PNG, JPG, WebP, MP4, MOV, WebM
                        </span>
                      </label>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-[#2D233D] bg-black">
                        {mediaType === 'video' ? (
                          <video
                            src={mediaFilePreview}
                            controls
                            className="max-h-60 w-full object-contain"
                          />
                        ) : (
                          <img
                            src={mediaFilePreview}
                            alt="Upload preview"
                            className="max-h-60 w-full object-contain bg-[#0E0B13]"
                          />
                        )}
                        <div className="absolute top-2 right-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={clearMedia}
                            className="p-1.5 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors"
                            title="Remove file"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="p-2 bg-[#191321] text-[11px] text-[#B9B0C6] flex items-center justify-between border-t border-[#2D233D]">
                          <span className="truncate max-w-xs">{mediaFileName}</span>
                          <span className="text-emerald-400 font-medium">Ready to attach</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setMediaType('photo')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                          mediaType === 'photo'
                            ? 'bg-[#9B5CFF]/20 text-[#9B5CFF] border border-[#9B5CFF]/40'
                            : 'text-[#B9B0C6]'
                        }`}
                      >
                        Photo URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setMediaType('video')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer ${
                          mediaType === 'video'
                            ? 'bg-[#9B5CFF]/20 text-[#9B5CFF] border border-[#9B5CFF]/40'
                            : 'text-[#B9B0C6]'
                        }`}
                      >
                        Video URL (.mp4)
                      </button>
                    </div>
                    <input
                      type="url"
                      placeholder={
                        mediaType === 'photo'
                          ? 'Paste image link (e.g. Unsplash, image link)...'
                          : 'Paste video link (.mp4 or HTML5 video link)...'
                      }
                      value={mediaUrl}
                      onChange={(e) => {
                        setMediaUrl(e.target.value);
                        setMediaFilePreview(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-[#191321] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] placeholder-[#B9B0C6]/50 focus:outline-none focus:border-[#9B5CFF]"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Optional Location Tag Input */}
            {showLocationInput && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-[#0E0B13] border border-[#2D233D] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Add nearby neighborhood or city tag (e.g. Brooklyn, NY · Prospect Park)..."
                  value={locationTag}
                  onChange={(e) => setLocationTag(e.target.value)}
                  className="w-full bg-transparent text-xs text-white placeholder-[#B9B0C6]/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowLocationInput(false);
                    setLocationTag('');
                  }}
                  className="text-[#B9B0C6] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {error && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2D233D]/60">
              <div className="flex items-center gap-2">
                {/* Photo/Video media button */}
                <button
                  type="button"
                  onClick={() => setShowMediaInput(!showMediaInput)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    showMediaInput || mediaUrl
                      ? 'bg-[#9B5CFF]/20 text-[#9B5CFF]'
                      : 'text-[#B9B0C6] hover:text-white hover:bg-[#2D233D]/40'
                  }`}
                >
                  <Image className="w-4 h-4" />
                  <span>Photo / Video</span>
                </button>

                {/* Location tag button */}
                <button
                  type="button"
                  onClick={() => setShowLocationInput(!showLocationInput)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    showLocationInput || locationTag
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-[#B9B0C6] hover:text-white hover:bg-[#2D233D]/40'
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Location</span>
                </button>

                {/* 18+ Sensitive Content toggle */}
                <button
                  type="button"
                  onClick={() => setIs18Plus(!is18Plus)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    is18Plus
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'text-[#B9B0C6] hover:text-white hover:bg-[#2D233D]/40'
                  }`}
                  title="Mark as 18+ / mature content"
                >
                  <span>🔞</span>
                  <span>{is18Plus ? '18+ Mature' : '18+'}</span>
                </button>

                {/* Optional Group Selector */}
                <div className="flex items-center gap-1.5 text-xs text-[#B9B0C6]">
                  <Users className="w-3.5 h-3.5 text-[#9B5CFF]" />
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className="bg-[#0E0B13] border border-[#2D233D] rounded-lg px-2.5 py-1 text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF]"
                  >
                    <option value="">Public Community Feed</option>
                    {groups
                      .filter((g) => g.is_member || g.visibility === 'public')
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting || (!body.trim() && !mediaUrl)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-[#9B5CFF]/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{isSubmitting ? 'Posting...' : 'Share with Circle'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
