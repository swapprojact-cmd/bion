import React from 'react';
import { Lock, LogIn, UserPlus, ShieldCheck, ArrowLeft, HeartHandshake, Compass } from 'lucide-react';

interface AccessGatePageProps {
  featureName: string;
  description: string;
  navigate: (route: string) => void;
}

export const AccessGatePage: React.FC<AccessGatePageProps> = ({
  featureName,
  description,
  navigate,
}) => {
  return (
    <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#9B5CFF]/20 to-[#F05AA6]/20 border border-[#9B5CFF]/40 flex items-center justify-center text-[#9B5CFF] shadow-lg shadow-[#9B5CFF]/20">
        <Lock className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#9B5CFF]/15 border border-[#9B5CFF]/30 text-xs font-semibold text-[#9B5CFF]">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Members Only Feature</span>
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Sign In to Access {featureName}
        </h2>
        <p className="text-sm text-[#B9B0C6] max-w-md mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      <div className="p-5 rounded-2xl bg-[#191321] border border-[#2D233D] text-left space-y-3">
        <div className="flex items-center gap-2 text-white font-semibold text-xs">
          <HeartHandshake className="w-4 h-4 text-[#F05AA6]" />
          <span>Why are some features member-only?</span>
        </div>
        <p className="text-xs text-[#B9B0C6] leading-relaxed">
          To protect community members from unsolicited spam and dating harassment, direct messages, member circles, and friend connections require a verified BiCircle profile.
        </p>
        <div className="pt-1 flex items-center gap-4 text-xs text-[#9B5CFF]">
          <span>✓ Free forever</span>
          <span>✓ Private identity protection</span>
          <span>✓ Zero dating solicitations</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={() => navigate('/signup')}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#9B5CFF]/25 cursor-pointer transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Free Account</span>
        </button>

        <button
          onClick={() => navigate('/login')}
          className="w-full sm:w-auto px-6 py-3 bg-[#191321] hover:bg-[#231A2F] border border-[#2D233D] text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <LogIn className="w-4 h-4 text-[#9B5CFF]" />
          <span>Sign In</span>
        </button>
      </div>

      <div className="pt-4">
        <button
          onClick={() => navigate('/feed')}
          className="inline-flex items-center gap-1.5 text-xs text-[#B9B0C6] hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Public Community Feed</span>
        </button>
      </div>
    </div>
  );
};
