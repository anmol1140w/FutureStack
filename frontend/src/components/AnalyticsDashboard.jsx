import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Download,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  ArrowUpRight,
  Layers,
  FileText
} from 'lucide-react';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/analytics/dashboard');
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!analytics) return;
    const blob = new Blob([JSON.stringify(analytics, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `brandguard-compliance-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400 flex items-center justify-center space-x-2">
        <div className="h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <span>Calculating brand analytics & compliance scores...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Failed to load analytics dashboard. Please try again.
      </div>
    );
  }

  const { summary, categoryBreakdown = [], topBreaches = [], frictionGuidelines = [] } = analytics;

  return (
    <div className="space-y-6">
      {/* Header & Export Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-slate-100">Brand Governance Analytics Dashboard</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Aggregated insights into recurring compliance mistakes, high-frequency rule breaches, and guidelines requiring clarification.
          </p>
        </div>

        <button
          onClick={handleExportJSON}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition self-start sm:self-auto shadow-sm"
        >
          <Download className="h-3.5 w-3.5 text-emerald-400" />
          <span>Export Compliance Audit Report</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Overall Compliance Score</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {summary.complianceScore}
          </div>
          <p className="text-[11px] text-emerald-400 flex items-center space-x-1">
            <span>Enterprise Benchmark: Healthy</span>
          </p>
        </div>

        {/* Approval Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Approval Rate</span>
            <CheckCircle2 className="h-4 w-4 text-teal-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {summary.approvalRate}
          </div>
          <p className="text-[11px] text-slate-400">
            {summary.approvedCount} approved out of {summary.totalReviews} drafts
          </p>
        </div>

        {/* Total Issues Identified */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Violations Prevented</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {summary.totalIssuesIdentified}
          </div>
          <p className="text-[11px] text-slate-400">
            Across {summary.totalReviews} drafts drafted
          </p>
        </div>

        {/* Tamper-Proof Cryptographic Signatures */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>SHA-256 Audit Logs</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-100 font-mono">
            {summary.totalAuditLogs}
          </div>
          <p className="text-[11px] text-emerald-400">
            {summary.totalSignedApprovals} signed approvals on ledger
          </p>
        </div>
      </div>

      {/* Two-Column Middle Section: Category Breakdown & Top Breaches */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-slate-200 text-sm flex items-center space-x-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>High-Frequency Breaches by Category</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Distribution %</span>
          </div>

          <div className="space-y-3">
            {categoryBreakdown.map((item) => {
              let barColor = 'bg-emerald-500';
              if (item.category === 'PRIVACY') barColor = 'bg-rose-500';
              else if (item.category === 'CLAIM') barColor = 'bg-orange-500';
              else if (item.category === 'LEGAL') barColor = 'bg-amber-500';
              else if (item.category === 'TONE') barColor = 'bg-sky-500';
              else if (item.category === 'TERMINOLOGY') barColor = 'bg-purple-500';

              return (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-300">{item.category}</span>
                    <span className="font-mono text-slate-400">
                      {item.count} breaches ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${barColor} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(item.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Breached Specific Rules */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-slate-200 text-sm flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <span>Most Common Violation Types</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Occurrences</span>
          </div>

          <div className="space-y-2.5">
            {topBreaches.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">No violations recorded.</div>
            ) : (
              topBreaches.map((tb, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="h-5 w-5 rounded-md bg-slate-800 text-slate-400 font-mono text-[10px] flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="font-mono text-slate-200 font-medium">{tb.issueType}</span>
                  </div>
                  <span className="font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold">
                    {tb.count}x
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Guidelines Requiring Clarification (Friction Analysis) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-slate-200 text-sm flex items-center space-x-2">
              <HelpCircle className="h-4 w-4 text-sky-400" />
              <span>Brand Guidelines Requiring Clarification</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rules with high repeat violations indicate ambiguous policies that writers frequently fail to interpret correctly.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 hidden sm:inline">AI Guidance Engine</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {frictionGuidelines.length === 0 ? (
            <div className="col-span-2 text-center py-6 text-xs text-slate-500">
              Zero guideline friction detected. All guidelines are clearly understood.
            </div>
          ) : (
            frictionGuidelines.map((fg, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-xs">{fg.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    {fg.breachCount} Breaches
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-sky-950/20 border border-sky-500/20 text-[11px] text-sky-300 flex items-start space-x-2">
                  <Sparkles className="h-3.5 w-3.5 text-sky-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{fg.recommendation}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
