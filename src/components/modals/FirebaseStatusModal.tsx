import React, { useState } from 'react';
import { Flame, CheckCircle, Database, ShieldCheck, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { checkFirestoreConnection, firebaseConfig, databaseId, type FirestoreConnectionCheck } from '../../lib/firebase';

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseStatusModal: React.FC<FirebaseStatusModalProps> = ({ isOpen, onClose }) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<FirestoreConnectionCheck | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(await checkFirestoreConnection());
    } finally {
      setTesting(false);
    }
  };

  const statusLabel = testing
    ? 'Testing…'
    : testResult?.ok
      ? 'Reachable'
      : testResult
        ? 'Check failed'
        : 'Not tested';

  const statusColor = testResult?.ok
    ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25'
    : testResult
      ? 'text-rose-300 bg-rose-500/10 border-rose-500/25'
      : 'text-amber-200 bg-amber-500/10 border-amber-500/25';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="firebase-database-dialog-title"
        className="relative my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-[#2D233D] bg-[#191321] p-5 text-[#F8F5FC] shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#2D233D] pb-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="rounded-xl border border-[#9B5CFF]/30 bg-[#9B5CFF]/10 p-2.5 text-[#C4A5FF]">
              <Database className="h-6 w-6" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 id="firebase-database-dialog-title" className="text-lg font-bold font-display sm:text-xl">Firestore diagnostics</h2>
              <p className="mt-1 text-xs leading-relaxed text-[#B9B0C6]">Checks the database configured for BiCircle.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Firestore diagnostics" className="rounded-lg p-2 text-[#B9B0C6] transition-colors hover:bg-[#2D233D]/50 hover:text-white">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#2D233D] bg-[#0E0B13] p-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`rounded-lg p-2 ${testResult?.ok ? 'bg-emerald-500/10 text-emerald-300' : testResult ? 'bg-rose-500/10 text-rose-300' : 'bg-amber-500/10 text-amber-200'}`}>
              {testResult?.ok ? <CheckCircle className="h-5 w-5" aria-hidden="true" /> : <AlertTriangle className="h-5 w-5" aria-hidden="true" />}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">Connection status</div>
              <div className="mt-0.5 break-all font-mono text-[11px] text-[#B9B0C6]">{databaseId}</div>
            </div>
          </div>
          <span className={`shrink-0 rounded-lg border px-2 py-1 text-[11px] font-semibold ${statusColor}`}>{statusLabel}</span>
        </div>

        <div className="mt-4 space-y-2 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2D233D] bg-[#0E0B13] p-3">
            <span className="text-[#B9B0C6]">Firebase project</span>
            <code className="break-all text-white">{firebaseConfig.projectId || 'Not configured'}</code>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2D233D] bg-[#0E0B13] p-3">
            <span className="text-[#B9B0C6]">Auth domain</span>
            <code className="break-all text-white">{firebaseConfig.authDomain || 'Not configured'}</code>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#2D233D] bg-[#0E0B13] p-3">
            <span className="text-[#B9B0C6]">Storage bucket</span>
            <code className="break-all text-white">{firebaseConfig.storageBucket || 'Not configured'}</code>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl border border-[#2D233D] bg-[#0E0B13] p-3">
            <span className="flex items-center gap-2 text-[#B9B0C6]"><ShieldCheck className="h-4 w-4" /> Rules deployment</span>
            <span className="text-amber-200">Check GitHub deploy log</span>
          </div>
        </div>

        {testResult && (
          <div role={testResult.ok ? 'status' : 'alert'} className={`mt-3 rounded-xl border p-3 text-xs leading-relaxed ${testResult.ok ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/25 bg-rose-500/10 text-rose-200'}`}>
            {testResult.ok
              ? 'The server health-check document was read from the configured database. This confirms connectivity for that read only; individual collections can still be blocked by rules or missing indexes.'
              : `Could not read the Firestore health-check document (${testResult.code}): ${testResult.message}`}
          </div>
        )}

        <div className="mt-4 rounded-xl border border-[#3A2D4C] bg-[#100C16] p-3 text-xs leading-relaxed text-[#B9B0C6]">
          <strong className="text-white">Local-cache sync is disabled.</strong> Browser cache is not a trusted source for database recovery. Use an authenticated app write or a reviewed, one-time migration for validated records instead of uploading cached content.
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-[#2D233D] pt-4">
          <button type="button" onClick={handleTestConnection} disabled={testing} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#3A2D4C] bg-[#0E0B13] px-4 py-2 text-sm font-semibold text-white transition hover:border-[#9B5CFF] disabled:cursor-wait disabled:opacity-60">
            <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} aria-hidden="true" />
            {testing ? 'Testing connection…' : 'Test connection'}
          </button>
          <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 py-2 text-sm text-[#B9B0C6] transition hover:text-white">Close</button>
        </div>
      </section>
    </div>
  );
};
