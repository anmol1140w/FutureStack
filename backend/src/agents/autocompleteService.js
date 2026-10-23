/**
 * BrandGuard AI - Predictive Autocompletion Engine
 * 
 * Powered by Grok API with brand guideline constraints.
 * Generates brand-compliant inline ghost-text predictions.
 */

const GROK_API_KEY = process.env.GROK_API_KEY || '';
const GROK_BASE_URL = process.env.GROK_BASE_URL || 'https://api.x.ai/v1';
const GROK_MODEL = process.env.GROK_MODEL || 'grok-2-latest';

// Smart contextual brand-aligned completions for local instant response
const CONTEXTUAL_PREDICTIONS = [
  { trigger: /get\s*$/i, completion: "up to 20% off your next meal with FreshBite!" },
  { trigger: /enjoy\s*$/i, completion: "our chef-crafted favorites delivered hot to your door." },
  { trigger: /freshbite\s+is\s*$/i, completion: "your trusted companion for local restaurant favorites." },
  { trigger: /our\s*$/i, completion: "Delivery Heroes bring fresh meals quickly and safely." },
  { trigger: /order\s*$/i, completion: "from our curated selection of quality restaurants today." },
  { trigger: /save\s*$/i, completion: "up to 20% on selected group orders this weekend." },
  { trigger: /contact\s*$/i, completion: "our 24/7 care team at support@freshbite.com for assistance." },
  { trigger: /delivery\s*$/i, completion: "Heroes are ready to bring hot food right to your doorstep." },
  { trigger: /we\s+are\s*$/i, completion: "proud to serve wholesome meals with care and transparency." }
];

/**
 * Generate brand-compliant inline completion suggestion
 * @param {string} text - current draft text before cursor
 * @param {Array} guidelines - active brand guidelines context
 * @returns {Promise<string>} predicted ghost-text completion
 */
export async function getAutocompleteSuggestion(text, guidelines = []) {
  if (!text || text.trim().length === 0) return '';

  const trimmed = text.trimEnd();

  // 1. Try Grok API if key is available
  if (GROK_API_KEY && GROK_API_KEY.trim() !== '' && !GROK_API_KEY.includes('your_')) {
    try {
      const guidelineRules = guidelines.map(g => `- ${g.title}: ${g.content_chunk}`).slice(0, 3).join('\n');
      
      const prompt = `You are an inline autocomplete engine for a brand marketing email composer.
Brand Rules:
- Maximum discount is 20%. Never suggest >20%.
- Call delivery drivers "Delivery Heroes".
- Never use boastful superlatives like "#1" or "India's best".
- Keep it humble, warm, and compliant.

Draft text so far:
"${text}"

TASK: Predict the next 4 to 8 words to seamlessly and compliantly finish or continue the sentence.
Output ONLY the continuation text with leading space if appropriate. Do NOT repeat what was already written. Do NOT wrap in quotes.`;

      const response = await fetch(`${GROK_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROK_API_KEY}`
        },
        body: JSON.stringify({
          model: GROK_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          max_tokens: 25
        })
      });

      if (response.ok) {
        const data = await response.json();
        const completion = data.choices?.[0]?.message?.content?.trim();
        if (completion) {
          // Ensure appropriate leading space if needed
          return text.endsWith(' ') ? completion : ' ' + completion;
        }
      }
    } catch (err) {
      console.warn('[Autocomplete] Grok API call failed, falling back to local predictor:', err.message);
    }
  }

  // 2. Local Brand-Compliant Heuristic Predictor
  for (const item of CONTEXTUAL_PREDICTIONS) {
    if (item.trigger.test(trimmed)) {
      return (text.endsWith(' ') ? '' : ' ') + item.completion;
    }
  }

  // Default generic compliant continuation based on last word
  const words = trimmed.split(/\s+/);
  const lastWord = words[words.length - 1].toLowerCase();

  if (lastWord.length > 2) {
    return (text.endsWith(' ') ? '' : ' ') + 'with verified quality and humble care.';
  }

  return '';
}
