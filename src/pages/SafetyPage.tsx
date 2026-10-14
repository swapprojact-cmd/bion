import React from 'react';
import { ShieldAlert, Ban, PhoneCall, ExternalLink, ShieldCheck, Flag } from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/common/Avatar';

interface SafetyPageProps {
  navigate: (route: string) => void;
}

export const SafetyPage: React.FC<SafetyPageProps> = ({ navigate }) => {
  const { currentUser } = useAuth();
  const { blockedUsers, unblockUser } = useCommunity();

  if (!currentUser) return null;

  const helplines = [
    {
      name: 'Bisexual Resource Center (BRC)',
      description: 'The oldest bi-specific advocacy and community organization in the US.',
      url: 'https://biresource.org',
    },
    {
      name: 'The Trevor Project',
      description: '24/7 confidential crisis counseling and suicide prevention for LGBTQ+ young people.',
      url: 'https://thetrevorproject.org',
      phone: '1-866-488-7386',
    },
    {
      name: 'LGBT National Help Center',
      description: 'Free, confidential peer-support, information, and local resources.',
      url: 'https://lgbthotline.org',
      phone: '1-888-843-4564',
    },
    {
      name: 'Trans Lifeline',
      description: 'Peer support hotline run by and for trans and nonbinary individuals.',
      url: 'https://translifeline.org',
      phone: '1-877-565-8860',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4 text-[#F8F5FC]">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[#9B5CFF] mb-1">
          Safety Center
        </div>
        <h1 className="text-2xl font-bold font-display text-white">
          Community Safety & Support
        </h1>
        <p className="text-xs text-[#B9B0C6] mt-1">
          Tools, blocking controls, and emergency support resources for our community
        </p>
      </div>

      {/* Blocked Accounts Management */}
      <section className="bg-[#191321] border border-[#2D233D] rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-[#2D233D]">
          <div className="flex items-center gap-2.5">
            <Ban className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">Blocked Members</h2>
              <p className="text-xs text-[#B9B0C6]">
                Blocked members cannot view your profile, posts, or message you
              </p>
            </div>
          </div>
          <span className="text-xs text-[#B9B0C6]">
            {blockedUsers.length} blocked
          </span>
        </div>

        {blockedUsers.length === 0 ? (
          <p className="text-xs text-[#B9B0C6] py-3 text-center">
            You haven’t blocked any community members.
          </p>
        ) : (
          <div className="space-y-2.5 pt-1">
            {blockedUsers.map(b => {
              const blockedProf = b.blocked_profile;
              return (
                <div
                  key={b.blocked_id}
                  className="p-3 rounded-xl bg-[#0E0B13] border border-[#2D233D] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={blockedProf?.avatar_path} name={blockedProf?.display_name || 'Member'} size="sm" />
                    <div>
                      <div className="text-xs font-semibold text-white">{blockedProf?.display_name || 'Member'}</div>
                      <div className="text-[10px] text-[#B9B0C6]">@{blockedProf?.username}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => unblockUser(b.blocked_id)}
                    className="px-3 py-1.5 rounded-lg bg-[#191321] border border-[#2D233D] hover:border-emerald-500/40 text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Unblock
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Reporting & Moderation Explanation */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-6 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-2.5">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Flag className="w-4 h-4 text-rose-400" /> When to Report Content
          </div>
          <p className="text-xs text-[#B9B0C6] leading-relaxed">
            Report any content containing romantic/dating solicitations, hookup advertisements, bi-erasure harassment, personal doxxing, explicit pornography, or spam. Reports are strictly confidential.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-2.5">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldCheck className="w-4 h-4 text-[#9B5CFF]" /> Human Moderation Process
          </div>
          <p className="text-xs text-[#B9B0C6] leading-relaxed">
            Every report is reviewed by vetted community moderators. Actions taken create tamper-evident audit logs, and sanctioned members have the right to request a second-look review.
          </p>
        </div>
      </section>

      {/* Helplines and Peer Support */}
      <section className="bg-[#191321] border border-[#2D233D] rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2.5 pb-2 border-b border-[#2D233D]">
          <PhoneCall className="w-5 h-5 text-[#F05AA6]" />
          <div>
            <h2 className="text-base font-bold text-white">Crisis & Peer Support Helplines</h2>
            <p className="text-xs text-[#B9B0C6]">
              If you or someone you know is in crisis, please connect with these verified support services
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {helplines.map((h, i) => (
            <div key={i} className="p-4 rounded-xl bg-[#0E0B13] border border-[#2D233D] space-y-2">
              <div className="font-semibold text-xs text-white">{h.name}</div>
              <p className="text-xs text-[#B9B0C6] leading-relaxed">{h.description}</p>
              {h.phone && (
                <div className="text-xs text-emerald-400 font-mono font-medium">
                  Tel: {h.phone}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
