import React, { useState } from 'react';
import { X, Plus, BookOpen, Check, AlertCircle, Database, Sparkles } from 'lucide-react';

const CATEGORIES = ['TONE', 'TERMINOLOGY', 'CLAIM', 'LEGAL', 'PRIVACY'];

export default function GuidelineModal({
  isOpen,
  onClose,
  guidelines = [],
  onAddGuideline,
  isLoading
}) {
  const [activeTab, setActiveTab] = useState('list'); // 'list' | 'add'
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('LEGAL');
  const [ruleType, setRuleType] = useState('SEMANTIC');
  const [contentChunk, setContentChunk] = useState('');
  const [patternRule, setPatternRule] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!title.trim() || !contentChunk.trim()) {
      setFormError('Title and Guideline Content are required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddGuideline({
        title: title.trim(),
        category,
        contentChunk: contentChunk.trim(),
        ruleType,
        patternRule: patternRule.trim() ? patternRule.trim() : null
      });

      setFormSuccess('Guideline saved and vector embeddings generated successfully!');
      setTitle('');
      setContentChunk('');
      setPatternRule('');
      setTimeout(() => {
        setActiveTab('list');
        setFormSuccess('');
      }, 1200);
    } catch (err) {
      setFormError(err.message || 'Failed to save guideline.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <BookOpen className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-base">Brand Guidelines & Vector Knowledge Base</h3>
              <p className="text-xs text-slate-400">Manage rules stored in PostgreSQL with pgvector embeddings</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pt-3 border-b border-slate-800 flex space-x-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('list')}
            className={`pb-2.5 border-b-2 transition ${
              activeTab === 'list'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            All Guidelines ({guidelines.length})
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`pb-2.5 border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'add'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add New Guideline</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              {guidelines.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No brand guidelines registered yet. Click "Add New Guideline" to create one.
                </div>
              ) : (
                guidelines.map((g) => (
                  <div
                    key={g.id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-200 text-sm">{g.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {g.category}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-[11px] font-mono">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {g.rule_type}
                        </span>
                        <span className="text-slate-500">1536-dim vector</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{g.content_chunk}</p>

                    {g.pattern_rule && (
                      <div className="text-[11px] font-mono text-amber-400 bg-amber-500/10 p-2 rounded border border-amber-500/20 flex items-center space-x-2">
                        <span className="text-slate-500">Regex:</span>
                        <code>{g.pattern_rule}</code>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Guideline Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Promotional Discount Limit"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Rule Type *
                  </label>
                  <select
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  >
                    <option value="SEMANTIC">SEMANTIC (Vector Embedding RAG)</option>
                    <option value="DETERMINISTIC">DETERMINISTIC (Regex Pre-Check &lt;10ms)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Guideline Content Chunk *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Enter the complete guideline, policy rules, and context chunk to be embedded and indexed..."
                  value={contentChunk}
                  onChange={(e) => setContentChunk(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {ruleType === 'DETERMINISTIC' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Regex Pattern (Optional for deterministic rule)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. \b(50% off|half price)\b"
                    value={patternRule}
                    onChange={(e) => setPatternRule(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Generating Vector & Saving...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 fill-slate-950" />
                      <span>Index into pgvector</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
