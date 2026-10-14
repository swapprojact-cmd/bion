import React, { useState } from 'react';
import { Flag, X, CheckCircle, AlertTriangle } from 'lucide-react';
import { ReportTargetType, ReportReason } from '../../types';
import { useCommunity } from '../../context/CommunityContext';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetLabel?: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetLabel,
}) => {
  const { reportContent } = useCommunity();
  const [reason, setReason] = useState<ReportReason>('dating_or_hookup_solicitation');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await reportContent(targetType, targetId, reason, details);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setDetails('');
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Failed to submit report:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-[#191321] border border-[#2D233D] rounded-2xl p-6 text-[#F8F5FC] shadow-2xl relative">
        <div className="flex items-start justify-between pb-3 border-b border-[#2D233D]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display">Report to Community Moderation</h3>
              <p className="text-xs text-[#B9B0C6]">
                Confidential review by trusted community moderators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#B9B0C6] hover:text-white rounded-lg hover:bg-[#2D233D]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
            <div className="text-base font-semibold">Report Received</div>
            <p className="text-xs text-[#B9B0C6] max-w-xs mx-auto">
              Thank you for keeping BiCircle safe and friendship-centered. Our team reviews all reports promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {targetLabel && (
              <div className="p-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#B9B0C6]">
                Reporting {targetType}: <span className="text-white font-medium">{targetLabel}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
                Reason for report
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as ReportReason)}
                className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-sm focus:outline-none focus:border-[#9B5CFF] text-[#F8F5FC]"
              >
                <option value="dating_or_hookup_solicitation">Dating, hookup or romantic solicitation (Strictly Prohibited)</option>
                <option value="harassment">Harassment, bullying, or intimidation</option>
                <option value="hate_speech">Hate speech or bi-erasure hostility</option>
                <option value="privacy_violation">Doxxing or unauthorized disclosure of identity</option>
                <option value="spam_or_phishing">Spam, commercial sales or scams</option>
                <option value="inappropriate_media">Explicit / inappropriate media</option>
                <option value="other">Other policy violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
                Additional context (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Describe what occurred or how this breaches community guidelines..."
                className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs focus:outline-none focus:border-[#9B5CFF] text-[#F8F5FC] resize-none"
              />
            </div>

            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                BiCircle is explicitly for friendship and community. Reports of dating app behavior are prioritized for prompt removal.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2D233D]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-[#B9B0C6] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
