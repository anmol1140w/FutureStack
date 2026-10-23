import React from 'react';
import { Play, Sparkles, RotateCcw, FileText, CheckCircle2 } from 'lucide-react';

const SAMPLES = [
  {
    label: "Standard Test Copy (Violations)",
    text: "Get 50% off everything today! FreshBite is India's best food app. Contact ceo@freshbite.com or 9876543210 for 100% guaranteed delivery."
  },
  {
    label: "Tone & Terminology Breach",
    text: "You will regret missing out! Our drivers provide the cheapest meals in town, backed by our 100% guaranteed delivery service."
  },
  {
    label: "Compliant Approved Copy",
    text: "Enjoy up to 20% off your first order! FreshBite connects you with trusted local culinary kitchens. Our Delivery Heroes are ready to serve you today."
  }
];

export default function DraftEditor({
  content,
  setContent,
  onAnalyze,
  isAnalyzing,
  onReset
}) {
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col h-full">
      {/* Top Header & Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-emerald-400" />
          <h2 className="font-semibold text-slate-100 text-base">Marketing Draft Editor</h2>
        </div>

        {/* Quick Samples */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          <span className="text-slate-400 mr-1 hidden lg:inline">Presets:</span>
          {SAMPLES.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => setContent(sample.text)}
              className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-750 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition text-xs"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Area */}
      <div className="mt-4 flex-1 flex flex-col min-h-[260px]">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste or write your promotional copy, newsletter, social post, or email draft here..."
          className="w-full flex-1 bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 text-sm leading-relaxed resize-none font-mono"
        />
      </div>

      {/* Editor Footer: Counters & Actions */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-4 text-xs text-slate-400 font-mono">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
        </div>

        <div className="flex items-center space-x-2">
          {content && (
            <button
              onClick={onReset}
              disabled={isAnalyzing}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
              title="Clear editor"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || !content.trim()}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-slate-950" />
                <span>Analyze Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
