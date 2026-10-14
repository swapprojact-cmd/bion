import React from 'react';
import { ShieldCheck, Heart, Users, Lock, Compass, ArrowLeft } from 'lucide-react';

interface AboutPageProps {
  navigate: (route: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ navigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-10 text-[#F8F5FC]">
      <button
        onClick={() => navigate(-1 as any || '/')}
        className="flex items-center gap-2 text-xs text-[#B9B0C6] hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[#9B5CFF] mb-2">
          Mission & Values
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
          Why We Built BiCircle
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#B9B0C6] leading-relaxed">
          BiCircle was founded on a simple observation: bisexual people represent the largest demographic within the LGBTQ+ community, yet frequently face the highest rates of social isolation, biphobia from both heterosexual and homosexual spheres, and lack of dedicated, non-sexualized community infrastructure.
        </p>
      </div>

      {/* Core Tenet: Why Not A Dating App */}
      <div className="p-6 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/15 text-[#9B5CFF] border border-[#9B5CFF]/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display text-white">
              The Deliberate Choice: Not a Dating App
            </h2>
            <p className="text-xs text-[#B9B0C6]">Preserving spaces for platonic peer connection</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#B9B0C6] leading-relaxed">
          Almost all existing bisexual platforms or apps collapse into hyper-sexualized hookup finders, dating feeds, or commercialized marketplaces. When an app is built around dating or romantic matching, people cannot safely seek friendship, parenting advice, mentorship, or support without unsolicited romantic advances.
        </p>
        <p className="text-xs sm:text-sm text-[#B9B0C6] leading-relaxed">
          BiCircle firmly rejects this model. You will not find swipe cards, romantic compatibility algorithms, hookup discovery, or attractiveness ratings here. Our space is built for real discussions, shared interests, and enduring community support.
        </p>
      </div>

      {/* Values Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-2.5">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Heart className="w-4 h-4 text-[#F05AA6]" /> Valid Across All Life Stages
          </div>
          <p className="text-xs text-[#B9B0C6] leading-relaxed">
            Whether you came out in high school, during college, or realized your truth in your 40s while raising a family, your journey is valid and honored here.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-2.5">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Lock className="w-4 h-4 text-[#9B5CFF]" /> Privacy First & Pseudonymity
          </div>
          <p className="text-xs text-[#B9B0C6] leading-relaxed">
            Your safety comes first. We never mandate legal identity verification or force public disclosure of your sexual orientation. You control your public display name.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-2.5">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Users className="w-4 h-4 text-emerald-400" /> Community Self-Governance
          </div>
          <p className="text-xs text-[#B9B0C6] leading-relaxed">
            Circles are managed by community members who foster respectful guidelines. Transparent moderation, recorded audit actions, and a human appeal process.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-2.5">
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Compass className="w-4 h-4 text-blue-400" /> Intersectionality & Respect
          </div>
          <p className="text-xs text-[#B9B0C6] leading-relaxed">
            Bisexuality intersects with race, disability, gender identity, culture, and nationality. We actively celebrate and protect this diversity.
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-[#2D233D] flex items-center justify-between">
        <span className="text-xs text-[#B9B0C6]">Ready to participate in our community?</span>
        <button
          onClick={() => navigate('/signup')}
          className="px-5 py-2.5 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] text-white text-xs font-semibold rounded-xl hover:opacity-95 transition-opacity cursor-pointer shadow-md shadow-[#9B5CFF]/20"
        >
          Join BiCircle Today
        </button>
      </div>
    </div>
  );
};
