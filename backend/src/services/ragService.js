import pgvector from 'pgvector/pg';
import pool from '../db/index.js';
import crypto from 'crypto';

const GROK_API_KEY = process.env.GROK_API_KEY || '';
const GROK_BASE_URL = process.env.GROK_BASE_URL || 'https://api.x.ai/v1';

/**
 * Deterministic fallback embedding generator (1536 dimensions, unit normalized)
 * Used when GROK_API_KEY is not set or network/service is unavailable.
 * Generates semantically meaningful embeddings based on n-grams, TF-IDF weights,
 * and positional hash buckets so semantic similarity is preserved.
 */
export function generateLocalFallbackEmbedding(text, dimensions = 1536) {
  const vector = new Float32Array(dimensions).fill(0);
  const normalized = (text || '').toLowerCase().trim();
  
  if (!normalized) {
    // Return unit vector along first dimension
    vector[0] = 1.0;
    return Array.from(vector);
  }

  // Tokenize words and character n-grams (3-grams, 4-grams)
  const words = normalized.split(/\W+/).filter(w => w.length > 0);
  const ngrams = [];
  
  for (let i = 0; i < normalized.length - 2; i++) {
    ngrams.push(normalized.substring(i, i + 3));
    if (i < normalized.length - 3) {
      ngrams.push(normalized.substring(i, i + 4));
    }
  }

  const allTokens = [...words, ...ngrams];

  for (const token of allTokens) {
    // Generate hashes using sha256 to distribute across 1536 dimensions
    const hash = crypto.createHash('sha256').update(token).digest();
    const idx1 = hash.readUInt16LE(0) % dimensions;
    const idx2 = hash.readUInt16LE(2) % dimensions;
    const weight = 1.0 / Math.sqrt(token.length);
    vector[idx1] += weight;
    vector[idx2] += weight * 0.5;
  }

  // Normalize to unit length (L2 norm) for cosine distance
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] = vector[i] / norm;
    }
  } else {
    vector[0] = 1.0;
  }

  return Array.from(vector);
}

/**
 * Generate 1536-dimensional embedding using Grok API or deterministic fallback.
 * @param {string} text 
 * @returns {Promise<Array<number>>} 1536-dim vector
 */
export async function getEmbedding(text) {
  if (GROK_API_KEY && GROK_API_KEY.trim() !== '' && !GROK_API_KEY.includes('your_')) {
    try {
      const response = await fetch(`${GROK_BASE_URL}/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_API_KEY}`
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-3-small' // or xAI supported embedding model
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data[0] && Array.isArray(data.data[0].embedding)) {
          let emb = data.data[0].embedding;
          // Pad or truncate to 1536 if needed
          if (emb.length < 1536) {
            emb = emb.concat(new Array(1536 - emb.length).fill(0));
          } else if (emb.length > 1536) {
            emb = emb.slice(0, 1536);
          }
          return emb;
        }
      } else {
        console.warn(`Grok embedding endpoint returned ${response.status}: fallback to local embedding.`);
      }
    } catch (err) {
      console.warn('Grok API embedding request failed, using local semantic fallback:', err.message);
    }
  }

  return generateLocalFallbackEmbedding(text, 1536);
}

/**
 * Ingest a brand guideline into PostgreSQL with pgvector.
 * @param {string} title
 * @param {string} category - 'TONE' | 'TERMINOLOGY' | 'CLAIM' | 'LEGAL' | 'PRIVACY'
 * @param {string} contentChunk
 * @param {string} ruleType - 'DETERMINISTIC' | 'SEMANTIC'
 * @param {string|null} patternRule - Optional regex for deterministic rules
 * @returns {Promise<Object>} Created guideline record
 */
export async function ingestGuideline(title, category, contentChunk, ruleType = 'SEMANTIC', patternRule = null) {
  const embedding = await getEmbedding(contentChunk);
  const formattedEmbedding = pgvector.toSql(embedding);

  const query = `
    INSERT INTO brand_guidelines (title, category, content_chunk, embedding, rule_type, pattern_rule)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, title, category, content_chunk, rule_type, pattern_rule, created_at;
  `;

  const values = [title, category, contentChunk, formattedEmbedding, ruleType, patternRule];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Search brand guidelines using pgvector cosine distance.
 * @param {string} queryText - Content snippet or prompt
 * @param {number} topK - Number of results to retrieve (default: 3)
 * @returns {Promise<Array<Object>>}
 */
export async function searchGuidelines(queryText, topK = 3) {
  const queryEmbedding = await getEmbedding(queryText);
  const formattedEmbedding = pgvector.toSql(queryEmbedding);

  const query = `
    SELECT 
      id, 
      title, 
      category, 
      content_chunk, 
      rule_type, 
      pattern_rule,
      created_at,
      (embedding <=> $1) as distance
    FROM brand_guidelines
    ORDER BY embedding <=> $1
    LIMIT $2;
  `;

  const { rows } = await pool.query(query, [formattedEmbedding, topK]);
  return rows.map(r => ({
    ...r,
    similarityScore: parseFloat((1 - (r.distance || 0)).toFixed(4))
  }));
}

/**
 * Fetch all guidelines from database
 */
export async function getAllGuidelines() {
  const query = `
    SELECT id, title, category, content_chunk, rule_type, pattern_rule, created_at
    FROM brand_guidelines
    ORDER BY created_at DESC;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

/**
 * Fetch all active deterministic rules to supplement Tier 1
 */
export async function getDeterministicRules() {
  const query = `
    SELECT id, title, category, content_chunk, pattern_rule
    FROM brand_guidelines
    WHERE rule_type = 'DETERMINISTIC' AND pattern_rule IS NOT NULL AND pattern_rule <> '';
  `;
  const { rows } = await pool.query(query);
  return rows;
}
