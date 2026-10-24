import { io } from 'socket.io-client';
import { BACKEND_URL } from './api.js';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.socket) return this.socket;

    // Connect to Render backend in production, or localhost/proxy in development
    this.socket = io(BACKEND_URL || '/', {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('⚡ Connected to BrandGuard AI WebSocket server.');
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('🔌 Disconnected from WebSocket server.');
    });

    return this.socket;
  }

  emitDraftType(text, cursorPosition) {
    if (!this.socket) this.connect();
    this.socket.emit('draft:type', {
      text,
      cursorPosition,
      timestamp: Date.now()
    });
  }

  emitPredictCompletion(text, cursorPosition) {
    if (!this.socket) this.connect();
    this.socket.emit('predict:completion', {
      text,
      cursorPosition
    });
  }

  onViolationsPrecheck(callback) {
    if (!this.socket) this.connect();
    this.socket.on('violations:precheck', callback);
  }

  onViolationsUpdate(callback) {
    if (!this.socket) this.connect();
    this.socket.on('violations:update', callback);
  }

  onCompletionSuggest(callback) {
    if (!this.socket) this.connect();
    this.socket.on('completion:suggest', callback);
  }

  onViolationsError(callback) {
    if (!this.socket) this.connect();
    this.socket.on('violations:error', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
