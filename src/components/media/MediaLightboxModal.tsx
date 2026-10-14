import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, Maximize, Film, Image as ImageIcon, Calendar } from 'lucide-react';
import { ProfileMediaItem } from '../../types';

interface MediaLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ProfileMediaItem[];
  initialIndex?: number;
  authorName?: string;
}

export const MediaLightboxModal: React.FC<MediaLightboxModalProps> = ({
  isOpen,
  onClose,
  items,
  initialIndex = 0,
  authorName,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  // Sync index when initialIndex changes
  React.useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  if (!isOpen || !items || items.length === 0) return null;

  const currentItem = items[currentIndex] || items[0];

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#0E0B13]/95 backdrop-blur-md flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full max-h-[92vh] bg-[#191321] border border-[#2D233D] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#2D233D] bg-[#0E0B13]/80">
          <div className="flex items-center gap-2.5">
            {currentItem.type === 'video' ? (
              <Film className="w-4 h-4 text-[#9B5CFF]" />
            ) : (
              <ImageIcon className="w-4 h-4 text-[#F05AA6]" />
            )}
            <div>
              <span className="text-xs font-semibold text-white">
                {authorName ? `${authorName}'s Media` : 'Community Media'}
              </span>
              <span className="text-[11px] text-[#B9B0C6] ml-2">
                ({currentIndex + 1} of {items.length})
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#B9B0C6] hover:text-white hover:bg-[#2D233D] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Viewer */}
        <div className="relative flex-1 bg-black/60 flex items-center justify-center min-h-[300px] sm:min-h-[460px] max-h-[68vh] overflow-hidden">
          {currentItem.type === 'video' ? (
            <div className="w-full h-full flex items-center justify-center relative">
              <video
                key={currentItem.url}
                src={currentItem.url}
                poster={currentItem.thumbnail_url}
                controls
                autoPlay={isPlaying}
                muted={isMuted}
                className="max-h-[65vh] w-auto max-w-full rounded-lg shadow-lg"
              >
                Your browser does not support HTML5 video playback.
              </video>
            </div>
          ) : (
            <img
              key={currentItem.url}
              src={currentItem.url}
              alt={currentItem.caption || 'Community media'}
              className="max-h-[65vh] w-auto max-w-full object-contain rounded-lg"
            />
          )}

          {/* Navigation arrows */}
          {items.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#0E0B13]/80 hover:bg-[#9B5CFF] text-white border border-[#2D233D] transition-all cursor-pointer shadow-lg"
                title="Previous media"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[#0E0B13]/80 hover:bg-[#9B5CFF] text-white border border-[#2D233D] transition-all cursor-pointer shadow-lg"
                title="Next media"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Bottom Details */}
        <div className="px-5 py-3.5 bg-[#191321] border-t border-[#2D233D] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="space-y-0.5">
            {currentItem.title && (
              <h4 className="font-semibold text-white text-sm">{currentItem.title}</h4>
            )}
            {currentItem.caption && (
              <p className="text-[#F8F5FC]/90 text-xs">{currentItem.caption}</p>
            )}
          </div>

          <div className="flex items-center gap-3 text-[#B9B0C6] text-[11px] shrink-0">
            {currentItem.created_at && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(currentItem.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            )}
            {currentItem.duration && (
              <span className="px-2 py-0.5 rounded bg-[#2D233D] text-white font-mono">
                {currentItem.duration}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
