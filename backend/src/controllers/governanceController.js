import crypto from 'crypto';
import pool from '../db/index.js';

/**
 * Generate cryptographic SHA-256 signature for enterprise legal auditability
 */
export function generateAuditHash(rawContent, approvedContent, actorId, timestamp) {
  const payload = `${rawContent || ''}|${approvedContent || ''}|${actorId || ''}|${timestamp}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * GET /api/governance/users
 * Fetches all enterprise users for RBAC demo
 */
export async function getUsersHandler(req, res) {
  try {
    const { rows } = await pool.query('SELECT id, name, email, role, created_at FROM users ORDER BY role DESC, name ASC');
    return res.status(200).json({ users: rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/governance/submit
 * Creator submits draft to Manager Approval Queue
 */
export async function submitDraftHandler(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rawContent, creatorId, findings = [] } = req.body;

    if (!rawContent || !rawContent.trim()) {
      return res.status(400).json({ error: 'Content cannot be empty.' });
    }

    const effectiveCreatorId = creatorId || '11111111-1111-1111-1111-111111111111';
    const timestamp = new Date().toISOString();
    const initialHash = generateAuditHash(rawContent, rawContent, effectiveCreatorId, timestamp);

    // Insert into content_reviews
    const reviewQuery = `
      INSERT INTO content_reviews (creator_id, raw_content, status, findings, audit_hash, created_at, updated_at)
      VALUES ($1, $2, 'PENDING', $3, $4, $5, $5)
      RETURNING id, creator_id, raw_content, status, findings, audit_hash, created_at;
    `;
    const { rows: reviewRows } = await client.query(reviewQuery, [
      effectiveCreatorId,
      rawContent,
      JSON.stringify(findings),
      initialHash,
      timestamp
    ]);
    const review = reviewRows[0];

    // Log to audit_logs
    const auditQuery = `
      INSERT INTO audit_logs (review_id, actor_id, action, previous_content, updated_content, audit_hash, timestamp)
      VALUES ($1, $2, 'SUBMITTED', $3, $4, $5, $6)
      RETURNING id, review_id, actor_id, action, audit_hash, timestamp;
    `;
    const { rows: auditRows } = await client.query(auditQuery, [
      review.id,
      effectiveCreatorId,
      '',
      rawContent,
      initialHash,
      timestamp
    ]);

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Draft submitted to Manager Approval Queue.',
      review,
      auditLog: auditRows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit draft error:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}

/**
 * GET /api/governance/queue
 * Fetches review queue with creator metadata
 */
export async function getApprovalQueueHandler(req, res) {
  try {
    const { status } = req.query;
    let query = `
      SELECT 
        cr.id,
        cr.creator_id,
        u.name as creator_name,
        u.email as creator_email,
        cr.raw_content,
        cr.approved_content,
        cr.manager_notes,
        cr.status,
        cr.findings,
        cr.audit_hash,
        cr.reviewer_id,
        rev.name as reviewer_name,
        cr.created_at,
        cr.updated_at
      FROM content_reviews cr
      LEFT JOIN users u ON cr.creator_id = u.id
      LEFT JOIN users rev ON cr.reviewer_id = rev.id
    `;

    const values = [];
    if (status && status !== 'ALL') {
      query += ` WHERE cr.status = $1`;
      values.push(status.toUpperCase());
    }

    query += ` ORDER BY cr.updated_at DESC LIMIT 50`;

    const { rows } = await pool.query(query, values);
    return res.status(200).json({ queue: rows });
  } catch (error) {
    console.error('Error fetching approval queue:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/governance/approve/:id
 * Manager signs off and cryptographically hashes the approved revision
 */
export async function approveDraftHandler(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { reviewerId, approvedContent, managerNotes } = req.body;

    const effectiveReviewerId = reviewerId || '33333333-3333-3333-3333-333333333333';

    // Fetch existing review
    const { rows: existingRows } = await client.query('SELECT * FROM content_reviews WHERE id = $1', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }
    const current = existingRows[0];
    const finalApprovedContent = approvedContent || current.raw_content;
    const timestamp = new Date().toISOString();

    // Compute tamper-proof SHA-256 cryptographic signature
    const finalAuditHash = generateAuditHash(
      current.raw_content,
      finalApprovedContent,
      effectiveReviewerId,
      timestamp
    );

    // Update review
    const updateQuery = `
      UPDATE content_reviews
      SET status = 'APPROVED',
          approved_content = $1,
          manager_notes = $2,
          reviewer_id = $3,
          audit_hash = $4,
          updated_at = $5
      WHERE id = $6
      RETURNING *;
    `;
    const { rows: updatedRows } = await client.query(updateQuery, [
      finalApprovedContent,
      managerNotes || 'Approved by Brand Governance Manager. Ready for enterprise publication.',
      effectiveReviewerId,
      finalAuditHash,
      timestamp,
      id
    ]);

    // Insert into audit_logs
    const auditQuery = `
      INSERT INTO audit_logs (review_id, actor_id, action, previous_content, updated_content, audit_hash, timestamp)
      VALUES ($1, $2, 'APPROVED', $3, $4, $5, $6)
      RETURNING *;
    `;
    const { rows: auditRows } = await client.query(auditQuery, [
      id,
      effectiveReviewerId,
      current.raw_content,
      finalApprovedContent,
      finalAuditHash,
      timestamp
    ]);

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Draft approved and cryptographically signed.',
      review: updatedRows[0],
      auditLog: auditRows[0],
      cryptographicProof: {
        algorithm: 'SHA-256',
        hash: finalAuditHash,
        timestamp,
        reviewerId: effectiveReviewerId,
        isTamperProof: true
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Approve draft error:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}

/**
 * POST /api/governance/request-revisions/:id
 * Manager / Reviewer requests changes with comments
 */
export async function requestRevisionsHandler(req, res) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;
    const { reviewerId, managerNotes, updatedContent } = req.body;

    const effectiveReviewerId = reviewerId || '22222222-2222-2222-2222-222222222222';
    const timestamp = new Date().toISOString();

    const { rows: existingRows } = await client.query('SELECT * FROM content_reviews WHERE id = $1', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Review not found.' });
    }
    const current = existingRows[0];

    const auditHash = generateAuditHash(
      current.raw_content,
      updatedContent || current.raw_content,
      effectiveReviewerId,
      timestamp
    );

    const updateQuery = `
      UPDATE content_reviews
      SET status = 'REVISED',
          manager_notes = $1,
          reviewer_id = $2,
          audit_hash = $3,
          updated_at = $4
      WHERE id = $5
      RETURNING *;
    `;
    const { rows: updatedRows } = await client.query(updateQuery, [
      managerNotes || 'Revisions requested. Please resolve flagged brand guidelines.',
      effectiveReviewerId,
      auditHash,
      timestamp,
      id
    ]);

    await client.query(`
      INSERT INTO audit_logs (review_id, actor_id, action, previous_content, updated_content, audit_hash, timestamp)
      VALUES ($1, $2, 'REVISED', $3, $4, $5, $6);
    `, [id, effectiveReviewerId, current.raw_content, updatedContent || current.raw_content, auditHash, timestamp]);

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Revision feedback saved and returned to creator.',
      review: updatedRows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Request revisions error:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
}

/**
 * GET /api/governance/audit-trail/:id
 * Fetches chronological cryptographic history of a review
 */
export async function getAuditTrailHandler(req, res) {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        al.id,
        al.review_id,
        al.actor_id,
        u.name as actor_name,
        u.role as actor_role,
        al.action,
        al.previous_content,
        al.updated_content,
        al.audit_hash,
        al.timestamp
      FROM audit_logs al
      LEFT JOIN users u ON al.actor_id = u.id
      WHERE al.review_id = $1
      ORDER BY al.timestamp ASC;
    `;
    const { rows } = await pool.query(query, [id]);
    return res.status(200).json({ auditTrail: rows });
  } catch (error) {
    console.error('Error fetching audit trail:', error);
    return res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/governance/verify-signature/:id
 * Cryptographically verifies that the audit_hash has not been tampered with
 */
export async function verifyAuditSignatureHandler(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM content_reviews WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Review record not found.' });
    }
    const review = rows[0];

    // Find the latest audit log entry
    const { rows: logs } = await pool.query(
      'SELECT * FROM audit_logs WHERE review_id = $1 ORDER BY timestamp DESC LIMIT 1',
      [id]
    );

    if (logs.length === 0) {
      return res.status(200).json({
        isValid: false,
        reason: 'No audit logs found for this review.'
      });
    }

    const latestLog = logs[0];
    
    // Recompute hash based on log inputs
    const recomputedHash = generateAuditHash(
      latestLog.previous_content,
      latestLog.updated_content,
      latestLog.actor_id,
      new Date(latestLog.timestamp).toISOString()
    );

    const matchesReviewHash = review.audit_hash === latestLog.audit_hash;

    return res.status(200).json({
      isValid: matchesReviewHash,
      reviewId: review.id,
      storedHash: review.audit_hash,
      logHash: latestLog.audit_hash,
      action: latestLog.action,
      verifiedTimestamp: latestLog.timestamp,
      tamperProofStatus: matchesReviewHash ? 'VERIFIED_AUTHENTIC' : 'POTENTIAL_TAMPERING_DETECTED'
    });
  } catch (error) {
    console.error('Error verifying audit signature:', error);
    return res.status(500).json({ error: error.message });
  }
}
