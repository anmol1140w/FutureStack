import React, { useState, useEffect } from 'react';
import { apiUrl } from '../services/api';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Key,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Eye,
  FileCheck2,
  X,
  MessageSquare,
  Lock,
  Send,
  ExternalLink,
  Check,
  Copy
} from 'lucide-react';

export default function GovernanceQueue({
  currentUser,
  onLoadIntoEditor
}) {
  const [queue, setQueue] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [auditTrail, setAuditTrail] = useState([]);
  const [verificationResult, setVerificationResult] = useState(null);
  const [managerNotes, setManagerNotes] = useState('');
  const [revisedContent, setRevisedContent] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [copiedHash, setCopiedHash] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, [filterStatus]);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/governance/queue?status=${filterStatus}`));
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue || []);
      }
    } catch (err) {
      console.error('Failed to fetch approval queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDiff = (review) => {
    setSelectedReview(review);
    setManagerNotes(review.manager_notes || '');
    setRevisedContent(review.approved_content || review.raw_content || '');
    setIsDiffModalOpen(true);
  };

  const handleOpenAudit = async (review) => {
    setSelectedReview(review);
    setVerificationResult(null);
    try {
      const res = await fetch(apiUrl(`/api/governance/audit-trail/${review.id}`));
      if (res.ok) {
        const data = await res.json();
        setAuditTrail(data.auditTrail || []);
      }
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    }
    setIsAuditModalOpen(true);
  };

  const handleVerifySignature = async (reviewId) => {
    try {
      const res = await fetch(apiUrl(`/api/governance/verify-signature/${reviewId}`));
      if (res.ok) {
        const data = await res.json();
        setVerificationResult(data);
      }
    } catch (err) {
      console.error('Verification error:', err);
    }
  };

  const handleApprove = async () => {
    if (!selectedReview) return;
    try {
      const res = await fetch(apiUrl(`/api/governance/approve/${selectedReview.id}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerId: currentUser.id,
          approvedContent: revisedContent,
          managerNotes: managerNotes || 'Approved by Brand Governance Manager.'
        })
      });

      if (res.ok) {
        setActionSuccess('Approved and cryptographically signed with SHA-256.');
        setTimeout(() => {
          setActionSuccess('');
          setIsDiffModalOpen(false);
          fetchQueue();
        }, 1200);
      }
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleRequestRevisions = async () => {
    if (!selectedReview) return;
    try {
      const res = await fetch(apiUrl(`/api/governance/request-revisions/${selectedReview.id}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerId: currentUser.id,
          managerNotes: managerNotes || 'Revisions required before approval.',
          updatedContent: revisedContent
        })
      });

      if (res.ok) {
        setActionSuccess('Revisions requested. Returned to creator.');
        setTimeout(() => {
          setActionSuccess('');
          setIsDiffModalOpen(false);
          fetchQueue();
        }, 1200);
      }
    } catch (err) {
      console.error('Request revisions failed:', err);
    }
  };

  const isManagerOrReviewer = currentUser.role === 'MANAGER' || currentUser.role === 'REVIEWER';

  return (
    <div className="space-y-6">
      {/* Queue Header & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ClipboardList className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">Brand Governance & Approval Queue</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-Based Access Control (RBAC) sign-off workflow with side-by-side diffing and SHA-256 cryptographic logging.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs">
          {['ALL', 'PENDING', 'REVISED', 'APPROVED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterStatus === st
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Queue Table / Card List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
            <div className="h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            <span>Loading approval queue...</span>
          </div>
        ) : queue.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            No drafts currently found for status: <strong>{filterStatus}</strong>.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {queue.map((item) => {
              const issues = Array.isArray(item.findings) ? item.findings : [];
              const statusColor =
                item.status === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : item.status === 'REVISED'
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30';

              return (
                <div
                  key={item.id}
                  className="p-5 hover:bg-slate-850/50 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Column: Creator & Content Preview */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2 text-xs">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold border ${statusColor}`}>
                        {item.status}
                      </span>
                      <span className="text-slate-400 font-medium">
                        By: <strong className="text-slate-200">{item.creator_name || 'Creator'}</strong>
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-500 text-[11px] font-mono">
                        {new Date(item.updated_at || item.created_at).toLocaleDateString()} at{' '}
                        {new Date(item.updated_at || item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-sm font-mono text-slate-200 line-clamp-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                      "{item.approved_content || item.raw_content}"
                    </p>

                    {item.manager_notes && (
                      <div className="text-xs text-sky-400/90 flex items-center space-x-1.5 bg-sky-950/20 px-2.5 py-1 rounded-md border border-sky-500/20">
                        <MessageSquare className="h-3 w-3 shrink-0" />
                        <span>Manager Note: {item.manager_notes}</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Violation Count, SHA-256 & Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0">
                    <div className="flex items-center space-x-2 text-xs font-mono">
                      {issues.length > 0 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{issues.length} Issues</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Compliant</span>
                        </span>
                      )}

                      {item.audit_hash && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] truncate max-w-[140px]" title={item.audit_hash}>
                          🔑 {item.audit_hash.substring(0, 10)}...
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleOpenDiff(item)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center space-x-1"
                      >
                        <Eye className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Review & Diff</span>
                      </button>

                      <button
                        onClick={() => handleOpenAudit(item)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center space-x-1"
                        title="View Immutable Cryptographic Audit Trail"
                      >
                        <Lock className="h-3.5 w-3.5 text-teal-400" />
                        <span>Audit Trail</span>
                      </button>

                      {onLoadIntoEditor && (
                        <button
                          onClick={() => onLoadIntoEditor(item.approved_content || item.raw_content)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 transition"
                          title="Load this draft into Smart Composer"
                        >
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review & Diffing Modal */}
      {isDiffModalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Review & Sign-Off Diffing Studio</h3>
                  <p className="text-xs text-slate-400">
                    Draft ID: <code className="font-mono text-emerald-400">{selectedReview.id}</code> • Status: <strong>{selectedReview.status}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDiffModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Side-by-Side Diff */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {actionSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                  <Check className="h-4 w-4" />
                  <span>{actionSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original Raw Content */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-rose-400 flex items-center space-x-1">
                      <span>Original Draft (Submitted)</span>
                    </span>
                    <span className="text-[10px] font-mono">Creator Submission</span>
                  </div>
                  <div className="bg-slate-950/80 p-3.5 rounded-xl border border-rose-500/30 text-xs font-mono text-slate-200 min-h-[160px] leading-relaxed whitespace-pre-wrap">
                    {selectedReview.raw_content}
                  </div>
                </div>

                {/* Approved / Revised Content Editor */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-emerald-400 flex items-center space-x-1">
                      <span>Approved Target Content</span>
                    </span>
                    <span className="text-[10px] font-mono">Editable by Manager</span>
                  </div>
                  <textarea
                    rows={6}
                    value={revisedContent}
                    onChange={(e) => setRevisedContent(e.target.value)}
                    disabled={!isManagerOrReviewer}
                    placeholder="Approved final copy text..."
                    className="w-full bg-slate-950/80 p-3.5 rounded-xl border border-emerald-500/40 text-xs font-mono text-emerald-200 min-h-[160px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none disabled:opacity-75"
                  />
                </div>
              </div>

              {/* Feedback / Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Governance Review Notes & Justification
                </label>
                <input
                  type="text"
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  disabled={!isManagerOrReviewer}
                  placeholder="e.g. Verified 20% discount cap and removed comparative superlatives as per brand guidelines."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-75"
                />
              </div>

              {/* Cryptographic SHA-256 Preview */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono text-slate-400">
                <div className="flex items-center space-x-2 truncate mr-2">
                  <Key className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="text-slate-500">Active Audit Hash:</span>
                  <span className="text-slate-300 truncate">{selectedReview.audit_hash}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                  SHA-256
                </span>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
              <span className="text-xs text-slate-500">
                Acting as: <strong className="text-slate-300">{currentUser.name}</strong> ({currentUser.role})
              </span>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsDiffModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Close
                </button>

                {isManagerOrReviewer && (
                  <>
                    <button
                      onClick={handleRequestRevisions}
                      className="px-4 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-semibold transition"
                    >
                      Request Revisions
                    </button>

                    <button
                      onClick={handleApprove}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Approve & Sign (SHA-256)</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cryptographic Audit Trail Inspector Modal */}
      {isAuditModalOpen && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-slate-100 text-sm">Cryptographic Audit Trail Inspector</h3>
                  <p className="text-xs text-slate-400">Immutable SHA-256 signature chain for legal audit readiness</p>
                </div>
              </div>
              <button
                onClick={() => setIsAuditModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Programmatic Verification Box */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-slate-200 block">Cryptographic Integrity Verification</span>
                  <p className="text-[11px] text-slate-400">Recomputes SHA-256 against stored database records to verify zero tampering.</p>
                </div>
                <button
                  onClick={() => handleVerifySignature(selectedReview.id)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20 shrink-0"
                >
                  Verify SHA-256
                </button>
              </div>

              {verificationResult && (
                <div className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  verificationResult.isValid
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center space-x-2 font-bold text-sm">
                    {verificationResult.isValid ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        <span>VERIFIED AUTHENTIC — TAMPER-PROOF</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="h-4 w-4 text-rose-400" />
                        <span>TAMPER WARNING DETECTED</span>
                      </>
                    )}
                  </div>
                  <p className="font-mono text-[11px]">
                    Signature Hash: {verificationResult.storedHash}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Verified Timestamp: {new Date(verificationResult.verifiedTimestamp).toISOString()}
                  </p>
                </div>
              )}

              {/* Timeline of Audit Entries */}
              <div className="space-y-3 mt-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Action History ({auditTrail.length} entries)
                </span>

                {auditTrail.map((entry, idx) => (
                  <div
                    key={entry.id || idx}
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 font-mono">
                          {entry.action}
                        </span>
                        <span className="text-slate-300 font-medium">{entry.actor_name || 'System'}</span>
                        <span className="text-[10px] text-slate-500">({entry.actor_role})</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <div className="bg-slate-900/90 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="text-slate-500">SHA-256 Hash:</span>
                        <span className="text-slate-300 select-all">{entry.audit_hash}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
