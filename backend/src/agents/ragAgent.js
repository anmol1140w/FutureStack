import { searchGuidelines } from '../services/ragService.js';

/**
 * RAG Search Agent (Agent 2)
 * 
 * Converts input draft into semantic query embedding,
 * retrieves candidate brand rules from pgvector using cosine distance,
 * and compiles candidate context for verification.
 */
export async function runRagAgent(text, topK = 4) {
  const startTime = performance.now();

  if (!text || text.trim().length === 0) {
    return {
      agent: 'RagAgent',
      candidateGuidelines: [],
      executionTimeMs: 0
    };
  }

  try {
    // Vector similarity search against PostgreSQL with pgvector (<=>)
    const candidates = await searchGuidelines(text, topK);

    const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(3));

    return {
      agent: 'RagAgent',
      candidateGuidelines: candidates,
      candidateCount: candidates.length,
      executionTimeMs
    };
  } catch (error) {
    console.error('[RagAgent] Vector retrieval error:', error);
    return {
      agent: 'RagAgent',
      candidateGuidelines: [],
      candidateCount: 0,
      error: error.message,
      executionTimeMs: parseFloat((performance.now() - startTime).toFixed(3))
    };
  }
}
