import React, { useState } from 'react';
import { Database, CheckCircle, Copy, AlertCircle, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { getSupabaseConfig, updateSupabaseConfig, isSupabaseConfigured } from '../../lib/supabase';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ isOpen, onClose }) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [key, setKey] = useState(currentConfig.key);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const isConnected = isSupabaseConfigured();

  const handleSave = () => {
    updateSupabaseConfig(url, key);
    setSaveStatus('Configuration saved. Reloading connection...');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const handleClear = () => {
    updateSupabaseConfig('', '');
    setUrl('');
    setKey('');
    setSaveStatus('Cleared credentials. Reverted to local persistent state.');
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  const copyMigrationPath = () => {
    navigator.clipboard.writeText('/supabase/migrations/20261013000000_bicircle_schema.sql');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl bg-[#191321] border border-[#2D233D] rounded-2xl shadow-2xl p-6 text-[#F8F5FC] relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#2D233D]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#9B5CFF]/15 text-[#9B5CFF] border border-[#9B5CFF]/30">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-display flex items-center gap-2">
                Supabase Backend Setup
              </h2>
              <p className="text-xs text-[#B9B0C6]">
                PostgreSQL, Row Level Security, Auth, Storage & Realtime
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#B9B0C6] hover:text-white hover:bg-[#2D233D]/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Connection Status */}
        <div className="mt-4 p-3.5 rounded-xl bg-[#0E0B13] border border-[#2D233D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
              }`}
            />
            <div>
              <div className="text-sm font-semibold">
                {isConnected ? 'Connected to Live Supabase' : 'Running on Interactive Local Persistence'}
              </div>
              <div className="text-xs text-[#B9B0C6]">
                {isConnected
                  ? 'Queries and authentication route to your configured Supabase project.'
                  : 'All features, RLS policies, tables, and roles are fully interactive and saved locally.'}
              </div>
            </div>
          </div>
          {isConnected && (
            <span className="text-xs text-emerald-400 font-mono px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
              Active
            </span>
          )}
        </div>

        {/* Configuration inputs */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
              Supabase Project URL (VITE_SUPABASE_URL)
            </label>
            <input
              type="text"
              placeholder="https://your-project.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-sm focus:outline-none focus:border-[#9B5CFF] text-[#F8F5FC] font-mono transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1.5">
              Supabase Anon / Public Key (VITE_SUPABASE_ANON_KEY)
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-sm focus:outline-none focus:border-[#9B5CFF] text-[#F8F5FC] font-mono transition-colors"
            />
          </div>

          {/* Database Migration Instructions */}
          <div className="p-3.5 bg-[#0E0B13]/70 border border-[#2D233D] rounded-xl text-xs space-y-2">
            <div className="flex items-center justify-between text-[#B9B0C6]">
              <span className="font-semibold flex items-center gap-1.5 text-white">
                <ShieldCheck className="w-4 h-4 text-[#9B5CFF]" /> SQL Schema & RLS Policies (16 Tables)
              </span>
              <button
                type="button"
                onClick={copyMigrationPath}
                className="text-[11px] text-[#9B5CFF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied path' : 'Copy SQL path'}
              </button>
            </div>
            <p className="text-[#B9B0C6]">
              The complete version-controlled schema file is located in{' '}
              <code className="text-[#F05AA6] font-mono">/supabase/migrations/20261013000000_bicircle_schema.sql</code>.
              Run this in your Supabase SQL editor to create all 16 tables with check constraints and RLS security policies.
            </p>
          </div>
        </div>

        {saveStatus && (
          <div className="mt-4 p-2.5 rounded-lg bg-[#9B5CFF]/15 border border-[#9B5CFF]/30 text-xs text-[#F8F5FC] text-center">
            {saveStatus}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#2D233D]">
          {isConnected && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-xs text-[#B9B0C6] hover:text-rose-400 transition-colors"
            >
              Reset to Local Mode
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-[#B9B0C6] hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 bg-gradient-to-r from-[#9B5CFF] to-[#F05AA6] hover:opacity-95 text-white text-xs font-semibold rounded-xl shadow-lg shadow-[#9B5CFF]/20 transition-all cursor-pointer"
          >
            Save & Connect
          </button>
        </div>
      </div>
    </div>
  );
};
