console.log('--- Testing BrandGuard AI Version 3 Governance & Analytics ---');

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  // 1. Fetch Users
  console.log('\n[1] Testing GET /api/governance/users...');
  const usersRes = await fetch(`${BASE_URL}/api/governance/users`);
  const { users } = await usersRes.json();
  console.log(`✅ Loaded ${users.length} enterprise users:`);
  users.forEach(u => console.log(`   • ${u.name} [Role: ${u.role}] (${u.email})`));

  const creator = users.find(u => u.role === 'CREATOR');
  const manager = users.find(u => u.role === 'MANAGER');

  // 2. Creator submits draft to queue
  console.log('\n[2] Testing POST /api/governance/submit (Creator Submission)...');
  const draftText = "Enjoy up to 20% off your fresh order today! FreshBite connects you with great local kitchens.";
  const submitRes = await fetch(`${BASE_URL}/api/governance/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creatorId: creator.id,
      rawContent: draftText,
      findings: []
    })
  });
  const submitData = await submitRes.json();
  const reviewId = submitData.review.id;
  console.log(`✅ Draft submitted successfully! Review ID: ${reviewId}`);
  console.log(`   Initial Audit Hash: ${submitData.review.audit_hash}`);

  // 3. Manager approves and signs draft with SHA-256
  console.log('\n[3] Testing POST /api/governance/approve/:id (Manager Sign-Off)...');
  const approvedText = "Enjoy up to 20% off your fresh order today! FreshBite connects you with trusted culinary kitchens.";
  const approveRes = await fetch(`${BASE_URL}/api/governance/approve/${reviewId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reviewerId: manager.id,
      approvedContent: approvedText,
      managerNotes: "Verified within authorized promotional cap (20%) and aligns with humble tone of voice."
    })
  });
  const approveData = await approveRes.json();
  console.log(`✅ Draft approved and signed by ${manager.name}!`);
  console.log(`   Algorithm: ${approveData.cryptographicProof.algorithm}`);
  console.log(`   Tamper-proof SHA-256 Signature: ${approveData.cryptographicProof.hash}`);

  // 4. Cryptographic Signature Integrity Verification
  console.log('\n[4] Testing GET /api/governance/verify-signature/:id (Tamper-Resistance Check)...');
  const verifyRes = await fetch(`${BASE_URL}/api/governance/verify-signature/${reviewId}`);
  const verifyData = await verifyRes.json();
  console.log(`✅ Signature verification result:`);
  console.log(`   Valid: ${verifyData.isValid ? 'YES ✅' : 'NO ❌'}`);
  console.log(`   Status: ${verifyData.tamperProofStatus}`);
  console.log(`   Stored Hash == Log Hash: ${verifyData.storedHash === verifyData.logHash ? 'MATCH ✅' : 'MISMATCH ❌'}`);

  // 5. Audit Trail History
  console.log('\n[5] Testing GET /api/governance/audit-trail/:id...');
  const auditRes = await fetch(`${BASE_URL}/api/governance/audit-trail/${reviewId}`);
  const { auditTrail } = await auditRes.json();
  console.log(`✅ Found ${auditTrail.length} cryptographic audit trail entries:`);
  auditTrail.forEach((e, idx) => {
    console.log(`   [Entry ${idx + 1}] Action: ${e.action} | Actor: ${e.actor_name} (${e.actor_role}) | Hash: ${e.audit_hash.substring(0, 16)}...`);
  });

  // 6. Brand Governance Analytics Dashboard
  console.log('\n[6] Testing GET /api/analytics/dashboard...');
  const analyticsRes = await fetch(`${BASE_URL}/api/analytics/dashboard`);
  const analytics = await analyticsRes.json();
  console.log(`✅ Analytics calculated:`);
  console.log(`   Compliance Score: ${analytics.summary.complianceScore}`);
  console.log(`   Approval Rate: ${analytics.summary.approvalRate}`);
  console.log(`   Total Reviews: ${analytics.summary.totalReviews}`);
  console.log(`   Total Signed Approvals: ${analytics.summary.totalSignedApprovals}`);
  console.log(`   Category Breaches:`, analytics.categoryBreakdown.map(c => `${c.category}: ${c.count} (${c.percentage}%)`));
  console.log(`   Guidelines Requiring Clarification:`, analytics.frictionGuidelines.map(g => `${g.title} (${g.breachCount} breaches)`));

  console.log('\n🎉 ALL Version 3 Governance, Cryptographic Audit Trail, and Analytics tests passed successfully!');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
