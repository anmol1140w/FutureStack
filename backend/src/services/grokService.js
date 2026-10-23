/**
 * BrandGuard AI - Grok API Service (xAI)
 * 
 * Handles LLM compliance evaluations with structured JSON outputs.
 * Provides resilient fallbacks when API keys are absent or rate-limited.
 */

const GROK_API_KEY = process.env.GROK_API_KEY || '';
const GROK_BASE_URL = process.env.GROK_BASE_URL || 'https://api.x.ai/v1';
const GROK_MODEL = process.env.GROK_MODEL || 'grok-2-latest';

/**
 * Perform LLM compliance inspection using Grok API
 * @param {string} rawContent 
 * @param {Array} retrievedGuidelines - Guidelines retrieved via pgvector
 * @returns {Promise<Array>} findings
 */
export async function evaluateComplianceWithGrok(rawContent, retrievedGuidelines = []) {
  if (GROK_API_KEY && GROK_API_KEY.trim() !== '' && !GROK_API_KEY.includes('your_')) {
    try {
      const guidelineContext = retrievedGuidelines.map((g, idx) => `
[GUIDELINE ${idx + 1}]
ID: ${g.id}
Title: ${g.title}
Category: ${g.category}
Rule Type: ${g.rule_type}
Guideline Text: ${g.content_chunk}
`).join('\n---\n');

      const systemPrompt = `You are BrandGuard AI, an evidence-grounded brand governance and legal compliance inspector.
Your job is to analyze the draft marketing text strictly against the provided brand guidelines.

EVALUATION RULES:
1. Only cite rules from the provided GUIDELINES list. Use the exact GUIDELINE ID as 'citationId'.
2. Check for tone of voice (humble vs boastful, aggressive urgency), unverified claims, terminology compliance, and legal caveats.
3. For every issue found, identify the exact substring 'flaggedText', give a clear 'explanation', provide an actionable 'suggestedCorrection', and specify the 'citationId'.
4. Output MUST be valid JSON with this exact schema:
{
  "findings": [
    {
      "issueType": "TONE_VIOLATION | UNVERIFIED_CLAIM | TERMINOLOGY_VIOLATION | LEGAL_RISK",
      "category": "TONE | TERMINOLOGY | CLAIM | LEGAL | PRIVACY",
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "flaggedText": "exact text from draft",
      "explanation": "why this breaches the cited guideline",
      "suggestedCorrection": "replacement text that conforms to guidelines",
      "citationId": "exact UUID from the provided guidelines"
    }
  ]
}
If no semantic violations exist, return { "findings": [] }.`;

      const userPrompt = `DRAFT CONTENT TO AUDIT:
"""
${rawContent}
"""

RELEVANT BRAND GUIDELINES:
${guidelineContext}

Analyze the draft against these guidelines and output JSON.`;

      const response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_API_KEY}`
        },
        body: JSON.stringify({
          model: GROK_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed.findings)) {
            return parsed.findings;
          }
        }
      } else {
        const errorText = await response.text();
        console.warn(`Grok API error (${response.status}):`, errorText);
      }
    } catch (err) {
      console.warn('Grok API execution failed, switching to semantic rule evaluator:', err.message);
    }
  }

  // Resilient heuristic semantic evaluation fallback (when Grok API is not configured or offline)
  return runSemanticRuleFallback(rawContent, retrievedGuidelines);
}

/**
 * Intelligent semantic evaluation fallback for local testing & resilience
 */
function runSemanticRuleFallback(rawContent, guidelines) {
  const findings = [];
  const lower = rawContent.toLowerCase();

  for (const g of guidelines) {
    // Terminology check: check if terms like 'driver' or 'courier' are used when guideline requires 'Delivery Hero'
    if (g.category === 'TERMINOLOGY') {
      const forbiddenTerms = [
        { term: 'driver', replacement: 'Delivery Hero' },
        { term: 'drivers', replacement: 'Delivery Heroes' },
        { term: 'courier', replacement: 'Fleet Partner' },
        { term: 'couriers', replacement: 'Fleet Partners' }
      ];

      for (const item of forbiddenTerms) {
        const regex = new RegExp(`\\b${item.term}\\b`, 'gi');
        let match;
        while ((match = regex.exec(rawContent)) !== null) {
          findings.push({
            tier: 2,
            issueType: 'TERMINOLOGY_VIOLATION',
            category: 'TERMINOLOGY',
            severity: 'MEDIUM',
            flaggedText: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            explanation: `Brand Lexicon requires using '${item.replacement}' instead of '${match[0]}'.`,
            suggestedCorrection: item.replacement,
            citationId: g.id
          });
        }
      }
    }

    // Tone check: boastful hyperbole or aggressive urgency
    if (g.category === 'TONE') {
      const toneViolations = [
        {
          regex: /\b(?:you will regret missing out|act now before it'?s too late|hurry or suffer)\b/gi,
          msg: "Predatory urgency contradicts our humble and authentic tone.",
          fix: "Order whenever you are ready"
        },
        {
          regex: /\b(?:undisputed greatest|unrivaled platform)\b/gi,
          msg: "Boastful hyperbole breaches brand voice principles.",
          fix: "a trusted choice for thousands"
        }
      ];

      for (const t of toneViolations) {
        let match;
        while ((match = t.regex.exec(rawContent)) !== null) {
          findings.push({
            tier: 2,
            issueType: 'TONE_VIOLATION',
            category: 'TONE',
            severity: 'HIGH',
            flaggedText: match[0],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            explanation: t.msg,
            suggestedCorrection: t.fix,
            citationId: g.id
          });
        }
      }
    }
  }

  return findings;
}
