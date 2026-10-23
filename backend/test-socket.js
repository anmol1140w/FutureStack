import { io } from 'socket.io-client';

console.log('--- Testing BrandGuard AI Version 2 WebSocket Stream ---');

const socket = io('http://localhost:5000', {
  transports: ['websocket']
});

let precheckReceived = false;
let updateReceived = false;
let completionReceived = false;

socket.on('connect', () => {
  console.log('✅ Connected to WebSocket server with socket ID:', socket.id);

  const testText = "Get 50% off everything today! FreshBite is India's best food app.";
  console.log('Sending draft:type event with copy:', testText);
  socket.emit('draft:type', {
    text: testText,
    cursorPosition: testText.length,
    timestamp: Date.now()
  });
});

socket.on('violations:precheck', (data) => {
  console.log('⚡ Received violations:precheck:');
  console.log(`   Tier 1 latency: ${data.latencyMs}ms (Target: <10ms)`);
  console.log(`   Intent classified: ${data.intent}`);
  console.log(`   Tier 1 issues count: ${data.tier1Findings.length}`);
  precheckReceived = true;
});

socket.on('violations:update', (data) => {
  console.log('🤖 Received violations:update (3-Step Agentic Workflow):');
  console.log(`   Status: ${data.status}`);
  console.log(`   Compliance Score: ${data.complianceScore}%`);
  console.log(`   Total issues: ${data.stats.totalIssues}`);
  console.log(`   Triage latency: ${data.agentBreakdown?.triageAgent?.latencyMs}ms`);
  console.log(`   RAG latency: ${data.agentBreakdown?.ragAgent?.latencyMs}ms`);
  console.log(`   Verifier latency: ${data.agentBreakdown?.verifierAgent?.latencyMs}ms`);
  console.log(`   Total pipeline time: ${data.agentBreakdown?.totalPipelineMs}ms`);
  console.log('   Findings:');
  data.findings.forEach((f, i) => {
    console.log(`     [${i + 1}] [${f.category}] "${f.flaggedText}" -> Fix: "${f.suggestedCorrection}" (Citation: ${f.citationId})`);
  });
  updateReceived = true;
});

socket.on('completion:suggest', (data) => {
  console.log('✨ Received completion:suggest (Predictive Ghost-Text):');
  console.log(`   Suggestion: "${data.suggestion}"`);
  completionReceived = true;

  if (precheckReceived && updateReceived && completionReceived) {
    console.log('\n🎉 ALL Version 2 WebSocket and Agentic tests passed successfully!');
    socket.disconnect();
    process.exit(0);
  }
});

setTimeout(() => {
  if (!updateReceived || !completionReceived) {
    console.error('❌ Timeout waiting for WebSocket events.');
    socket.disconnect();
    process.exit(1);
  }
}, 5000);
