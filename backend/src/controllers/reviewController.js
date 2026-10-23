import crypto from 'crypto';
import pool from '../db/index.js';
import { runTier1Inspection } from '../engine/tier1.js';
import { searchGuidelines, getDeterministicRules } from '../services/ragService.js';
import { evaluateComplianceWithGrok } from '../services/grokService.js';

/**
 * Controller for multi-tier inspection pipeline
 * POST /api/check-content
 */
export async function checkContentHandler(req, res) {
  const overallStartTime = performance.now();

  try {
    const { rawContent, creatorId } = req.body;

    if (!rawContent || typeof rawContent !== 'string' || rawContent.trim() === '') {
      return res.status(400).json({
        error: 'Field "rawContent" is required and cannot be empty.'
      });
    }

    // --- PASS 1: Tier 1 Deterministic Engine (<10ms) ---
    // Fetch custom deterministic rules from DB to supplement static regex rules
    let customRules = [];
    try {
      customRules = await getDeterministicRules();
    } catch (e) {
      console.warn('Could not load custom DB deterministic rules:', e.message);
    }

    const tier1Result = runTier1Inspection(rawContent, customRules);
    const tier1Findings = tier1Result.findings;

    // --- PASS 2: RAG Vector Search (pgvector) ---
    const topGuidelines = await searchGuidelines(rawContent, 4);
    const guidelinesMap = new Map();
    topGuidelines.forEach(g => {
      guidelinesMap.set(g.id, g);
    });

    // --- PASS 3: Grok API Compliance Evaluation ---
    let grokFindings = [];
    try {
      grokFindings = await evaluateComplianceWithGrok(rawContent, topGuidelines);
    } catch (err) {
      console.error('Error during Grok evaluation:', err);
    }

    // --- PASS 4: Programmatic Citation Verification ---
    const validatedGrokFindings = grokFindings.map(finding => {
      const isRetrievedInContext = guidelinesMap.has(finding.citationId);
      const matchedGuideline = guidelinesMap.get(finding.citationId);

      return {
        ...finding,
        tier: finding.tier || 2,
        citationVerified: isRetrievedInContext,
        citationDetails: isRetrievedInContext ? {
          title: matchedGuideline.title,
          category: matchedGuideline.category,
          snippet: matchedGuideline.content_chunk.substring(0, 160) + '...'
        } : null
      };
    });

    // Combine Tier 1 deterministic findings and validated Grok findings
    // Ensure no exact duplicate flagged texts for the same category
    const combinedFindings = [...tier1Findings];
    
    for (const gf of validatedGrokFindings) {
      const alreadyFlagged = combinedFindings.some(tf => 
        tf.flaggedText && gf.flaggedText && 
        (tf.flaggedText.toLowerCase().includes(gf.flaggedText.toLowerCase()) || 
         gf.flaggedText.toLowerCase().includes(tf.flaggedText.toLowerCase()))
      );
      if (!alreadyFlagged) {
        combinedFindings.push(gf);
      }
    }

    const overallDurationMs = parseFloat((performance.now() - overallStartTime).toFixed(2));
    const isCompliant = combinedFindings.length === 0;
    const status = isCompliant ? 'APPROVED' : 'PENDING';

    // Generate SHA-256 audit hash
    const timestamp = new Date().toISOString();
    const hashData = `${rawContent}|${JSON.stringify(combinedFindings)}|${timestamp}`;
    const auditHash = crypto.createHash('sha256').update(hashData).digest('hex');

    // Save record in content_reviews table
    const insertQuery = `
      INSERT INTO content_reviews (creator_id, raw_content, status, findings, audit_hash)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, creator_id, raw_content, status, findings, audit_hash, created_at;
    `;

    const effectiveCreatorId = creatorId || '00000000-0000-0000-0000-000000000001';
    const { rows } = await pool.query(insertQuery, [
      effectiveCreatorId,
      rawContent,
      status,
      JSON.stringify(combinedFindings),
      auditHash
    ]);

    const savedReview = rows[0];

    return res.status(200).json({
      success: true,
      reviewId: savedReview.id,
      status,
      auditHash,
      performance: {
        tier1LatencyMs: tier1Result.executionTimeMs,
        tier1TargetPassed: tier1Result.executionTimeMs < 10,
        totalPipelineMs: overallDurationMs
      },
      stats: {
        totalIssues: combinedFindings.length,
        tier1Count: tier1Findings.length,
        semanticCount: combinedFindings.length - tier1Findings.length,
        isCompliant
      },
      findings: combinedFindings,
      retrievedGuidelines: topGuidelines.map(g => ({
        id: g.id,
        title: g.title,
        category: g.category,
        ruleType: g.rule_type,
        similarityScore: g.similarityScore,
        contentSnippet: g.content_chunk
      })),
      timestamp
    });

  } catch (error) {
    console.error('Check content error:', error);
    return res.status(500).json({
      error: 'An error occurred during content compliance inspection.',
      details: error.message
    });
  }
}

/**
 * GET /api/reviews/:id
 */
export async function getReviewByIdHandler(req, res) {
  try {
    const { id } = req.params;
    const query = `
      SELECT id, creator_id, raw_content, status, findings, audit_hash, reviewer_id, created_at, updated_at
      FROM content_reviews
      WHERE id = $1;
    `;
    const { rows } = await pool.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Review record not found.' });
    }

    return res.status(200).json({ review: rows[0] });
  } catch (error) {
    console.error('Error fetching review:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/reviews
 */
export async function getAllReviewsHandler(req, res) {
  try {
    const query = `
      SELECT id, creator_id, substring(raw_content, 1, 100) as content_preview, status, 
             jsonb_array_length(findings) as issue_count, audit_hash, created_at
      FROM content_reviews
      ORDER BY created_at DESC
      LIMIT 20;
    `;
    const { rows } = await pool.query(query);
    return res.status(200).json({ reviews: rows });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return res.status(500).json({ error: error.message });
  }
}
