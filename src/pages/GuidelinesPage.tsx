import React from 'react';
import { Shield, CheckCircle2, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

interface GuidelinesPageProps {
  navigate: (route: string) => void;
}

export const GuidelinesPage: React.FC<GuidelinesPageProps> = ({ navigate }) => {
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
          Safety & Standards
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
          Community Guidelines
        </h1>
        <p className="mt-3 text-sm sm:text-base text-[#B9B0C6] leading-relaxed">
          BiCircle is built on empathy, trust, and mutual respect. To ensure our space remains safe, supportive, and accessible for everyone, all members agree to abide by these core standards.
        </p>
      </div>

      {/* Rules Breakdown */}
      <div className="space-y-6">
        {/* Rule 1 */}
        <div className="p-6 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-3">
          <div className="flex items-center gap-2.5 text-base font-bold text-white">
            <span className="w-6 h-6 rounded-lg bg-[#9B5CFF]/20 text-[#9B5CFF] flex items-center justify-center text-xs">1</span>
            Strict Prohibition on Dating & Romantic Solicitation
          </div>
          <p className="text-xs sm:text-sm text-[#B9B0C6] leading-relaxed">
            BiCircle is exclusively for community, friendship, discussions, and support. Do not post dating advertisements, personal matchmaking requests, hookup proposals, or unsolicited romantic advances in public feeds, groups, or direct messages.
          </p>
          <div className="p-3 bg-[#0E0B13] rounded-xl border border-[#2D233D] text-xs text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Violations of this rule lead to immediate message restrictions or account suspension.</span>
          </div>
        </div>

        {/* Rule 2 */}
        <div className="p-6 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-3">
          <div className="flex items-center gap-2.5 text-base font-bold text-white">
            <span className="w-6 h-6 rounded-lg bg-[#9B5CFF]/20 text-[#9B5CFF] flex items-center justify-center text-xs">2</span>
            Zero Bi-Erasure, Gatekeeping, or Invalidating Language
          </div>
          <p className="text-xs sm:text-sm text-[#B9B0C6] leading-relaxed">
            Never challenge another member’s bisexuality based on their relationship history, gender of their current partner, sexual experience, or time of coming out. Bisexuality does not depend on equal 50/50 attraction or performing specific stereotypes.
          </p>
        </div>

        {/* Rule 3 */}
        <div className="p-6 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-3">
          <div className="flex items-center gap-2.5 text-base font-bold text-white">
            <span className="w-6 h-6 rounded-lg bg-[#9B5CFF]/20 text-[#9B5CFF] flex items-center justify-center text-xs">3</span>
            Confidentiality & Privacy of Member Stories
          </div>
          <p className="text-xs sm:text-sm text-[#B9B0C6] leading-relaxed">
            Many members are not publicly out in their offline lives. Never screenshot private group posts, publish member information externally, or out someone without their explicit, written consent. Respect boundaries unconditionally.
          </p>
        </div>

        {/* Rule 4 */}
        <div className="p-6 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-3">
          <div className="flex items-center gap-2.5 text-base font-bold text-white">
            <span className="w-6 h-6 rounded-lg bg-[#9B5CFF]/20 text-[#9B5CFF] flex items-center justify-center text-xs">4</span>
            No Hate Speech, Harassment, or Bigotry
          </div>
          <p className="text-xs sm:text-sm text-[#B9B0C6] leading-relaxed">
            Racism, transphobia, biphobia, misogyny, ableism, ageism, or religious hatred will not be tolerated. We protect all intersecting identities within our bisexual community.
          </p>
        </div>

        {/* Rule 5 */}
        <div className="p-6 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-3">
          <div className="flex items-center gap-2.5 text-base font-bold text-white">
            <span className="w-6 h-6 rounded-lg bg-[#9B5CFF]/20 text-[#9B5CFF] flex items-center justify-center text-xs">5</span>
            Content Appropriateness & Age Policy
          </div>
          <p className="text-xs sm:text-sm text-[#B9B0C6] leading-relaxed">
            BiCircle is an 18+ platform. While discussions of adult relationships and mental health are welcome, explicit sexual media, pornography, or commercial sexual services are prohibited on public feeds and groups.
          </p>
        </div>
      </div>

      {/* Enforcement & Reporting */}
      <div className="p-6 rounded-2xl bg-[#0E0B13] border border-[#2D233D] space-y-3 text-xs text-[#B9B0C6]">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#9B5CFF]" /> How We Enforce Standards
        </h3>
        <p>
          Every post, comment, and member profile features a report button. Reports are reviewed by human community moderators who can issue warnings, remove content, restrict direct messaging, or suspend accounts.
        </p>
        <p>
          Affected members receive clear notices regarding any moderation action taken, and can submit an appeal through our moderation portal.
        </p>
      </div>
    </div>
  );
};
