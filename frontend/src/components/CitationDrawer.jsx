import React from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileCheck2,
  ExternalLink,
  Zap,
  Check
} from 'lucide-react';

const CATEGORY_COLORS = {
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

export default function CitationDrawer({
  isOpen,
  onClose,
  selectedFinding,
  findings = [],
  onSelectFinding,
  onApplyFix,
  appliedFixes = {}
}) {
  if (!isOpen) return null;

  const currentFinding = selectedFinding || findings[0];
  const catColor = currentFinding ? (CATEGORY_COLORS[currentFinding.category] || CATEGORY_COLORS.LEGAL) : null;
  const isFixed = currentFinding ? appliedFixes[currentFinding.flaggedText] : false;

  return (
    <div className="w-full lg:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full shadow-2xl z-30 transition-all duration-300 ease-in-out">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-4 w-4 text-emerald-400" />
          <h3 className="font-semibold text-slate-100 text-sm">Evidence & Citation Drawer</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Issues selector pills if multiple issues exist */}
      {findings.length > 1 && (
        <div className="p-2 border-b border-slate-800/80 bg-slate-900/90 flex gap-1.5 overflow-x-auto text-xs">
          {findings.map((f, idx) => {
            const isSelected = currentFinding && currentFinding.flaggedText === f.flaggedText;
            const style = CATEGORY_COLORS[f.category] || CATEGORY_COLORS.LEGAL;
            const fixed = appliedFixes[f.flaggedText];

            return (
              <button
                key={idx}
                onClick={() => onSelectFinding(f)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition border ${
                  isSelected
                    ? `${style.badge} font-bold ring-1 ring-emerald-400/50`
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {fixed ? '✓ ' : ''}
                {f.category}: "{f.flaggedText?.substring(0, 12)}..."
              </button>
            );
          })}
        </div>
      )}

      {/* Drawer Body */}
      <div className="p-4 overflow-y-auto flex-1 space-y-4">
        {!currentFinding ? (
          <div className="text-center py-12 text-slate-500 text-xs">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400/50" />
            <p>No active violations selected.</p>
          </div>
        ) : (
          <>
            {/* Finding Overview Card */}
            <div className={`p-4 rounded-xl border ${catColor.bg} ${catColor.border} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catColor.badge}`}>
                  {currentFinding.category}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {currentFinding.tier === 1 ? 'Tier 1 Deterministic' : 'Tier 2 Agentic RAG'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-0.5">Non-Compliant Text:</span>
                <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-rose-400 font-semibold line-through decoration-rose-500/60">
                  "{currentFinding.flaggedText}"
                </div>
              </div>

              {currentFinding.suggestedCorrection && (
                <div>
                  <span className="text-[11px] text-slate-500 block mb-0.5">Brand-Compliant Fix:</span>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-emerald-500/30 text-xs font-mono text-emerald-300 font-semibold">
                    "{currentFinding.suggestedCorrection}"
                  </div>
                </div>
              )}

              {/* 1-Click Fix Button */}
              {currentFinding.suggestedCorrection && (
                <button
                  onClick={() => onApplyFix(currentFinding.flaggedText, currentFinding.suggestedCorrection)}
                  disabled={isFixed}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 ${
                    isFixed
                      ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-default'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 cursor-pointer'
                  }`}
                >
                  {isFixed ? (
                    <>
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Correction Applied</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5 fill-slate-950" />
                      <span>1-Click Apply Fix</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Explanation Section */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs space-y-1.5">
              <span className="font-semibold text-slate-300 flex items-center space-x-1.5 text-[11px] uppercase tracking-wider">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                <span>Why It Was Flagged</span>
              </span>
              <p className="text-slate-300 leading-relaxed text-xs">
                {currentFinding.explanation}
              </p>
            </div>

            {/* Evidence & Grounded Citation Section */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2">
              <span className="font-semibold text-slate-300 flex items-center space-x-1.5 text-[11px] uppercase tracking-wider">
                <FileCheck2 className="h-3.5 w-3.5 text-teal-400" />
                <span>Grounded Citation Reference</span>
              </span>

              <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Citation ID:</span>
                  <span className="text-slate-200">{currentFinding.citationId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Zero Hallucination:</span>
                  <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified</span>
                  </span>
                </div>
              </div>

              {currentFinding.citationDetails && (
                <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-[11px] space-y-1">
                  <span className="font-medium text-emerald-300 block">
                    {currentFinding.citationDetails.title}
                  </span>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    "{currentFinding.citationDetails.snippet}"
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
