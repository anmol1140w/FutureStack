import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Zap,
  Clock,
  Key,
  Copy,
  Check,
  ArrowRight,
  ShieldAlert,
  FileCheck2,
  Sparkles
} from 'lucide-react';

const CATEGORY_STYLES = {
  PRIVACY: {
    bg: 'bg-rose-500/10',
    border: 'border-rose-500/30',
    text: 'text-rose-400',
    badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
  },
  LEGAL: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  },
  CLAIM: {
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
  },
  TONE: {
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
  },
  TERMINOLOGY: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
  }
};

export default function InspectionResults({ result, onApplyFix }) {
  const [copiedHash, setCopiedHash] = useState(false);
  const [appliedFixes, setAppliedFixes] = useState({});

  if (!result) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[350px]">
        <div className="h-14 w-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-4 text-slate-500">
          <FileCheck2 className="h-7 w-7" />
        </div>
        <h3 className="font-semibold text-slate-300 text-base">Ready for Compliance Inspection</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Draft or choose a sample prompt on the left and click "Analyze Copy" to run Tier 1 deterministic and Grok RAG checks.
        </p>
      </div>
    );
  }

  const {
    status,
    performance,
    stats,
    findings = [],
    auditHash,
    retrievedGuidelines = []
  } = result;

  const handleCopyHash = () => {
    if (auditHash) {
      navigator.clipboard.writeText(auditHash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    }
  };

  const handleFix = (idx, flaggedText, suggestedCorrection) => {
    onApplyFix(flaggedText, suggestedCorrection);
    setAppliedFixes(prev => ({ ...prev, [idx]: true }));
  };

  return (
    <div className="space-y-5">
      {/* Metrics & Performance Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide flex items-center space-x-1.5 ${
                status === 'APPROVED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {status === 'APPROVED' ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>COMPLIANT / APPROVED</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>PENDING REVISIONS ({stats?.totalIssues || findings.length})</span>
                </>
              )}
            </span>

            {/* Tier 1 Latency Badge */}
            <span className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <Zap className="h-3 w-3" />
              <span>Tier 1: {performance?.tier1LatencyMs ?? 0}ms</span>
              <span className="text-[10px] bg-emerald-500/20 px-1 rounded">&lt;10ms ✅</span>
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            <span>Total pipeline: {performance?.totalPipelineMs ?? 0}ms</span>
          </div>
        </div>

        {/* SHA-256 Audit Trail */}
        {auditHash && (
          <div className="mt-3 flex items-center justify-between bg-slate-950/80 px-3 py-2 rounded-lg border border-slate-800/80 text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-2 overflow-hidden mr-2">
              <Key className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="text-slate-500 shrink-0">SHA-256 Audit:</span>
              <span className="text-slate-300 truncate">{auditHash}</span>
            </div>
            <button
              onClick={handleCopyHash}
              className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition shrink-0"
              title="Copy audit hash"
            >
              {copiedHash ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  <span className="text-[10px] text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span className="text-[10px]">Copy</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Findings List */}
      {findings.length === 0 ? (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-8 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-3 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h4 className="text-base font-semibold text-emerald-300">Brand Compliant!</h4>
          <p className="text-xs text-emerald-400/80 mt-1 max-w-md mx-auto">
            Zero policy breaches detected across Tier 1 deterministic checks and Grok semantic brand guidelines.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Detected Issues ({findings.length})
            </span>
            <span>Click "Apply Fix" to update draft</span>
          </div>

          {findings.map((f, idx) => {
            const catStyle = CATEGORY_STYLES[f.category] || CATEGORY_STYLES.LEGAL;
            const isFixed = appliedFixes[idx];

            return (
              <div
                key={idx}
                className={`rounded-xl border p-4 transition ${catStyle.bg} ${catStyle.border} shadow-sm`}
              >
                {/* Issue Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catStyle.badge}`}>
                      {f.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-300 font-semibold">
                      {f.issueType}
                    </span>
                    {f.tier === 1 && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Tier 1 Deterministic
                      </span>
                    )}
                    {f.severity && (
                      <span className="text-[10px] text-slate-400">
                        Severity: <strong className="text-slate-200">{f.severity}</strong>
                      </span>
                    )}
                  </div>

                  {/* 1-Click Fix Button */}
                  {f.suggestedCorrection && (
                    <button
                      onClick={() => handleFix(idx, f.flaggedText, f.suggestedCorrection)}
                      disabled={isFixed}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition shrink-0 ${
                        isFixed
                          ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                      }`}
                    >
                      {isFixed ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span>Applied</span>
                        </>
                      ) : (
                        <>
                          <span>Apply Fix</span>
                          <ArrowRight className="h-3 w-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Flagged Substring & Replacement Preview */}
                <div className="mt-3 bg-slate-950/80 rounded-lg p-3 border border-slate-800/80 text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-500 text-[11px] shrink-0">Flagged:</span>
                    <span className="text-rose-400 font-mono font-medium line-through decoration-rose-500/60 bg-rose-500/10 px-1.5 py-0.5 rounded">
                      "{f.flaggedText}"
                    </span>
                  </div>

                  {f.suggestedCorrection && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="text-slate-500 text-[11px] shrink-0">Compliant Fix:</span>
                      <span className="text-emerald-400 font-mono font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        "{f.suggestedCorrection}"
                      </span>
                    </div>
                  )}
                </div>

                {/* Explanation */}
                <div className="mt-2.5 text-xs text-slate-300 leading-relaxed">
                  <p>{f.explanation}</p>
                </div>

                {/* Citation & Evidence Grounding */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center space-x-1.5">
                    <FileCheck2 className="h-3.5 w-3.5 text-slate-500" />
                    <span>Citation:</span>
                    <code className="text-slate-300 font-mono bg-slate-800 px-1.5 py-0.5 rounded">
                      {f.citationId}
                    </code>
                  </div>
                  {f.citationVerified && (
                    <span className="text-emerald-400 font-medium flex items-center space-x-1">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Verified in DB</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Retrieved Guidelines Context Section (pgvector) */}
      {retrievedGuidelines.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              <span>pgvector Retrieved Context ({retrievedGuidelines.length})</span>
            </span>
            <span className="text-slate-500 font-mono">Cosine Similarity</span>
          </div>

          <div className="mt-3 space-y-2">
            {retrievedGuidelines.map((rg, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-200">{rg.title}</span>
                  <span className="font-mono text-emerald-400 text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    Match: {Math.round(rg.similarityScore * 100)}%
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">
                  {rg.contentSnippet}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
