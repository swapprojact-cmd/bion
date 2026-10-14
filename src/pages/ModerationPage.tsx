import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, Ban, Trash2, Bell, FileText, ArrowLeft, RefreshCw } from 'lucide-react';
import { useCommunity } from '../context/CommunityContext';
import { useAuth } from '../context/AuthContext';
import { Report, ModerationActionType } from '../types';
import { Avatar } from '../components/common/Avatar';

interface ModerationPageProps {
  navigate: (route: string) => void;
}

export const ModerationPage: React.FC<ModerationPageProps> = ({ navigate }) => {
  const { isModerator, currentUser } = useAuth();
  const { reports, moderationActions, takeModerationAction, updateReportStatus, refreshAll } = useCommunity();

  const [filterStatus, setFilterStatus] = useState<Report['status'] | 'all'>('pending');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isModerator) {
    return (
      <div className="py-16 text-center space-y-3">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-[#B9B0C6]">This section is reserved for authorized community moderators.</p>
        <button
          onClick={() => navigate('/feed')}
          className="px-4 py-2 bg-[#9B5CFF] text-white text-xs font-semibold rounded-xl"
        >
          Return to Feed
        </button>
      </div>
    );
  }

  const filteredReports = reports.filter(r => filterStatus === 'all' || r.status === filterStatus);

  const handleAction = async (actionType: ModerationActionType) => {
    if (!selectedReport) return;
    setIsProcessing(true);
    try {
      await takeModerationAction(
        selectedReport.target_type,
        selectedReport.target_id,
        actionType,
        actionReason.trim() || `Moderation action taken for reported ${selectedReport.reason}`,
        selectedReport.id
      );
      setSelectedReport(null);
      setActionReason('');
      await refreshAll();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = async () => {
    if (!selectedReport) return;
    setIsProcessing(true);
    try {
      await updateReportStatus(selectedReport.id, 'dismissed');
      setSelectedReport(null);
      await refreshAll();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-[#9B5CFF] mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Community Trust & Safety
          </div>
          <h1 className="text-2xl font-bold font-display text-white">Moderation Queue</h1>
          <p className="text-xs text-[#B9B0C6] mt-1">
            Review reported content, protect the community from dating solicitation and abuse, and enforce standards.
          </p>
        </div>

        <button
          onClick={() => refreshAll()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#191321] border border-[#2D233D] text-xs text-[#B9B0C6] hover:text-white transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#2D233D] pb-3">
        {(['pending', 'investigating', 'resolved', 'all'] as const).map(st => (
          <button
            key={st}
            onClick={() => {
              setFilterStatus(st);
              setSelectedReport(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
              filterStatus === st
                ? 'bg-[#9B5CFF] text-white shadow-sm'
                : 'bg-[#191321] text-[#B9B0C6] hover:text-white'
            }`}
          >
            {st} ({st === 'all' ? reports.length : reports.filter(r => r.status === st).length})
          </button>
        ))}
      </div>

      {/* Main Grid: Reports List + Review Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports Column */}
        <div className="lg:col-span-2 space-y-3">
          {filteredReports.length === 0 ? (
            <div className="p-12 rounded-2xl bg-[#191321] border border-[#2D233D] text-center space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-base font-bold text-white">Queue is clear</h3>
              <p className="text-xs text-[#B9B0C6]">No reports currently matching "{filterStatus}".</p>
            </div>
          ) : (
            filteredReports.map(report => {
              const isSelected = selectedReport?.id === report.id;
              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#9B5CFF]/15 border-[#9B5CFF] shadow-md'
                      : 'bg-[#191321] border-[#2D233D] hover:border-[#3D2E55]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                          {report.reason.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-[#B9B0C6]">
                          Target: <strong className="text-white capitalize">{report.target_type}</strong>
                        </span>
                      </div>
                      <div className="text-xs text-[#F8F5FC] mt-2 font-medium">
                        {report.target_summary || `Target ID: ${report.target_id}`}
                      </div>
                      {report.details && (
                        <p className="text-xs text-[#B9B0C6] mt-1 italic line-clamp-2">
                          "{report.details}"
                        </p>
                      )}
                    </div>

                    <div className="text-right text-[11px] text-[#B9B0C6] shrink-0">
                      <div>{new Date(report.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      <span className="capitalize text-[10px] text-[#9B5CFF] font-semibold">{report.status}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Action Panel Column */}
        <div className="bg-[#191321] border border-[#2D233D] rounded-2xl p-5 space-y-4 h-fit">
          <h3 className="text-sm font-bold text-white border-b border-[#2D233D] pb-2">
            Moderator Decision Panel
          </h3>

          {selectedReport ? (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#0E0B13] border border-[#2D233D] text-xs space-y-1.5">
                <div className="font-semibold text-white">Report Reference #{selectedReport.id.slice(-6)}</div>
                <div className="text-[#B9B0C6]">Reporter: @{selectedReport.reporter?.username || 'member'}</div>
                <div className="text-rose-400 font-medium">Reason: {selectedReport.reason.replace(/_/g, ' ')}</div>
                {selectedReport.details && (
                  <p className="text-[#F8F5FC] pt-1 border-t border-[#2D233D]/60 italic">
                    "{selectedReport.details}"
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#B9B0C6] mb-1">
                  Enforcement Reason (Logged to Audit Record)
                </label>
                <textarea
                  rows={2}
                  placeholder="Policy explanation for this action..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0E0B13] border border-[#2D233D] rounded-xl text-xs text-[#F8F5FC] focus:outline-none focus:border-[#9B5CFF] resize-none"
                />
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => handleAction('remove_content')}
                  disabled={isProcessing}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Flagged Content
                </button>

                <button
                  onClick={() => handleAction('warn')}
                  disabled={isProcessing}
                  className="w-full py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-600/40 text-amber-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Issue Policy Warning
                </button>

                <button
                  onClick={() => handleAction('suspend_user')}
                  disabled={isProcessing}
                  className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/40 text-purple-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Ban className="w-3.5 h-3.5" /> Suspend Violating User
                </button>

                <button
                  onClick={handleDismiss}
                  disabled={isProcessing}
                  className="w-full py-2 bg-[#0E0B13] hover:bg-[#2D233D] text-[#B9B0C6] hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Dismiss Report (No Violation)
                </button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-[#B9B0C6]">
              Select a report from the list to review details and issue a moderation decision.
            </div>
          )}
        </div>
      </div>

      {/* Moderation Audit Log */}
      <div className="bg-[#191321] border border-[#2D233D] rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#9B5CFF]" /> Verified Moderation Audit Trail
        </h3>
        {moderationActions.length === 0 ? (
          <p className="text-xs text-[#B9B0C6]">No recent moderation actions recorded.</p>
        ) : (
          <div className="space-y-2">
            {moderationActions.map(action => (
              <div
                key={action.id}
                className="p-3 rounded-xl bg-[#0E0B13] border border-[#2D233D] flex items-center justify-between text-xs gap-3"
              >
                <div>
                  <div className="font-semibold text-white">
                    Action: <span className="text-[#F05AA6]">{action.action_type}</span> on {action.target_type}
                  </div>
                  <p className="text-[11px] text-[#B9B0C6] mt-0.5">{action.reason}</p>
                </div>
                <div className="text-right text-[10px] text-[#B9B0C6] shrink-0">
                  <div>Mod: @{action.moderator?.username || 'mod'}</div>
                  <div>{new Date(action.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
