/**
 * BrandGuard AI - Tier 1 Deterministic Inspection Engine
 * 
 * Synchronous regex pre-checks with zero LLM dependency.
 * Designed to execute in < 10ms.
 */

// Default banned phrases & comparative superlatives with suggested compliant alternatives
const BANNED_PATTERNS = [
  {
    regex: /\b(?:India'?s|the world'?s|the country'?s)?\s*best\s+(?:food\s+)?app\b/gi,
    issueType: 'UNVERIFIED_CLAIM',
    category: 'CLAIM',
    severity: 'HIGH',
    ruleId: 'RULE-CLAIM-SUPERLATIVE-BEST',
    explanation: "Unverified superlative claims like 'best app' violate Advertising Standards Council and brand legal policy unless substantiated by independent 3rd-party audits.",
    suggestedCorrection: 'a leading food app in India'
  },
  {
    regex: /\b100%\s*guaranteed\b/gi,
    issueType: 'UNVERIFIED_CLAIM',
    category: 'CLAIM',
    severity: 'HIGH',
    ruleId: 'RULE-CLAIM-ABSOLUTE-GUARANTEE',
    explanation: "Absolute guarantee claims ('100% guaranteed') create binding legal liability and are prohibited under Brand Consumer Protection guidelines.",
    suggestedCorrection: 'backed by our satisfaction policy'
  },
  {
    regex: /\b(?:completely\s+)?risk-free\b/gi,
    issueType: 'UNVERIFIED_CLAIM',
    category: 'CLAIM',
    severity: 'MEDIUM',
    ruleId: 'RULE-CLAIM-RISK-FREE',
    explanation: "The term 'risk-free' is prohibited in promotional copy under Fair Trading standards.",
    suggestedCorrection: 'flexible terms apply'
  },
  {
    regex: /\b(?:cheapest|lowest\s+price\s+guaranteed)\b/gi,
    issueType: 'UNVERIFIED_CLAIM',
    category: 'CLAIM',
    severity: 'HIGH',
    ruleId: 'RULE-CLAIM-PRICE-SUPERLATIVE',
    explanation: "Unsubstantiated price superiority claims require pre-approval and valid market price-matching documentation.",
    suggestedCorrection: 'competitive pricing'
  },
  {
    regex: /\b(?:guaranteed\s+cure|instant\s+results)\b/gi,
    issueType: 'BANNED_TERMINOLOGY',
    category: 'LEGAL',
    severity: 'CRITICAL',
    ruleId: 'RULE-LEGAL-BANNED-MEDICAL',
    explanation: "Health or outcome promises violate compliance standards.",
    suggestedCorrection: 'proven approach'
  }
];

// PII & Privacy Patterns
const PRIVACY_PATTERNS = [
  {
    name: 'EMAIL',
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    issueType: 'PRIVACY_PII_EMAIL',
    category: 'PRIVACY',
    severity: 'CRITICAL',
    ruleId: 'RULE-PRIVACY-EMAIL',
    explanation: 'Detected unmasked personal email address in public draft. Personal identifiable information must be redacted.',
    suggestedCorrection: '[REDACTED_EMAIL]'
  },
  {
    name: 'SSN',
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    issueType: 'PRIVACY_PII_SSN',
    category: 'PRIVACY',
    severity: 'CRITICAL',
    ruleId: 'RULE-PRIVACY-SSN',
    explanation: 'Detected Social Security Number (SSN) pattern. Strict regulatory privacy breach.',
    suggestedCorrection: '[REDACTED_SSN]'
  },
  {
    name: 'PHONE',
    regex: /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b|\b(?:\+91[-.\s]?)?[6-9]\d{9}\b/g,
    issueType: 'PRIVACY_PII_PHONE',
    category: 'PRIVACY',
    severity: 'HIGH',
    ruleId: 'RULE-PRIVACY-PHONE',
    explanation: 'Detected personal direct telephone number. Direct customer phone numbers must not appear in marketing copy.',
    suggestedCorrection: '[REDACTED_PHONE]'
  }
];

// Percentage discount detection: matches "50% off", "get 50% discount", "save 30%", "flat 40%", "up to 50% savings"
const DISCOUNT_REGEX = /(?:(?:flat|up\s*to|get|save|enjoy)\s+)?(\d+(?:\.\d+)?)\s*%\s*(?:off|discount|cashback|savings|sale)\b|(?:flat|save|get)\s+(\d+(?:\.\d+)?)\s*%/gi;
const MAX_PERMITTED_DISCOUNT = 20; // 20% cap

/**
 * Runs Tier 1 inspection synchronously.
 * @param {string} rawContent - The input content to check.
 * @param {Array} customDeterministicRules - Optional array of custom rules from DB.
 * @returns {Object} { findings: Array, executionTimeMs: number, passed: boolean }
 */
export function runTier1Inspection(rawContent, customDeterministicRules = []) {
  const startTime = performance.now();
  const findings = [];

  if (!rawContent || typeof rawContent !== 'string') {
    return {
      tier: 1,
      findings: [],
      executionTimeMs: performance.now() - startTime,
      passed: true
    };
  }

  // 1. Discount Cap Verification (Flag discounts > 20%)
  let discountMatch;
  const discountRegexCopy = new RegExp(DISCOUNT_REGEX.source, 'gi');
  while ((discountMatch = discountRegexCopy.exec(rawContent)) !== null) {
    const fullMatch = discountMatch[0].trim();
    const percentValue = parseFloat(discountMatch[1] || discountMatch[2]);
    
    // Only flag if the percentage value exceeds the 20% limit
    if (!isNaN(percentValue) && percentValue > MAX_PERMITTED_DISCOUNT) {
      // Create intelligent replacement (capped at 20%)
      const replacement = fullMatch.replace(new RegExp(`${percentValue}`, 'g'), `${MAX_PERMITTED_DISCOUNT}`);
      
      findings.push({
        tier: 1,
        issueType: 'DISCOUNT_CAP_EXCEEDED',
        category: 'LEGAL',
        severity: 'CRITICAL',
        flaggedText: fullMatch,
        startIndex: discountMatch.index,
        endIndex: discountMatch.index + fullMatch.length,
        explanation: `Promotional discount of ${percentValue}% exceeds the authorized brand cap of ${MAX_PERMITTED_DISCOUNT}%. Discounts over 20% require Director approval and Finance signing.`,
        suggestedCorrection: replacement,
        citationId: 'RULE-LEGAL-DISCOUNT-CAP-20'
      });
    }
  }

  // 2. Privacy & PII Inspection (Email, Phone, SSN)
  for (const priv of PRIVACY_PATTERNS) {
    let privMatch;
    const regex = new RegExp(priv.regex.source, 'gi');
    while ((privMatch = regex.exec(rawContent)) !== null) {
      const matchText = privMatch[0];
      findings.push({
        tier: 1,
        issueType: priv.issueType,
        category: priv.category,
        severity: priv.severity,
        flaggedText: matchText,
        startIndex: privMatch.index,
        endIndex: privMatch.index + matchText.length,
        explanation: priv.explanation,
        suggestedCorrection: priv.suggestedCorrection,
        citationId: priv.ruleId
      });
    }
  }

  // 3. Banned Terminology & Unverified Claims
  for (const rule of BANNED_PATTERNS) {
    let bannedMatch;
    const regex = new RegExp(rule.regex.source, 'gi');
    while ((bannedMatch = regex.exec(rawContent)) !== null) {
      const matchText = bannedMatch[0];
      findings.push({
        tier: 1,
        issueType: rule.issueType,
        category: rule.category,
        severity: rule.severity,
        flaggedText: matchText,
        startIndex: bannedMatch.index,
        endIndex: bannedMatch.index + matchText.length,
        explanation: rule.explanation,
        suggestedCorrection: rule.suggestedCorrection,
        citationId: rule.ruleId
      });
    }
  }

  // 4. Custom DB Deterministic Rules (if any passed from DB)
  if (Array.isArray(customDeterministicRules) && customDeterministicRules.length > 0) {
    for (const rule of customDeterministicRules) {
      if (rule.pattern_rule) {
        try {
          const customRegex = new RegExp(rule.pattern_rule, 'gi');
          let customMatch;
          while ((customMatch = customRegex.exec(rawContent)) !== null) {
            findings.push({
              tier: 1,
              issueType: 'CUSTOM_DETERMINISTIC_VIOLATION',
              category: rule.category || 'LEGAL',
              severity: 'HIGH',
              flaggedText: customMatch[0],
              startIndex: customMatch.index,
              endIndex: customMatch.index + customMatch[0].length,
              explanation: `Violates brand guideline: "${rule.title}". ${rule.content_chunk}`,
              suggestedCorrection: '',
              citationId: rule.id
            });
          }
        } catch (e) {
          console.warn(`Invalid regex pattern in custom rule [${rule.id}]:`, rule.pattern_rule);
        }
      }
    }
  }

  const executionTimeMs = parseFloat((performance.now() - startTime).toFixed(3));

  return {
    tier: 1,
    findings,
    executionTimeMs,
    passed: findings.length === 0
  };
}
