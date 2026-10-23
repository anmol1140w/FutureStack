import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import socketService from '../services/socketService';

const SAMPLES = [
  {
    label: "Campaign Copy (Violations)",
    text: "Get 50% off everything today! FreshBite is India's best food app. Contact ceo@freshbite.com or 9876543210 for 100% guaranteed delivery."
  },
  {
    label: "Tone & Terminology Breach",
    text: "You will regret missing out! Our drivers are the cheapest in the world and delivery is 100% guaranteed."
  },
  {
    label: "Predictive Autocomplete Trigger",
    text: "Enjoy our chef-crafted favorites and get "
  }
];

export default function SmartEditor({
  content,
  setContent,
  findings = [],
  onSelectFinding,
  onApplyFix,
  isLiveConnected,
  lastTier1Latency,
  intent,
  onSubmitToQueue,
  isSubmittingQueue
}) {
  const [ghostSuggestion, setGhostSuggestion] = useState('');
  const [showGhost, setShowGhost] = useState(false);
  const [showLiveHighlight, setShowLiveHighlight] = useState(true);
  const textareaRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Debounced real-time streaming via WebSocket
  const handleTextChange = (e) => {
    const newText = e.target.value;
    const cursor = e.target.selectionStart;
    setContent(newText);

    // Dismiss existing ghost text while typing
    setShowGhost(false);
    setGhostSuggestion('');

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      socketService.emitDraftType(newText, cursor);
    }, 300);
  };

  // Keyboard handler for Tab or Right Arrow to accept ghost text
  const handleKeyDown = (e) => {
    if ((e.key === 'Tab' || (e.key === 'ArrowRight' && textareaRef.current?.selectionStart === content.length)) && ghostSuggestion) {
      e.preventDefault();
      // Accept predictive autocompletion
      const updated = content + ghostSuggestion;
      setContent(updated);
      setGhostSuggestion('');
      setShowGhost(false);

      // Trigger immediate check on newly accepted text
      socketService.emitDraftType(updated, updated.length);
    } else if (e.key === 'Escape') {
      setShowGhost(false);
      setGhostSuggestion('');
    }
  };

  // Listen for predictive completion suggestions pushed from server
  useEffect(() => {
    socketService.onCompletionSuggest((data) => {
      if (data?.suggestion && data.suggestion.trim() !== '') {
        setGhostSuggestion(data.suggestion);
        setShowGhost(true);
      } else {
        setGhostSuggestion('');
        setShowGhost(false);
      }
    });
  }, []);

  // Compute highlighted tokens for non-compliant substrings
  const renderHighlightedMarkup = () => {
    if (!content) return null;
    if (!findings || findings.length === 0) {
      return <span>{content}</span>;
    }

    // Sort findings by start index or match order
    const matchedRanges = [];
    findings.forEach((f) => {
      if (f.flaggedText && content.includes(f.flaggedText)) {
        let startIndex = 0;
        let pos;
        while ((pos = content.indexOf(f.flaggedText, startIndex)) !== -1) {
          matchedRanges.push({
            start: pos,
            end: pos + f.flaggedText.length,
            finding: f
          });
          startIndex = pos + f.flaggedText.length;
        }
      }
    });

    // Remove overlapping ranges
    matchedRanges.sort((a, b) => a.start - b.start);
    const nonOverlapping = [];
    let lastEnd = -1;
    for (const range of matchedRanges) {
      if (range.start >= lastEnd) {
        nonOverlapping.push(range);
        lastEnd = range.end;
      }
    }

    const elements = [];
    let currentIndex = 0;

    nonOverlapping.forEach((range, idx) => {
      // Unflagged text segment
      if (range.start > currentIndex) {
        elements.push(
          <span key={`text-${idx}`}>{content.substring(currentIndex, range.start)}</span>
        );
      }

      // Highlighted violation segment
      const f = range.finding;
      let badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30';
      if (f.category === 'TONE') badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/40 hover:bg-sky-500/30';
      else if (f.category === 'CLAIM') badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/40 hover:bg-orange-500/30';
      else if (f.category === 'TERMINOLOGY') badgeColor = 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30';
      else if (f.category === 'LEGAL') badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30';

      elements.push(
        <mark
          key={`highlight-${idx}`}
          onClick={() => onSelectFinding(f)}
          className={`cursor-pointer px-1 py-0.5 rounded border ${badgeColor} font-semibold transition-all inline-block my-0.5`}
          title={`Click to inspect ${f.category} violation in Citation Drawer`}
        >
          {content.substring(range.start, range.end)}
          <span className="ml-1 text-[9px] font-mono uppercase bg-slate-950/70 px-1 py-0.2 rounded border border-white/10">
            {f.category}
          </span>
        </mark>
      );

      currentIndex = range.end;
    });

    if (currentIndex < content.length) {
      elements.push(
        <span key="text-end">{content.substring(currentIndex)}</span>
      );
    }

    return elements;
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col h-full">
      {/* Editor Header: Presets, Live Status & Highlights Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" />
          <h2 className="font-semibold text-slate-100 text-sm">Real-Time Email Composer</h2>
          {isLiveConnected && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center space-x-1">
              <Zap className="h-3 w-3" />
              <span>WebSocket Live</span>
            </span>
          )}
        </div>

        {/* Sample Templates */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          <span className="text-slate-500 text-[11px] mr-1 hidden md:inline">Presets:</span>
          {SAMPLES.map((s, idx) => (
            <button
              key={idx}
              onClick={() => {
                setContent(s.text);
                setGhostSuggestion('');
                setShowGhost(false);
                socketService.emitDraftType(s.text, s.text.length);
              }}
              className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition text-xs"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Main Canvas with Ghost-Text & Live Highlights */}
      <div className="mt-4 flex-1 flex flex-col relative min-h-[300px]">
        {/* Toggle between interactive input and live color-coded preview */}
        <div className="flex items-center justify-between mb-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <button
              onClick={() => setShowLiveHighlight(!showLiveHighlight)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md border text-xs transition ${
                showLiveHighlight
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Inline Violation Highlighting: {showLiveHighlight ? 'ON' : 'OFF'}</span>
            </button>

            {intent && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                Intent: {intent}
              </span>
            )}
          </div>

          {lastTier1Latency !== undefined && (
            <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
              <Zap className="h-3 w-3" />
              <span>Tier 1: {lastTier1Latency}ms</span>
            </span>
          )}
        </div>

        {/* Textarea with Tab completion */}
        <div className="relative flex-1 rounded-xl border border-slate-800 bg-slate-950/80 focus-within:border-emerald-500/70 focus-within:ring-2 focus-within:ring-emerald-500/20 transition overflow-hidden flex flex-col">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder="Start drafting marketing copy... As you type, Tier 1 checks (<10ms) and predictive ghost-text completions will appear live!"
            className="w-full flex-1 bg-transparent p-4 text-slate-100 placeholder-slate-500 focus:outline-none text-sm leading-relaxed font-mono resize-none"
          />

          {/* Inline Ghost Text Banner / Continuation Preview */}
          {showGhost && ghostSuggestion && (
            <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800/80 flex items-center justify-between text-xs animate-in fade-in duration-150">
              <div className="flex items-center space-x-2 text-slate-400 font-mono truncate mr-2">
                <Sparkles className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                <span className="text-slate-500 shrink-0">Predictive Completion:</span>
                <span className="text-emerald-400 font-medium italic truncate">
                  "{ghostSuggestion}"
                </span>
              </div>
              <button
                onClick={() => {
                  const updated = content + ghostSuggestion;
                  setContent(updated);
                  setGhostSuggestion('');
                  setShowGhost(false);
                  socketService.emitDraftType(updated, updated.length);
                }}
                className="px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition shrink-0 flex items-center space-x-1"
              >
                <span>Press</span>
                <kbd className="px-1 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-white">Tab ⇥</kbd>
                <span>to accept</span>
              </button>
            </div>
          )}
        </div>

        {/* Live Color-Coded Inline Text Highlights (Rendered below / overlay) */}
        {showLiveHighlight && findings.length > 0 && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/90 text-xs font-mono leading-relaxed space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 border-b border-slate-800">
              <span className="font-semibold text-slate-300">Live Detected Violations ({findings.length}):</span>
              <span className="text-slate-500">Click highlighted word to view citation & fix</span>
            </div>
            <div className="text-slate-200">
              {renderHighlightedMarkup()}
            </div>
          </div>
        )}
      </div>

      {/* Editor Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center space-x-3">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
          <span>•</span>
          <span className="text-emerald-400 font-medium">3-Step Agentic Engine</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setContent('');
              setGhostSuggestion('');
              setShowGhost(false);
              socketService.emitDraftType('', 0);
            }}
            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition"
            title="Clear content"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {onSubmitToQueue && (
            <button
              onClick={onSubmitToQueue}
              disabled={isSubmittingQueue || !content.trim()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isSubmittingQueue ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <span>Submit to Queue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
