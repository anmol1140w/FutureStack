import pool from '../db/index.js';

/**
 * GET /api/analytics/dashboard
 * Aggregates brand compliance statistics, violation frequencies, and guideline friction
 */
export async function getAnalyticsDashboardHandler(req, res) {
  try {
    // 1. Overall Review Volume & Status Breakdown
    const reviewStatsQuery = `
      SELECT 
        count(*) as total_reviews,
        count(*) FILTER (WHERE status = 'APPROVED') as approved_count,
        count(*) FILTER (WHERE status = 'PENDING') as pending_count,
        count(*) FILTER (WHERE status = 'REVISED') as revised_count,
        count(*) FILTER (WHERE status = 'REJECTED') as rejected_count
      FROM content_reviews;
    `;
    const { rows: reviewStatsRows } = await pool.query(reviewStatsQuery);
    const reviewStats = reviewStatsRows[0];
    const totalReviews = parseInt(reviewStats.total_reviews, 10) || 0;
    const approvedCount = parseInt(reviewStats.approved_count, 10) || 0;
    const approvalRate = totalReviews > 0 ? Math.round((approvedCount / totalReviews) * 100) : 100;

    // 2. Fetch all review findings to analyze breach patterns
    const findingsQuery = `SELECT findings FROM content_reviews WHERE jsonb_array_length(findings) > 0;`;
    const { rows: findingsRows } = await pool.query(findingsQuery);

    const categoryCounts = {
      LEGAL: 0,
      PRIVACY: 0,
      CLAIM: 0,
      TONE: 0,
      TERMINOLOGY: 0
    };

    const issueTypeCounts = {};
    const guidelineFrictionCounts = {};
    let totalIssuesIdentified = 0;

    findingsRows.forEach((row) => {
      const issues = Array.isArray(row.findings) ? row.findings : [];
      issues.forEach((issue) => {
        totalIssuesIdentified++;
        const cat = (issue.category || 'LEGAL').toUpperCase();
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

        const issueType = issue.issueType || 'RULE_BREACH';
        issueTypeCounts[issueType] = (issueTypeCounts[issueType] || 0) + 1;

        if (issue.citationId) {
          guidelineFrictionCounts[issue.citationId] = (guidelineFrictionCounts[issue.citationId] || 0) + 1;
        }
      });
    });

    // 3. Format Category Breakdown
    const categoryBreakdown = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: totalIssuesIdentified > 0 ? Math.round((count / totalIssuesIdentified) * 100) : 0
    })).sort((a, b) => b.count - a.count);

    // 4. Format Top Breached Issues
    const topBreaches = Object.entries(issueTypeCounts)
      .map(([issueType, count]) => ({ issueType, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 5. Fetch Guidelines Requiring Clarification (Cross-referenced with brand_guidelines)
    const { rows: allGuidelines } = await pool.query('SELECT id, title, category, content_chunk FROM brand_guidelines;');
    const guidelinesMap = new Map();
    allGuidelines.forEach(g => guidelinesMap.set(g.id, g));

    const frictionGuidelines = Object.entries(guidelineFrictionCounts)
      .map(([guidelineId, breachCount]) => {
        const guideline = guidelinesMap.get(guidelineId);
        return {
          guidelineId,
          title: guideline ? guideline.title : guidelineId,
          category: guideline ? guideline.category : 'POLICY',
          breachCount,
          recommendation: breachCount >= 3 
            ? 'High ambiguity detected. Recommended to add concrete before/after examples in Brand Portal.' 
            : 'Standard compliance training recommended.'
        };
      })
      .sort((a, b) => b.breachCount - a.breachCount)
      .slice(0, 4);

    // 6. Cryptographic Audit Trail Statistics
    const { rows: auditStats } = await pool.query(`
      SELECT 
        count(*) as total_audit_entries,
        count(*) FILTER (WHERE action = 'APPROVED') as total_signed_approvals
      FROM audit_logs;
    `);

    // Overall Enterprise Compliance Score
    const complianceScore = totalIssuesIdentified === 0 ? 100 : Math.max(10, Math.round(100 - (totalIssuesIdentified * 5) / (totalReviews || 1)));

    return res.status(200).json({
      summary: {
        totalReviews,
        approvedCount,
        pendingCount: parseInt(reviewStats.pending_count, 10) || 0,
        revisedCount: parseInt(reviewStats.revised_count, 10) || 0,
        rejectedCount: parseInt(reviewStats.rejected_count, 10) || 0,
        approvalRate: `${approvalRate}%`,
        complianceScore: `${complianceScore}%`,
        totalIssuesIdentified,
        totalAuditLogs: parseInt(auditStats[0].total_audit_entries, 10) || 0,
        totalSignedApprovals: parseInt(auditStats[0].total_signed_approvals, 10) || 0
      },
      categoryBreakdown,
      topBreaches,
      frictionGuidelines,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error computing analytics dashboard:', error);
    return res.status(500).json({ error: error.message });
  }
}
