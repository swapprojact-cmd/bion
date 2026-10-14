import React, { useState, useEffect } from 'react';
import { ShieldCheck, HeartHandshake, Lock, Sparkles, Check, ArrowRight, BookOpen } from 'lucide-react';

interface VisitorTermsIntroModalProps {
  navigate: (route: string) => void;
}

export const VisitorTermsIntroModal: React.FC<VisitorTermsIntroModalProps> = ({ navigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [agreedToAge, setAgreedToAge] = useState(true);
  const [agreedToAntiDating, setAgreedToAntiDating] = useState(true);
  const [agreedToSafeSpace, setAgreedToSafeSpace] = useState(true);

  useEffect(() => {
    // Check if visitor has accepted terms before
    const hasAgreed = localStorage.getItem('bicircle_terms_accepted');
    if (!hasAgreed) {
      // Show welcoming terms modal to new visitors
      const timer = setTimeout(() => setIsOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('bicircle_terms_accepted', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#191321] border border-[#3D2E55] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-[#F8F5FC] overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#9B5CFF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#F05AA6]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="relative space-y-3 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#9B5CFF]/20 to-[#F05AA6]/20 border border-[#9B5CFF]/40 text-[#9B5CFF] shadow-lg shadow-[#9B5CFF]/15">
            <svg viewBox="0 0 32 32" className="w-8 h-8">
              <circle cx="12" cy="16" r="8" fill="#F05AA6" fillOpacity="0.8" />
              <circle cx="20" cy="16" r="8" fill="#9B5CFF" fillOpacity="0.8" style={{ mixBlendMode: 'screen' }} />
            </svg>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
              Welcome to BiCircle
            </h2>
            <p className="text-xs sm:text-sm text-[#B9B0C6] max-w-md mx-auto">
              A real, authentic social sanctuary for bisexual, bi-curious & queer community to connect through shared interests.
            </p>
          </div>
        </div>

        {/* Core Pillars / Terms */}
        <div className="relative space-y-3 bg-[#0E0B13]/70 p-4 sm:p-5 rounded-2xl border border-[#2D233D]">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#9B5CFF] mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#9B5CFF]" />
            <span>Community Agreement & Terms of Connection</span>
          </div>

          <div className="space-y-3 text-xs text-[#B9B0C6]">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToAntiDating}
                onChange={(e) => setAgreedToAntiDating(e.target.checked)}
                className="mt-0.5 rounded border-[#2D233D] text-[#9B5CFF] focus:ring-0 bg-[#191321] cursor-pointer"
              />
              <span className="leading-relaxed group-hover:text-white transition-colors">
                <strong className="text-white">Strictly Friendship & Community:</strong> BiCircle is not a dating or hookup app. Solicitations and romantic pressure are strictly prohibited.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToSafeSpace}
                onChange={(e) => setAgreedToSafeSpace(e.target.checked)}
                className="mt-0.5 rounded border-[#2D233D] text-[#9B5CFF] focus:ring-0 bg-[#191321] cursor-pointer"
              />
              <span className="leading-relaxed group-hover:text-white transition-colors">
                <strong className="text-white">Affirming & Safe Haven:</strong> Zero tolerance for biphobia, gatekeeping, or harassment. Pseudonyms and privacy are fully respected.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreedToAge}
                onChange={(e) => setAgreedToAge(e.target.checked)}
                className="mt-0.5 rounded border-[#2D233D] text-[#9B5CFF] focus:ring-0 bg-[#191321] cursor-pointer"
              />
              <span className="leading-relaxed group-hover:text-white transition-colors">
                <strong className="text-white">Adult Space (18+):</strong> I confirm I am at least 18 years of age and agree to abide by the community guidelines.
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="relative space-y-3">
          <button
            onClick={handleAccept}
            disabled={!agreedToAge || !agreedToAntiDating || !agreedToSafeSpace}
            className="w-full py-3 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#9B5CFF]/25 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40"
          >
            <span>I Agree & Enter BiCircle</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-between text-xs text-[#B9B0C6] px-1 pt-1">
            <button
              onClick={() => {
                handleAccept();
                navigate('/guidelines');
              }}
              className="hover:text-white hover:underline flex items-center gap-1 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" /> Read Community Guidelines
            </button>
            <button
              onClick={() => {
                handleAccept();
                navigate('/terms');
              }}
              className="hover:text-white hover:underline cursor-pointer"
            >
              Terms of Service
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
