import React from 'react';
import { ArrowRight, HeartHandshake, ShieldCheck, Users, Sparkles } from 'lucide-react';

interface LandingPageProps {
  navigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-0 py-4 sm:space-y-8 sm:py-8">
      <section className="relative isolate overflow-hidden rounded-3xl border border-[#9B5CFF]/30 bg-gradient-to-br from-[#281746] via-[#191321] to-[#30152C] px-5 py-8 shadow-xl shadow-black/20 sm:px-10 sm:py-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#9B5CFF]/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-1/3 h-40 w-40 rounded-full bg-[#F05AA6]/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#E0D0FF]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            A community where you belong
          </div>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            Find your people.<br />
            <span className="bg-gradient-to-r from-[#C4A5FF] to-[#F5A1CF] bg-clip-text text-transparent">Be yourself.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#D0C5DD] sm:text-base">
            A welcoming space to make friends, find support, share stories, and connect through shared interests—at your own pace.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => navigate('/signup')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#9B5CFF]/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              Join BiCircle <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => navigate('/login')} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              Sign in
            </button>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[#C4B6D4]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#C4A5FF]" aria-hidden="true" />
            Built around friendship, community support, privacy, and respectful connection.
          </p>
        </div>
      </section>

      <section aria-label="Community values" className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="flex items-start gap-3 rounded-2xl border border-[#2D233D] bg-[#191321] p-4 sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#9B5CFF]/15 text-[#C4A5FF]"><Users className="h-5 w-5" aria-hidden="true" /></span>
          <div><h2 className="text-sm font-bold text-white">Find your circle</h2><p className="mt-1 text-xs leading-relaxed text-[#B9B0C6]">Meet people through shared interests and community groups.</p></div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-[#2D233D] bg-[#191321] p-4 sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F05AA6]/15 text-[#F5A1CF]"><HeartHandshake className="h-5 w-5" aria-hidden="true" /></span>
          <div><h2 className="text-sm font-bold text-white">Feel supported</h2><p className="mt-1 text-xs leading-relaxed text-[#B9B0C6]">Share experiences and build genuine friendships without pressure.</p></div>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-[#2D233D] bg-[#191321] p-4 sm:p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><ShieldCheck className="h-5 w-5" aria-hidden="true" /></span>
          <div><h2 className="text-sm font-bold text-white">Connect safely</h2><p className="mt-1 text-xs leading-relaxed text-[#B9B0C6]">Choose how you participate and use privacy and safety controls.</p></div>
        </div>
      </section>
    </div>
  );
};
