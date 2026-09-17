const fs = require('fs');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert');
const eventBus = require('../observability/event-bus');

// Use an isolated test run ID so running unit tests NEVER pollutes active demo/migration runs
const testRunId = `RUN-TEST-${Date.now()}`;

test('Observability Event Bus — Run Isolation & Event Emission', (t) => {
  const ev = eventBus.emitEvent({
    runId: testRunId,
    type: 'agent.started',
    actor: 'sas-analyst',
    agent: 'sas-analyst',
    message: 'Unit test agent dispatch verification',
    metadata: { phase: 1 },
  });

  assert.strictEqual(ev.type, 'agent.started');
  assert.strictEqual(ev.actor, 'sas-analyst');

  const snapshot = eventBus.getSnapshot(testRunId);
  assert.strictEqual(snapshot.runId, testRunId);
  assert.strictEqual(snapshot.agents['sas-analyst'].state, 'RUNNING');
});

test('Observability Event Bus — Blocked Agent Detection', (t) => {
  eventBus.emitEvent({
    runId: testRunId,
    type: 'agent.blocked',
    actor: 'migration-architect',
    agent: 'migration-architect',
    message: 'Agent migration-architect was blocked (unit test verification)',
    metadata: { error: 'Simulated unit test condition' },
  });

  const snapshot = eventBus.getSnapshot(testRunId);
  assert.strictEqual(snapshot.agents['migration-architect'].state, 'BLOCKED');
  assert.ok(snapshot.agents['migration-architect'].error.includes('Simulated unit test'));

  // Clean up isolated test run artifact directory
  const testDir = path.resolve(__dirname, '../workspace/runs', testRunId);
  if (fs.existsSync(testDir)) {
    try {
      fs.rmSync(testDir, { recursive: true, force: true });
    } catch (e) {}
  }
});
