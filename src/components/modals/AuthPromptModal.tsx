import React from 'react';
import { Sparkles, LogIn, UserPlus, X, Lock, ShieldCheck, HeartHandshake } from 'lucide-react';

interface AuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  navigate: (route: string) => void;
  title?: string;
  description?: string;
}

export const AuthPromptModal: React.FC<AuthPromptModalProps> = ({
  isOpen,
  onClose,
  navigate,
  title = 'Join the BiCircle Community',
  description = 'Create a free account or log in to interact with members, share posts and photos, join discussion circles, and send messages.',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#130E1B] border border-[#9B5CFF]/40 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#B9B0C6] hover:text-white hover:bg-[#2D233D]/60 transition-colors"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-tr from-[#9B5CFF]/20 to-[#F05AA6]/20 border border-[#9B5CFF]/40">
            <Lock className="w-6 h-6 text-[#9B5CFF]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>{title}</span>
              <Sparkles className="w-4 h-4 text-[#F05AA6]" />
            </h3>
            <p className="text-xs text-[#B9B0C6] mt-0.5">Community Access Restricted to Members</p>
          </div>
        </div>

        <p className="text-xs text-[#D8D0E3] leading-relaxed">
          {description}
        </p>

        <div className="p-3 rounded-xl bg-[#191321] border border-[#2D233D] space-y-2 text-[11px] text-[#B9B0C6]">
          <div className="flex items-center gap-2 text-white font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Why is an account needed?</span>
          </div>
          <p>
            BiCircle is a protected, friendship-first space. Requiring login keeps spam and unsolicited harassment out, keeping the community safe and authentic.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              onClose();
              navigate('/signup');
            }}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-[#9B5CFF]/20 cursor-pointer transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account</span>
          </button>

          <button
            onClick={() => {
              onClose();
              navigate('/login');
            }}
            className="w-full py-2.5 px-3 bg-[#191321] hover:bg-[#231A2F] border border-[#2D233D] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            <LogIn className="w-4 h-4 text-[#9B5CFF]" />
            <span>Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
};
