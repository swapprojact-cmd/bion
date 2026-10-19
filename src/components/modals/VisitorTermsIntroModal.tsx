import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles, ArrowRight, BookOpen, Users, Heart } from 'lucide-react';

interface VisitorTermsIntroModalProps {
  navigate: (route: string) => void;
}

export const VisitorTermsIntroModal: React.FC<VisitorTermsIntroModalProps> = ({ navigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [agreedToAge, setAgreedToAge] = useState(false);
  const [agreedToCommunity, setAgreedToCommunity] = useState(false);
  const [agreedToSafeSpace, setAgreedToSafeSpace] = useState(false);

  useEffect(() => {
    // Show this introduction once until the visitor accepts the community agreement.
    try {
      if (localStorage.getItem('bicircle_terms_accepted') !== 'true') {
        const timer = window.setTimeout(() => setIsOpen(true), 600);
        return () => window.clearTimeout(timer);
      }
    } catch {
      // If storage is unavailable, still show the welcome modal.
      const timer = window.setTimeout(() => setIsOpen(true), 600);
      return () => window.clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem('bicircle_terms_accepted', 'true');
    } catch {
      // Accepting the agreement should still allow navigation if storage is blocked.
    }
    setIsOpen(false);
  };

  const chooseCommunity = () => {
    handleAccept();
    navigate('/feed');
  };

  const chooseMatch = () => {
    handleAccept();
    navigate('/see-your-match');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-md sm:p-5"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bicircle-welcome-title"
        className="relative my-auto w-full max-w-lg overflow-hidden rounded-3xl border border-[#3D2E55] bg-[#191321] p-5 text-[#F8F5FC] shadow-2xl sm:p-7"
      >
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#9B5CFF]/15 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[#F05AA6]/15 blur-3xl" />

        <div className="relative text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#9B5CFF]/40 bg-gradient-to-tr from-[#9B5CFF]/20 to-[#F05AA6]/20 text-[#D8C1FF]">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 id="bicircle-welcome-title" className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Welcome to BiCircle
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#C8BED4]">
            Find your people, feel supported, and choose how you want to connect.
          </p>
        </div>

        <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={chooseCommunity}
            className="group flex min-h-28 items-start gap-3 rounded-2xl border border-[#9B5CFF]/35 bg-[#0E0B13]/75 p-4 text-left transition hover:border-[#B99AFF] hover:bg-[#9B5CFF]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C4A5FF]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#9B5CFF]/15 text-[#C4A5FF]">
              <Users className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-white">Community &amp; Friendship</span>
              <span className="mt-1 block text-xs leading-relaxed text-[#B9B0C6]">Meet people, join circles, and find support.</span>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#C4A5FF]">Explore community <ArrowRight className="h-3.5 w-3.5" /></span>
            </span>
          </button>

          <button
            type="button"
            onClick={chooseMatch}
            className="group flex min-h-28 items-start gap-3 rounded-2xl border border-[#F05AA6]/35 bg-[#0E0B13]/75 p-4 text-left transition hover:border-[#F5A1CF] hover:bg-[#F05AA6]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A1CF]"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F05AA6]/15 text-[#F5A1CF]">
              <Heart className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold text-white">See Your Match</span>
              <span className="mt-1 block text-xs leading-relaxed text-[#B9B0C6]">Opt in to explore connections on your terms.</span>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#F5A1CF]">Explore matches <ArrowRight className="h-3.5 w-3.5" /></span>
            </span>
          </button>
        </div>

        <div className="relative mt-5 space-y-3 rounded-2xl border border-[#2D233D] bg-[#0E0B13]/70 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#C4A5FF]">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            A safe, respectful space
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-[#C8BED4]">
            <input
              type="checkbox"
              checked={agreedToCommunity}
              onChange={(event) => setAgreedToCommunity(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#3D2E55] bg-[#191321] accent-[#9B5CFF] focus:ring-[#9B5CFF]"
            />
            <span><strong className="text-white">Community agreement:</strong> I will respect others, avoid harassment and pressure, and follow the community guidelines.</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-[#C8BED4]">
            <input
              type="checkbox"
              checked={agreedToSafeSpace}
              onChange={(event) => setAgreedToSafeSpace(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#3D2E55] bg-[#191321] accent-[#9B5CFF] focus:ring-[#9B5CFF]"
            />
            <span><strong className="text-white">Privacy and safety:</strong> I will respect privacy, boundaries, and mutual consent.</span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-[#C8BED4]">
            <input
              type="checkbox"
              checked={agreedToAge}
              onChange={(event) => setAgreedToAge(event.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#3D2E55] bg-[#191321] accent-[#9B5CFF] focus:ring-[#9B5CFF]"
            />
            <span><strong className="text-white">Adults only (18+):</strong> I confirm I am at least 18 years old.</span>
          </label>
        </div>

        <div className="relative mt-4 space-y-3">
          <button
            type="button"
            onClick={handleAccept}
            disabled={!agreedToAge || !agreedToCommunity || !agreedToSafeSpace}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-[#9B5CFF]/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            I Agree &amp; Enter BiCircle <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-[#B9B0C6]">
            <button type="button" onClick={() => { handleAccept(); navigate('/guidelines'); }} className="inline-flex items-center gap-1 hover:text-white hover:underline">
              <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> Community Guidelines
            </button>
            <button type="button" onClick={() => { handleAccept(); navigate('/terms'); }} className="hover:text-white hover:underline">
              Terms of Service
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
