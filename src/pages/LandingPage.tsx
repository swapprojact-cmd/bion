import React from 'react';
import { ArrowRight, HeartHandshake, ShieldCheck, Users, Sparkles } from 'lucide-react';
import { INITIAL_GROUPS, INITIAL_POSTS } from '../lib/initialData';
import { PostCard } from '../components/feed/PostCard';

interface LandingPageProps {
  navigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-0 py-4 sm:space-y-12 sm:py-8">
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
            A welcoming space for bisexual people to make friends, find support, share stories, and connect through shared interests—at your own pace.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button type="button" onClick={() => navigate('/signup')} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#9B5CFF]/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              Join BiCircle <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => navigate('/feed')} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              Explore community
            </button>
          </div>
          <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[#C4B6D4]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#C4A5FF]" aria-hidden="true" />
            Built around friendship, community support, privacy, and respectful connection.
          </p>
        </div>
      </section>

      <section aria-label="Community highlights" className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
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

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div><h2 className="text-xl font-bold text-white sm:text-2xl">Explore community circles</h2><p className="mt-1 text-xs text-[#B9B0C6] sm:text-sm">Start with something you love.</p></div>
          <button type="button" onClick={() => navigate('/explore')} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#C4A5FF] hover:bg-white/5 sm:px-3">View all <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INITIAL_GROUPS.slice(0, 3).map((group) => (
            <button key={group.id} type="button" onClick={() => navigate(`/groups/${group.id}`)} className="min-h-36 rounded-2xl border border-[#2D233D] bg-[#191321] p-4 text-left transition hover:border-[#9B5CFF]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9B5CFF] sm:p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C4A5FF]">{group.topic}</span>
              <span className="mt-2 block text-base font-bold text-white">{group.name}</span>
              <span className="mt-2 block text-xs leading-relaxed text-[#B9B0C6]">{group.description}</span>
              <span className="mt-4 block text-[11px] text-[#C4A5FF]">{group.member_count} members · Explore circle →</span>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div><h2 className="text-xl font-bold text-white sm:text-2xl">Community voices</h2><p className="mt-1 text-xs text-[#B9B0C6] sm:text-sm">A glimpse of conversations in BiCircle.</p></div>
          <button type="button" onClick={() => navigate('/feed')} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-[#C4A5FF] hover:bg-white/5 sm:px-3">Open feed <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></button>
        </div>
        <div className="space-y-3">
          {INITIAL_POSTS.slice(0, 2).map((post) => (
            <PostCard key={post.id} post={post} onNavigateToGroup={(id) => navigate(`/groups/${id}`)} onNavigateToProfile={(id) => navigate(`/members/${id}`)} />
          ))}
        </div>
      </section>
    </div>
  );
};
