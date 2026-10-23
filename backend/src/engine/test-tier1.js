import { runTier1Inspection } from './tier1.js';

const testInput = "Get 50% off everything today! FreshBite is India's best food app. Contact ceo@freshbite.com or 9876543210 or SSN 123-45-6789 for 100% guaranteed delivery.";

console.log('--- Testing Tier 1 Deterministic Engine ---');
console.log('Input:', testInput);

const result = runTier1Inspection(testInput);

console.log(`\nExecution time: ${result.executionTimeMs} ms (Target: < 10ms)`);
console.log(`Latency Passed: ${result.executionTimeMs < 10 ? '✅ YES' : '❌ NO'}`);
console.log(`Findings count: ${result.findings.length}`);
console.log('\nFindings:');
result.findings.forEach((f, idx) => {
  console.log(`[${idx + 1}] [${f.category}] ${f.issueType}: "${f.flaggedText}"`);
  console.log(`    Explanation: ${f.explanation}`);
  console.log(`    Suggested Fix: "${f.suggestedCorrection}"`);
  console.log(`    Citation: ${f.citationId}`);
});

if (result.findings.length >= 4 && result.executionTimeMs < 10) {
  console.log('\n Tier 1 Engine passed all assertions perfectly!');
  process.exit(0);
} else {
  console.error('\n Tier 1 Engine assertion failed.');
  process.exit(1);
}
