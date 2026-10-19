import React, { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle, Shield, KeyRound, Mail, User, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { store } from '../lib/dataService';

interface AuthPagesProps {
  mode: 'login' | 'signup' | 'forgot' | 'reset';
  navigate: (route: string) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({ mode, navigate }) => {
  const { login, signup } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [birthYear, setBirthYear] = useState<number>(1998);
  const [agreedToAge, setAgreedToAge] = useState(false);
  const [agreedToAntiDating, setAgreedToAntiDating] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/feed');
      } else {
        setError(res.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToAge) {
      setError('You must confirm that you are 18 years of age or older.');
      return;
    }
    if (!agreedToAntiDating) {
      setError('You must agree to BiCircle\'s non-dating community standard.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await signup({
        email,
        pass: password,
        displayName: displayName.trim() || 'New Member',
        username: username.trim() || 'user_' + Date.now().toString().slice(-4),
        birthYear,
      });

      if (res.success) {
        setSuccessMessage('Welcome to BiCircle! Your account has been initialized.');
        setTimeout(() => navigate('/feed'), 1000);
      } else {
        setError(res.error || 'Signup failed');
      }
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMessage(`Password recovery instructions have been sent to ${email}. Check your inbox.`);
    }, 800);
  };

  const handleReset = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccessMessage('Your password has been successfully updated. You may now sign in.');
      setTimeout(() => navigate('/login'), 1200);
    }, 800);
  };

  return (
    <div className="bc-page mx-auto max-w-md px-4 !py-8 text-[#F8F5FC] sm:!py-12">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-xs text-[#B9B0C6] hover:text-white transition-colors mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Home
      </button>

      <div className="bc-panel p-5 shadow-xl sm:p-8">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-12 h-12 rounded-2xl bg-[#0E0B13] border border-[#3D2E55] items-center justify-center p-2 mb-3 shadow-md shadow-[#9B5CFF]/10">
            <svg viewBox="0 0 32 32" className="w-full h-full">
              <circle cx="12" cy="16" r="8" fill="#F05AA6" fillOpacity="0.8" />
              <circle cx="20" cy="16" r="8" fill="#9B5CFF" fillOpacity="0.8" style={{ mixBlendMode: 'screen' }} />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-display text-white">
            {mode === 'login' && 'Sign in to BiCircle'}
            {mode === 'signup' && 'Join BiCircle'}
            {mode === 'forgot' && 'Reset your password'}
            {mode === 'reset' && 'Set a new password'}
          </h1>
          <p className="text-xs text-[#B9B0C6] mt-1.5">
            {mode === 'login' && 'Welcome back to your community circle'}
            {mode === 'signup' && 'Find your people. Be yourself.'}
            {mode === 'forgot' && 'Enter your account email to receive a recovery link'}
            {mode === 'reset' && 'Create a strong, secure password'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#B9B0C6] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="maya@example.com or mayawrites"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bc-field pl-10 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#B9B0C6]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-[#9B5CFF] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#B9B0C6] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-sm focus:outline-none focus:border-[#9B5CFF] text-[#F8F5FC]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="bc-primary-button w-full disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>

            <div className="text-center pt-2 text-xs text-[#B9B0C6]">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="text-[#9B5CFF] font-semibold hover:underline cursor-pointer"
              >
                Join BiCircle
              </button>
            </div>
          </form>
        )}

        {/* SIGNUP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
                Public Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#B9B0C6] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya, Jordan, Alex"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-sm focus:outline-none focus:border-[#9B5CFF] text-[#F8F5FC]"
                />
              </div>
              <p className="text-[11px] text-[#B9B0C6]/70 mt-1">
                Does not need to match your legal name. You may choose a pseudonym.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
                Unique Username
              </label>
              <input
                type="text"
                required
                placeholder="e.g. jordan_r"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="bc-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
                Account Email (Private)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#B9B0C6] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-sm focus:outline-none focus:border-[#9B5CFF] text-[#F8F5FC]"
                />
              </div>
              <p className="text-[11px] text-[#B9B0C6]/70 mt-1">
                Your email address is strictly confidential and never displayed publicly.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#B9B0C6] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-sm focus:outline-none focus:border-[#9B5CFF] text-[#F8F5FC]"
                />
              </div>
            </div>

            {/* Age & Anti-Dating declarations */}
            <div className="space-y-2 pt-2 border-t border-[#2D233D]">
              <label className="flex items-start gap-2.5 text-xs text-[#B9B0C6] cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedToAge}
                  onChange={(e) => setAgreedToAge(e.target.checked)}
                  className="mt-0.5 rounded border-[#2D233D] text-[#9B5CFF] focus:ring-0 bg-[#0E0B13]"
                />
                <span>I affirm that I am at least 18 years of age.</span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-[#B9B0C6] cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedToAntiDating}
                  onChange={(e) => setAgreedToAntiDating(e.target.checked)}
                  className="mt-0.5 rounded border-[#2D233D] text-[#9B5CFF] focus:ring-0 bg-[#0E0B13]"
                />
                <span>
                  I acknowledge that BiCircle is NOT a dating or hookup app, and agree to participate in good faith for friendship and community.
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-[#9B5CFF]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create BiCircle Account'}
            </button>

            <div className="text-center pt-2 text-xs text-[#B9B0C6]">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#9B5CFF] font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {/* FORGOT PASSWORD FORM */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
                Account Email
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-sm focus:outline-none focus:border-[#9B5CFF] text-[#F8F5FC]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-[#9B5CFF]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Sending link...' : 'Send Recovery Link'}
            </button>
            <div className="text-center pt-2 text-xs text-[#B9B0C6]">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-[#9B5CFF] hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}

        {/* RESET PASSWORD FORM */}
        {mode === 'reset' && (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-sm focus:outline-none focus:border-[#9B5CFF] text-[#F8F5FC]"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-[#9B5CFF]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Save New Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
