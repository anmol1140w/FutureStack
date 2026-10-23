import pool, { initDatabase } from './index.js';
import { ingestGuideline } from '../services/ragService.js';

const SEED_GUIDELINES = [
  {
    title: "Promotional Discount Cap (Max 20%)",
    category: "LEGAL",
    content_chunk: "Marketing promotional discounts cannot exceed 20% without prior written authorization from the Chief Commercial Officer and Finance Directorate. Phrases like '50% off' or percentage discounts > 20% violate fiscal governance and pricing integrity.",
    rule_type: "DETERMINISTIC",
    pattern_rule: "(?:(?:flat|up\\s*to|get|save)\\s+)?(?:[2-9][1-9]|[3-9]\\d|\\d{3,})\\s*%\\s*(?:off|discount|cashback|savings)"
  },
  {
    title: "Authentic, Transparent & Humble Tone of Voice",
    category: "TONE",
    content_chunk: "Brand communications must remain authentic, humble, and customer-first. Avoid boastful hyperbole, predatory urgency, and sensationalism such as 'You will regret missing out' or 'Undisputed greatest platform ever'. Use welcoming, clear, and reassuring vocabulary.",
    rule_type: "SEMANTIC",
    pattern_rule: null
  },
  {
    title: "PII & Privacy Protection Standard",
    category: "PRIVACY",
    content_chunk: "Customer, partner, and employee Personally Identifiable Information (PII) including email addresses, personal phone numbers, and Social Security / National ID numbers must never appear in public-facing marketing copy. Any detected personal identifiers must be masked immediately.",
    rule_type: "DETERMINISTIC",
    pattern_rule: "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}"
  },
  {
    title: "Market Leadership & Comparative Superlative Substantiation",
    category: "CLAIM",
    content_chunk: "Comparative claims and superlatives asserting market dominance (such as 'India's best food app', 'World's #1 grocery service', '100% guaranteed delivery') are prohibited under ASCI / FTC guidelines unless accompanied by verified 3rd-party audit certifications.",
    rule_type: "SEMANTIC",
    pattern_rule: null
  },
  {
    title: "Exclusive Terminology & Approved Brand Lexicon",
    category: "TERMINOLOGY",
    content_chunk: "Always refer to our delivery partners as 'Delivery Heroes' or 'Fleet Partners', never 'drivers' or 'couriers'. Refer to customers as 'Foodies' or 'Members'.",
    rule_type: "SEMANTIC",
    pattern_rule: null
  }
];

export async function seedGuidelines() {
  await initDatabase();

  console.log('🌱 Seeding standard brand guidelines...');
  
  // Check if already seeded
  const { rows: existing } = await pool.query('SELECT count(*) as count FROM brand_guidelines');
  if (parseInt(existing[0].count, 10) > 0) {
    console.log(`ℹ️ Database already contains ${existing[0].count} guidelines. Skipping initial seed.`);
    return;
  }

  for (const g of SEED_GUIDELINES) {
    const created = await ingestGuideline(
      g.title,
      g.category,
      g.content_chunk,
      g.rule_type,
      g.pattern_rule
    );
    console.log(`  Added guideline [${created.category}] "${created.title}" (ID: ${created.id})`);
  }

  console.log('✅ Guidelines seeding complete.');
}

if (process.argv[1].endsWith('seed.js')) {
  seedGuidelines()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
