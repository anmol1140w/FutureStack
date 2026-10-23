import { runTier1Inspection } from '../engine/tier1.js';
import { getDeterministicRules } from '../services/ragService.js';

/**
 * Triage & Deterministic Agent (Agent 1)
 * 
 * 1. Executes synchronous zero-latency Tier 1 checks (< 10ms).
 * 2. Classifies the marketing intent of the text.
 * 3. Assesses whether semantic RAG inspection is warranted.
 */
export async function runTriageAgent(text) {
  const startTime = performance.now();

  if (!text || typeof text !== 'string') {
    return {
      agent: 'TriageAgent',
      intent: 'EMPTY',
      tier1Findings: [],
      requiresSemanticAnalysis: false,
      executionTimeMs: 0
    };
  }

  // 1. Fetch custom deterministic regex rules from DB (cached / fast query)
  let customRules = [];
  try {
    customRules = await getDeterministicRules();
  } catch (err) {
    console.warn('[TriageAgent] Could not retrieve DB deterministic rules:', err.message);
  }

  // 2. Run Tier 1 Deterministic Inspection
  const tier1Result = runTier1Inspection(text, customRules);

  // 3. Classify Text Intent
  let intent = 'GENERAL_COPY';
  const lower = text.toLowerCase();
  
  if (/%|\bdiscount\b|\boff\b|\bdeal\b|\bsave\b|\bpromo\b|\bcoupon\b/i.test(text)) {
    intent = 'PROMOTIONAL_OFFER';
  } else if (/\blaunch\b|\bannounc|\bintroducing\b|\bnew\s+feature\b/i.test(text)) {
    intent = 'PRODUCT_ANNOUNCEMENT';
  } else if (/\border\b|\bdeliver|\bfood\b|\bmeal\b|\bapp\b/i.test(text)) {
    intent = 'CUSTOMER_COMMUNICATION';
  }

  // Determine if semantic analysis should be invoked
  // We trigger semantic RAG if text length > 10 chars
  const requiresSemanticAnalysis = text.trim().length > 10;
  const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(3));

  return {
    agent: 'TriageAgent',
    intent,
    tier1Findings: tier1Result.findings,
    tier1ExecutionTimeMs: tier1Result.executionTimeMs,
    requiresSemanticAnalysis,
    executionTimeMs
  };
}
