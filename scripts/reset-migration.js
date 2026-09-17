#!/usr/bin/env node
/**
 * SAS2COBOL — Migration Reset Utility
 * Cleans all generated migration outputs and workspace models
 * while preserving source files, tests, scripts, and observability configuration.
 * Initializes a fresh run for live observation.
 */

const fs = require('fs');
const path = require('path');
const eventBus = require('../observability/event-bus');

const REPO_ROOT = path.resolve(__dirname, '..');

const CLEAN_DIRS = [
  path.join(REPO_ROOT, 'workspace/phase-2-migration'),
  path.join(REPO_ROOT, 'workspace/phase-2-migration/adrs'),
  path.join(REPO_ROOT, 'output/cobol'),
  path.join(REPO_ROOT, 'output/copybooks'),
  path.join(REPO_ROOT, 'output/jcl'),
  path.join(REPO_ROOT, 'output/sql'),
  path.join(REPO_ROOT, 'output/data'),
  path.join(REPO_ROOT, 'output/traceability'),
  path.join(REPO_ROOT, 'output/review'),
  path.join(REPO_ROOT, 'output/manifests'),
  path.join(REPO_ROOT, 'output/documentation'),
  path.join(REPO_ROOT, 'output/reconciliation'),
];

console.log('=== SAS2COBOL Migration Reset ===');

let deletedCount = 0;
for (const dir of CLEAN_DIRS) {
  if (fs.existsSync(dir)) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      if (f.startsWith('.') || f === 'README.md') continue;
      const fullPath = path.join(dir, f);
      try {
        fs.rmSync(fullPath, { recursive: true, force: true });
        deletedCount++;
      } catch (err) {
        console.error(`Warning: could not delete ${fullPath}: ${err.message}`);
      }
    }
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
}

console.log(`Cleaned ${deletedCount} generated migration artifacts.`);

// Clean previous run execution logs from runs directory
const runsDir = path.join(REPO_ROOT, 'workspace/runs');
if (fs.existsSync(runsDir)) {
  const entries = fs.readdirSync(runsDir);
  for (const ent of entries) {
    if (ent.startsWith('RUN-') || ent === 'latest.json') {
      try {
        fs.rmSync(path.join(runsDir, ent), { recursive: true, force: true });
      } catch (e) {}
    }
  }
}

// Initialize a fresh run ID
const newRunId = eventBus.initRun(null, {
  sourceFile: 'input/sas/SYN_ENTERPRISE_SALES_MODERNIZATION.sas',
  phase: 'Phase 1 - Understand',
});

console.log(`Initialized fresh migration run: ${newRunId}`);
console.log('Live dashboard is active at: http://localhost:3210');
console.log('Ready for new migration run!');
