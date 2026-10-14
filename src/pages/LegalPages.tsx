import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, Lock } from 'lucide-react';

interface LegalPageProps {
  navigate: (route: string) => void;
  type: 'privacy' | 'terms';
}

export const LegalPages: React.FC<LegalPageProps> = ({ navigate, type }) => {
  const isPrivacy = type === 'privacy';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 text-[#F8F5FC]">
      <button
        onClick={() => navigate(-1 as any || '/')}
        className="flex items-center gap-2 text-xs text-[#B9B0C6] hover:text-white transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-[#9B5CFF] mb-2 flex items-center gap-1.5">
          {isPrivacy ? <Lock className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
          Legal & Compliance Template
        </div>
        <h1 className="text-3xl font-extrabold font-display text-white">
          {isPrivacy ? 'BiCircle Privacy Policy' : 'BiCircle Terms of Service'}
        </h1>
        <p className="mt-2 text-xs text-[#B9B0C6]">
          Last updated: October 2026 · Notice: This template outlines our operational privacy and platform commitments.
        </p>
      </div>

      {isPrivacy ? (
        <div className="p-6 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-6 text-xs sm:text-sm text-[#B9B0C6] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Our Core Privacy Philosophy</h2>
            <p>
              We recognize that privacy is a safety necessity for LGBTQ+ individuals. We design BiCircle so that members can engage without exposing their legal names, employment, physical locations, or sexual orientation to unauthorized third parties or public search engines.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Data We Collect and Store</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong className="text-white">Account Information:</strong> Your registration email address and password hash (managed securely via Firebase Authentication). This is kept private and never published.
              </li>
              <li>
                <strong className="text-white">Public Profile:</strong> Your public display name, username, optional bio, pronouns, and chosen interests.
              </li>
              <li>
                <strong className="text-white">Private Profile:</strong> Optional identity notes and communication preferences, stored in separate tables with strict Row Level Security (RLS).
              </li>
              <li>
                <strong className="text-white">Community Content:</strong> Posts, comments, circle memberships, reactions, and direct messages that you actively generate.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Zero Third-Party Ad Tracking</h2>
            <p>
              BiCircle does not sell user data, track users across the web, or use third-party behavioral advertising networks. We do not expose sexual orientation or membership data in tracking pixels or open URL query parameters.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Data Retention & Deletion</h2>
            <p>
              Members may download a machine-readable export of all their personal data or submit an account deletion request at any time under Settings & Account.
            </p>
            <p>
              When an account is deleted, your profile, private identity notes, direct messages, and private group memberships are permanently erased. Audit logs for resolved safety violations or active abuse reports are retained in pseudonymized form solely for safety and anti-ban evasion purposes.
            </p>
          </section>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-[#191321] border border-[#2D233D] space-y-6 text-xs sm:text-sm text-[#B9B0C6] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">1. Eligibility & Age Requirement</h2>
            <p>
              You must be at least 18 years of age to register or use BiCircle. By registering an account, you affirm that you satisfy this requirement. Accounts created by underage users will be terminated upon notice.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">2. Prohibited Uses & Non-Dating Covenant</h2>
            <p>
              BiCircle is explicitly chartered for community, friendship, and shared discussions. You agree NOT to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Use BiCircle as a dating, hookup, or commercial matchmaking service.</li>
              <li>Harass, stalk, dox, or invalidate fellow community members.</li>
              <li>Distribute explicit pornographic media, spam, phishing links, or malware.</li>
              <li>Attempt to scrape, reverse engineer, or circumvent Row Level Security policies.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">3. Moderation & Termination</h2>
            <p>
              We reserve the right to warn, restrict, or terminate access for any member who violates community guidelines or compromises the safety of other users. Terminated users may appeal within 14 days through our moderation review process.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white">4. Disclaimer & Limitation of Liability</h2>
            <p>
              BiCircle is provided on an "as is" and "as available" basis. Peer support discussions do not replace professional mental health or medical counseling.
            </p>
          </section>
        </div>
      )}
    </div>
  );
};
