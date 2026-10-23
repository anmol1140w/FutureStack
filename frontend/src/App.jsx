import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SmartEditor from './components/SmartEditor';
import CitationDrawer from './components/CitationDrawer';
import InspectionResults from './components/InspectionResults';
import GovernanceQueue from './components/GovernanceQueue';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import GuidelineModal from './components/GuidelineModal';
import socketService from './services/socketService';
import {
  Sparkles,
  Zap,
  Layers,
  BookOpen,
  ShieldCheck,
  AlertCircle,
  Activity,
  FileCheck2,
  CheckCircle2,
  ClipboardList,
  BarChart3,
  PenTool
} from 'lucide-react';

const INITIAL_CAMPAIGN_COPY = "Get 50% off everything today! FreshBite is India's best food app. Contact ceo@freshbite.com or 9876543210 for 100% guaranteed delivery.";

export default function App() {
  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'queue' | 'analytics'
  const [content, setContent] = useState(INITIAL_CAMPAIGN_COPY);
  const [guidelines, setGuidelines] = useState([]);
  const [isGuidelineModalOpen, setIsGuidelineModalOpen] = useState(false);
  
  // Enterprise RBAC Users (Version 3)
  const [users, setUsers] = useState([
    { id: '11111111-1111-1111-1111-111111111111', name: 'Alice Green', role: 'CREATOR', email: 'alice.creator@brandguard.ai' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Bob Taylor', role: 'REVIEWER', email: 'bob.reviewer@brandguard.ai' },
    { id: '33333333-3333-3333-3333-333333333333', name: 'Sarah Vance', role: 'MANAGER', email: 'sarah.manager@brandguard.ai' }
  ]);
  const [currentUser, setCurrentUser] = useState(users[0]);
  const [pendingQueueCount, setPendingQueueCount] = useState(0);

  // Real-time inspection state from WebSockets
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);
  const [findings, setFindings] = useState([]);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [appliedFixes, setAppliedFixes] = useState({});
  const [lastTier1Latency, setLastTier1Latency] = useState(null);
  const [intent, setIntent] = useState('PROMOTIONAL_OFFER');
  const [fixToast, setFixToast] = useState('');
  const [isSubmittingQueue, setIsSubmittingQueue] = useState(false);

  // Initialize WebSockets, guidelines, and queue count on mount
  useEffect(() => {
    fetchGuidelines();
    fetchUsers();
    fetchQueueCount();

    const socket = socketService.connect();
    setIsLiveConnected(socketService.isConnected);

    socket.on('connect', () => {
      setIsLiveConnected(true);
      socketService.emitDraftType(INITIAL_CAMPAIGN_COPY, INITIAL_CAMPAIGN_COPY.length);
    });

    socket.on('disconnect', () => {
      setIsLiveConnected(false);
    });

    socket.on('violations:precheck', (data) => {
      if (data?.latencyMs !== undefined) setLastTier1Latency(data.latencyMs);
      if (data?.intent) setIntent(data.intent);
    });

    socket.on('violations:update', (data) => {
      setInspectionResult(data);
      const updatedFindings = data.findings || [];
      setFindings(updatedFindings);
      if (updatedFindings.length > 0 && !selectedFinding) {
        setSelectedFinding(updatedFindings[0]);
      }
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/governance/users');
      if (res.ok) {
        const data = await res.json();
        if (data.users && data.users.length > 0) {
          setUsers(data.users);
          setCurrentUser(data.users[0]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch enterprise users:', err);
    }
  };

  const fetchGuidelines = async () => {
    try {
      const res = await fetch('/api/guidelines');
      if (res.ok) {
        const data = await res.json();
        setGuidelines(data.guidelines || []);
      }
    } catch (err) {
      console.warn('Failed to fetch guidelines:', err);
    }
  };

  const fetchQueueCount = async () => {
    try {
      const res = await fetch('/api/governance/queue?status=PENDING');
      if (res.ok) {
        const data = await res.json();
        setPendingQueueCount(data.queue ? data.queue.length : 0);
      }
    } catch (err) {
      console.warn('Failed to fetch queue count:', err);
    }
  };

  const handleApplyFix = (flaggedText, suggestedCorrection) => {
    if (!flaggedText) return;

    const replacement = suggestedCorrection !== undefined ? suggestedCorrection : '';
    const updated = content.replace(flaggedText, replacement);
    setContent(updated);

    setAppliedFixes((prev) => ({
      ...prev,
      [flaggedText]: true
    }));

    setFixToast(`Fixed: "${flaggedText}" → "${replacement}"`);
    setTimeout(() => setFixToast(''), 3000);

    socketService.emitDraftType(updated, updated.length);
  };

  const handleSelectFinding = (finding) => {
    setSelectedFinding(finding);
    setIsDrawerOpen(true);
  };

  const handleSubmitToQueue = async () => {
    if (!content.trim()) return;

    try {
      setIsSubmittingQueue(true);
      const res = await fetch('/api/governance/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: currentUser.id,
          rawContent: content,
          findings
        })
      });

      if (res.ok) {
        setFixToast('Draft submitted to Manager Approval Queue.');
        setTimeout(() => setFixToast(''), 3500);
        await fetchQueueCount();
        setActiveTab('queue');
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to submit draft');
      }
    } catch (error) {
      console.error('Submit to queue error:', error);
    } finally {
      setIsSubmittingQueue(false);
    }
  };

  const handleLoadIntoEditor = (textToLoad) => {
    setContent(textToLoad);
    setActiveTab('editor');
    socketService.emitDraftType(textToLoad, textToLoad.length);
    setFixToast('Loaded draft into Smart Composer');
    setTimeout(() => setFixToast(''), 2500);
  };

  const handleAddGuideline = async (guidelineData) => {
    const res = await fetch('/api/guidelines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(guidelineData)
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to add guideline');
    }

    await fetchGuidelines();
    socketService.emitDraftType(content, content.length);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        users={users}
        onSelectUser={setCurrentUser}
        onOpenGuidelines={() => setIsGuidelineModalOpen(false || true)}
        guidelineCount={guidelines.length}
        pendingQueueCount={pendingQueueCount}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        {/* Toast Notification */}
        {fixToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-950 text-emerald-200 border border-emerald-500/50 shadow-2xl px-4 py-3 rounded-xl text-xs flex items-center space-x-2 animate-bounce">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>{fixToast}</span>
          </div>
        )}

        {/* TAB 1: Smart Composer & Real-time Inspection */}
        {activeTab === 'editor' && (
          <div className="space-y-6">
            {/* Version 3 Feature Highlight Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-teal-950/40 border border-emerald-500/20 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-sm sm:text-base font-bold text-slate-100">
                      Smart Email Composer & Live Guardrails
                    </h1>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Active Role: {currentUser.role}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Draft with predictive autocompletion (press <kbd className="px-1 bg-slate-800 rounded font-mono text-[10px]">Tab</kbd>). Click "Submit to Queue" to send your copy to the Manager Sign-Off workflow.
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                  User: <strong>{currentUser.name}</strong>
                </span>
                <button
                  onClick={handleSubmitToQueue}
                  disabled={isSubmittingQueue || !content.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-md shadow-emerald-500/20"
                >
                  Submit for Approval ➔
                </button>
              </div>
            </div>

            {/* Smart Editor & Citation Drawer Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className={`transition-all duration-300 ${isDrawerOpen ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                <SmartEditor
                  content={content}
                  setContent={setContent}
                  findings={findings}
                  onSelectFinding={handleSelectFinding}
                  onApplyFix={handleApplyFix}
                  isLiveConnected={isLiveConnected}
                  lastTier1Latency={lastTier1Latency}
                  intent={intent}
                  onSubmitToQueue={handleSubmitToQueue}
                  isSubmittingQueue={isSubmittingQueue}
                />
              </div>

              {isDrawerOpen && (
                <div className="lg:col-span-5 h-full">
                  <CitationDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    selectedFinding={selectedFinding}
                    findings={findings}
                    onSelectFinding={handleSelectFinding}
                    onApplyFix={handleApplyFix}
                    appliedFixes={appliedFixes}
                  />
                </div>
              )}
            </div>

            {/* Audit & Findings Dashboard */}
            {inspectionResult && (
              <div className="mt-8">
                <InspectionResults
                  result={inspectionResult}
                  onApplyFix={handleApplyFix}
                />
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Governance & Approval Queue */}
        {activeTab === 'queue' && (
          <GovernanceQueue
            currentUser={currentUser}
            onLoadIntoEditor={handleLoadIntoEditor}
          />
        )}

        {/* TAB 3: Brand Governance Analytics Dashboard */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard />
        )}
      </main>

      {/* Guideline Management Modal */}
      <GuidelineModal
        isOpen={isGuidelineModalOpen}
        onClose={() => setIsGuidelineModalOpen(false)}
        guidelines={guidelines}
        onAddGuideline={handleAddGuideline}
      />
    </div>
  );
}
