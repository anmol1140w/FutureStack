import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './db/index.js';
import { seedGuidelines } from './db/seed.js';
import { initWebSocketServer } from './websocket/server.js';
import {
  createGuidelineHandler,
  getGuidelinesHandler,
  searchGuidelinesHandler
} from './controllers/guidelinesController.js';
import {
  checkContentHandler,
  getReviewByIdHandler,
  getAllReviewsHandler
} from './controllers/reviewController.js';
import {
  getUsersHandler,
  submitDraftHandler,
  getApprovalQueueHandler,
  approveDraftHandler,
  requestRevisionsHandler,
  getAuditTrailHandler,
  verifyAuditSignatureHandler
} from './controllers/governanceController.js';
import { getAnalyticsDashboardHandler } from './controllers/analyticsController.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize WebSocket infrastructure
export const io = initWebSocketServer(server);

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'BrandGuard AI Core Engine (V3 Enterprise Governance & Analytics)',
    version: '3.0.0',
    timestamp: new Date().toISOString()
  });
});

// Brand Guidelines API
app.post('/api/guidelines', createGuidelineHandler);
app.get('/api/guidelines', getGuidelinesHandler);
app.get('/api/guidelines/search', searchGuidelinesHandler);

// Content Review & Multi-Tier Inspection API
app.post('/api/check-content', checkContentHandler);
app.get('/api/reviews', getAllReviewsHandler);
app.get('/api/reviews/:id', getReviewByIdHandler);

// Version 3: Multi-Role Governance & Approval Queue API
app.get('/api/governance/users', getUsersHandler);
app.post('/api/governance/submit', submitDraftHandler);
app.get('/api/governance/queue', getApprovalQueueHandler);
app.post('/api/governance/approve/:id', approveDraftHandler);
app.post('/api/governance/request-revisions/:id', requestRevisionsHandler);
app.get('/api/governance/audit-trail/:id', getAuditTrailHandler);
app.get('/api/governance/verify-signature/:id', verifyAuditSignatureHandler);

// Version 3: Brand Governance Analytics API
app.get('/api/analytics/dashboard', getAnalyticsDashboardHandler);

// Start server after DB initialization
async function startServer() {
  try {
    await initDatabase();
    await seedGuidelines();

    server.listen(PORT, () => {
      console.log(`🚀 BrandGuard AI Backend (V3 Enterprise Governance) running on http://localhost:${PORT}`);
      console.log(`   • WebSockets endpoint: ws://localhost:${PORT}`);
      console.log(`   • Governance Queue: http://localhost:${PORT}/api/governance/queue`);
      console.log(`   • Analytics Dashboard: http://localhost:${PORT}/api/analytics/dashboard`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
