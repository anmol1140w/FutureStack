import React from 'react';
import {
  ShieldCheck,
  Zap,
  Database,
  Sparkles,
  BookOpen,
  Users,
  CheckCircle2,
  BarChart3,
  ClipboardList,
  PenTool,
  Lock
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  currentUser,
  users = [],
  onSelectUser,
  onOpenGuidelines,
  guidelineCount,
  pendingQueueCount = 0
}) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="h-6 w-6 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  BrandGuard AI
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  v3.0 Enterprise
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Governance Workflows • SHA-256 Audit Trail • Brand Analytics
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'editor'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PenTool className="h-3.5 w-3.5" />
              <span>Smart Composer</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition relative ${
                activeTab === 'queue'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              <span>Approval Queue</span>
              {pendingQueueCount > 0 && (
                <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pendingQueueCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                activeTab === 'analytics'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Brand Analytics</span>
            </button>
          </nav>

          {/* User Role Switcher & Guidelines */}
          <div className="flex items-center space-x-2.5">
            {/* RBAC Role Switcher */}
            <div className="flex items-center space-x-1.5 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700/80 text-xs">
              <Users className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500 hidden lg:inline">Role:</span>
              <select
                value={currentUser?.id || ''}
                onChange={(e) => {
                  const selected = users.find(u => u.id === e.target.value);
                  if (selected) onSelectUser(selected);
                }}
                className="bg-transparent text-slate-200 font-medium text-xs focus:outline-none cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id} className="bg-slate-900 text-slate-100">
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                currentUser?.role === 'MANAGER'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : currentUser?.role === 'REVIEWER'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {currentUser?.role}
              </span>
            </div>

            <button
              onClick={onOpenGuidelines}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
              title="Manage Brand Guidelines"
            >
              <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Guidelines</span>
              {guidelineCount !== undefined && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900 text-slate-300 font-mono">
                  {guidelineCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800/80 text-xs">
          <button
            onClick={() => setActiveTab('editor')}
            className={`px-3 py-1 rounded-lg ${activeTab === 'editor' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
          >
            Composer
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1 rounded-lg ${activeTab === 'queue' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
          >
            Queue ({pendingQueueCount})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1 rounded-lg ${activeTab === 'analytics' ? 'text-emerald-400 font-semibold' : 'text-slate-400'}`}
          >
            Analytics
          </button>
        </div>
      </div>
    </header>
  );
}
