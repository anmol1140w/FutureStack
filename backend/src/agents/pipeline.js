import { runTriageAgent } from './triageAgent.js';
import { runRagAgent } from './ragAgent.js';
import { runVerifierAgent } from './verifierAgent.js';

/**
 * Multi-Step Agentic Inspection Pipeline
 * 
 * Orchestrates:
 * Step 1: Triage Agent (Tier 1 deterministic + intent categorization)
 * Step 2: RAG Agent (PostgreSQL pgvector cosine distance candidate retrieval)
 * Step 3: Verifier Agent (Evidence grounding, zero-hallucination citation validation, fix suggestions)
 */
export async function runAgenticPipeline(rawContent) {
  const totalStart = performance.now();

  // --- STEP 1: Triage & Deterministic Agent ---
  const triage = await runTriageAgent(rawContent);

  // --- STEP 2: RAG Search Agent ---
  let candidateGuidelines = [];
  let ragExecutionTimeMs = 0;

  if (triage.requiresSemanticAnalysis) {
    const ragResult = await runRagAgent(rawContent, 4);
    candidateGuidelines = ragResult.candidateGuidelines;
    ragExecutionTimeMs = ragResult.executionTimeMs;
  }

  // --- STEP 3: Citation & Verification Agent ---
  const verification = await runVerifierAgent(
    rawContent,
    candidateGuidelines,
    triage.tier1Findings
  );

  const totalDurationMs = parseFloat((performance.now() - totalStart).toFixed(2));

  return {
    success: true,
    status: verification.isCompliant ? 'APPROVED' : 'PENDING',
    intent: triage.intent,
    complianceScore: verification.complianceScore,
    stats: {
      totalIssues: verification.totalIssues,
      tier1Count: triage.tier1Findings.length,
      semanticCount: verification.totalIssues - triage.tier1Findings.length,
      isCompliant: verification.isCompliant
    },
    findings: verification.findings,
    retrievedGuidelines: candidateGuidelines.map(g => ({
      id: g.id,
      title: g.title,
      category: g.category,
      ruleType: g.rule_type,
      similarityScore: g.similarityScore,
      contentSnippet: g.content_chunk
    })),
    agentBreakdown: {
      triageAgent: {
        latencyMs: triage.tier1ExecutionTimeMs,
        targetPassed: triage.tier1ExecutionTimeMs < 10
      },
      ragAgent: {
        latencyMs: ragExecutionTimeMs,
        retrievedCount: candidateGuidelines.length
      },
      verifierAgent: {
        latencyMs: verification.executionTimeMs,
        zeroHallucinationsEnforced: true
      },
      totalPipelineMs: totalDurationMs
    }
  };
}
