import { Server as SocketIOServer } from 'socket.io';
import { runAgenticPipeline } from '../agents/pipeline.js';
import { runTriageAgent } from '../agents/triageAgent.js';
import { getAutocompleteSuggestion } from '../agents/autocompleteService.js';
import { searchGuidelines } from '../services/ragService.js';

/**
 * Initializes and binds WebSocket server to HTTP server
 * @param {import('http').Server} httpServer
 */
export function initWebSocketServer(httpServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    pingTimeout: 30000,
    pingInterval: 10000
  });

  io.on('connection', (socket) => {
    console.log(`⚡ WebSocket client connected: ${socket.id}`);

    // Track active requests to discard stale async agent responses
    let latestDraftTimestamp = 0;

    /**
     * Event: draft:type
     * Receives debounced text stream from frontend editor
     */
    socket.on('draft:type', async (data) => {
      const { text = '', cursorPosition = 0, timestamp = Date.now() } = data || {};
      latestDraftTimestamp = timestamp;

      try {
        // Fast Tier 1 synchronous pre-check streamed back immediately (<10ms)
        const fastTriage = await runTriageAgent(text);
        
        socket.emit('violations:precheck', {
          timestamp,
          tier1Findings: fastTriage.tier1Findings,
          latencyMs: fastTriage.tier1ExecutionTimeMs,
          intent: fastTriage.intent
        });

        // Run full 3-step agentic pipeline
        const agenticResult = await runAgenticPipeline(text);

        // Only emit if this is still the most recent typing event
        if (timestamp >= latestDraftTimestamp) {
          socket.emit('violations:update', {
            timestamp,
            ...agenticResult
          });

          // Concurrently push brand-compliant predictive autocompletion
          const completion = await getAutocompleteSuggestion(text, agenticResult.retrievedGuidelines);
          socket.emit('completion:suggest', {
            timestamp,
            suggestion: completion,
            cursorPosition
          });
        }
      } catch (err) {
        console.error('[WebSocket] Error processing draft:type:', err);
        socket.emit('violations:error', { error: err.message });
      }
    });

    /**
     * Event: predict:completion
     * Explicit request for inline ghost-text completion
     */
    socket.on('predict:completion', async (data) => {
      const { text = '', cursorPosition = 0 } = data || {};
      try {
        const topGuidelines = await searchGuidelines(text, 2);
        const suggestion = await getAutocompleteSuggestion(text, topGuidelines);
        
        socket.emit('completion:suggest', {
          suggestion,
          cursorPosition
        });
      } catch (err) {
        console.error('[WebSocket] Error in predict:completion:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 WebSocket client disconnected: ${socket.id}`);
    });
  });

  return io;
}
