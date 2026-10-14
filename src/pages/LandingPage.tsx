import React from 'react';
import { Users, HeartHandshake, ShieldCheck, BookOpen, Sparkles, MessageCircle, ArrowRight, Check, MapPin, Compass, Radar, Camera, Film } from 'lucide-react';
import { INITIAL_GROUPS, INITIAL_POSTS } from '../lib/initialData';
import { PostCard } from '../components/feed/PostCard';

interface LandingPageProps {
  navigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  return (
    <div className="space-y-16 py-6 pb-20">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto px-4 pt-8 pb-4">
        {/* Anti-dating banner / positioning */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#191321] border border-[#2D233D] text-xs text-[#B9B0C6] mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#9B5CFF]" />
          <span>A dedicated bisexual community platform · </span>
          <span className="text-white font-medium">Friendship, Support & Shared Interests</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold font-display tracking-tight text-white leading-tight">
          Find your people. <br />
          <span className="bg-gradient-to-r from-[#9B5CFF] via-[#F05AA6] to-[#9B5CFF] bg-clip-text text-transparent">
            Be yourself.
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-[#B9B0C6] max-w-2xl mx-auto leading-relaxed">
          BiCircle is an authentic social community for bisexual people. Connect through book clubs, parenting circles, career mentorship, and personal stories in a safe, judgment-free space.
        </p>

        {/* Clear Anti-Dating Declaration */}
        <div className="mt-5 p-3 rounded-xl bg-[#191321] border border-[#2D233D] max-w-xl mx-auto text-xs text-[#B9B0C6] flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#9B5CFF] shrink-0" />
          <span>
            <strong className="text-white">Not a dating app:</strong> No swipe cards, no hookups, no romantic matching. Strictly community and friendship.
          </span>
        </div>

        {/* Primary CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <button
            onClick={() => navigate('/signup')}
            className="px-6 py-3 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#9B5CFF]/25 flex items-center gap-2 cursor-pointer transition-all"
          >
            <span>Join the Community</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/feed')}
            className="px-6 py-3 bg-[#191321] hover:bg-[#251D30] text-white border border-[#2D233D] font-medium text-sm rounded-xl transition-all cursor-pointer"
          >
            Explore Public Discussions
          </button>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-[#191321] border border-[#2D233D] hover:border-[#3D2E55] transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#9B5CFF]/15 border border-[#9B5CFF]/30 flex items-center justify-center text-[#9B5CFF]">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-white">Interest-Driven Circles</h3>
            <p className="text-xs text-[#B9B0C6] leading-relaxed">
              Join focused groups for bi parents, STEM professionals, speculative fiction book lovers, and later-in-life realizing journeys.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#191321] border border-[#2D233D] hover:border-[#3D2E55] transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#F05AA6]/15 border border-[#F05AA6]/30 flex items-center justify-center text-[#F05AA6]">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-white">Real Friendship</h3>
            <p className="text-xs text-[#B9B0C6] leading-relaxed">
              Connect 1-on-1 without pressure. Build long-term peer support and platonic friendships with people who understand your lived experiences.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#191321] border border-[#2D233D] hover:border-[#3D2E55] transition-colors space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#9B5CFF]/15 border border-[#9B5CFF]/30 flex items-center justify-center text-[#9B5CFF]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold font-display text-white">Privacy & Safety by Design</h3>
            <p className="text-xs text-[#B9B0C6] leading-relaxed">
              Your public display name is independent of your account name. Granular visibility controls, strict anti-solicitation moderation, and blocking.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Groups Preview */}
      <section className="max-w-6xl mx-auto px-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold font-display text-white">Featured Community Circles</h2>
            <p className="text-xs text-[#B9B0C6] mt-1">Discover circles created by community members</p>
          </div>
          <button
            onClick={() => navigate('/explore')}
            className="text-xs font-semibold text-[#9B5CFF] hover:text-[#F05AA6] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All Groups</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {INITIAL_GROUPS.slice(0, 3).map((grp) => (
            <div
              key={grp.id}
              onClick={() => navigate(`/groups/${grp.id}`)}
              className="p-5 rounded-2xl bg-[#191321] border border-[#2D233D] hover:border-[#9B5CFF]/50 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="text-[11px] font-semibold text-[#9B5CFF] uppercase tracking-wider mb-1.5">
                  {grp.topic}
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-[#9B5CFF] transition-colors">
                  {grp.name}
                </h3>
                <p className="mt-2 text-xs text-[#B9B0C6] line-clamp-3 leading-relaxed">
                  {grp.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#2D233D]/60 flex items-center justify-between text-xs text-[#B9B0C6]">
                <span>{grp.member_count} members</span>
                <span className="text-[#9B5CFF] group-hover:translate-x-0.5 transition-transform">
                  Explore Circle →
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Nearby Community Radar Showcase */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-r from-[#191321] via-[#241738] to-[#191321] border border-[#2D233D] rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#9B5CFF]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <Compass className="w-3.5 h-3.5" />
                <span>Live GPS & Metro Discovery</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white tracking-tight">
                Connect with Nearby Peers & Shared Vibes
              </h2>
              <p className="text-xs sm:text-sm text-[#B9B0C6] leading-relaxed">
                Filter members by distance (10 km, 25 km, 50 km) or city to find local book club enthusiasts, hiking companions, and peer support. You can also upload your own photos and video reels directly from your device to your personal community gallery.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => navigate('/nearby')}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white font-semibold text-xs rounded-xl shadow-md shadow-[#9B5CFF]/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Radar className="w-4 h-4" />
                  <span>Open Nearby Radar</span>
                </button>
                <button
                  onClick={() => navigate('/feed')}
                  className="px-5 py-2.5 bg-[#0E0B13] border border-[#2D233D] hover:border-[#9B5CFF] text-[#F8F5FC] font-medium text-xs rounded-xl transition-all cursor-pointer"
                >
                  Explore Social Feed
                </button>
              </div>
            </div>

            {/* Visual radar card preview */}
            <div className="bg-[#0E0B13]/80 border border-[#2D233D] rounded-2xl p-5 space-y-3.5 shadow-2xl">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[#2D233D]">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" /> Nearby Member Vibe Match
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  GPS Active
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: 'Maya Lin', city: 'Brooklyn, NY', dist: '1.8 km', vibe: 'Book Club & Literature', tag: 'Mod' },
                  { name: 'Jordan Rivera', city: 'Manhattan, NY', dist: '3.4 km', vibe: 'Cycling & Outdoor Hikes', tag: 'Cycling' },
                  { name: 'Alex Thorne', city: 'Queens, NY', dist: '6.2 km', vibe: 'Bi Parenting Circle', tag: 'Parent' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-[#191321] border border-[#2D233D] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{item.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#9B5CFF]/20 text-[#9B5CFF]">
                          {item.tag}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#B9B0C6] mt-0.5">{item.vibe}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-emerald-400 text-xs font-semibold">{item.dist}</div>
                      <div className="text-[10px] text-[#B9B0C6]">{item.city}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Conversation Sample */}
      <section className="max-w-3xl mx-auto px-4 space-y-5">
        <div className="text-center">
          <h2 className="text-2xl font-bold font-display text-white">Recent Community Voices</h2>
          <p className="text-xs text-[#B9B0C6] mt-1">Authentic conversations from real community members</p>
        </div>
        <div className="space-y-4">
          {INITIAL_POSTS.slice(0, 2).map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onNavigateToGroup={(id) => navigate(`/groups/${id}`)}
              onNavigateToProfile={(id) => navigate(`/members/${id}`)}
            />
          ))}
        </div>
      </section>

      {/* Community Standards Checklist */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="p-8 rounded-2xl bg-gradient-to-b from-[#191321] to-[#0E0B13] border border-[#2D233D] text-[#F8F5FC]">
          <h3 className="text-xl font-bold font-display text-white text-center mb-6">
            Our Community Promise
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-[#B9B0C6]">
                <strong className="text-white">No dating profiles or swipes:</strong> We intentionally protect BiCircle as a peer and friendship haven.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-[#B9B0C6]">
                <strong className="text-white">Zero bi-erasure or gatekeeping:</strong> Whether you realized yesterday or decades ago, you belong here.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-[#B9B0C6]">
                <strong className="text-white">Pseudonymous freedom:</strong> Choose your public display name without needing legal credentials.
              </span>
            </div>
            <div className="flex items-start gap-2.5">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-[#B9B0C6]">
                <strong className="text-white">Human moderation:</strong> Clear appeals, audit records, and swift response to harassment or spam.
              </span>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/signup')}
              className="px-6 py-2.5 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white font-semibold text-xs rounded-xl shadow-lg shadow-[#9B5CFF]/20 transition-all cursor-pointer"
            >
              Get Started with BiCircle
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
