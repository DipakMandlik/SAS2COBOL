const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const sasPath = path.resolve('input/sas/SYN_ENTERPRISE_SALES_MODERNIZATION.sas');
const code = fs.readFileSync(sasPath, 'utf8');
const lines = code.split(/\r?\n/);

console.log('Total lines:', lines.length);
const hash = crypto.createHash('sha256').update(fs.readFileSync(sasPath)).digest('hex');
console.log('SHA256:', hash);

// Parse steps
const steps = [];
let current = null;

for (let i = 0; i < lines.length; i++) {
  const lineNum = i + 1;
  const line = lines[i].trim();

  // global/options check
  if (lineNum === 8) {
    steps.push({ stepId: 'STEP-001', type: 'GLOBAL', name: 'GLOBAL_OPTIONS', startLine: 8, endLine: 17 });
  }
  if (lineNum === 18) {
    steps.push({ stepId: 'STEP-002', type: 'GLOBAL', name: 'MACRO_DEF_SET_RUN_CONTEXT', startLine: 18, endLine: 22 });
  }
  if (lineNum === 24) {
    steps.push({ stepId: 'STEP-003', type: 'GLOBAL', name: 'MACRO_DEF_CHOOSE_PERIOD', startLine: 24, endLine: 38 });
  }
  if (lineNum === 40) {
    steps.push({ stepId: 'STEP-004', type: 'MACRO_CALL', name: '%set_run_context', startLine: 40, endLine: 40 });
  }
  if (lineNum === 41) {
    steps.push({ stepId: 'STEP-005', type: 'MACRO_CALL', name: '%choose_period', startLine: 41, endLine: 41 });
  }

  // Inside macro definitions for build_region_report and parameterized_filter:
  if (lineNum === 331) {
    steps.push({ stepId: 'STEP-044', type: 'GLOBAL', name: 'MACRO_DEF_BUILD_REGION_REPORT', startLine: 331, endLine: 343 });
  }
  if (lineNum === 345) {
    steps.push({ stepId: 'STEP-045', type: 'MACRO_CALL', name: '%build_region_report', startLine: 345, endLine: 345 });
  }
  if (lineNum === 492) {
    steps.push({ stepId: 'STEP-064', type: 'GLOBAL', name: 'MACRO_DEF_PARAMETERIZED_FILTER', startLine: 492, endLine: 500 });
  }
  if (lineNum === 501) {
    steps.push({ stepId: 'STEP-065', type: 'MACRO_CALL', name: '%parameterized_filter', startLine: 501, endLine: 505 });
  }

  // Data or Proc steps outside macro definitions
  const dataMatch = line.match(/^data\s+([a-zA-Z0-9_\.]+)/i);
  if (dataMatch && !current) {
    current = { type: 'DATA', name: dataMatch[1], startLine: lineNum, text: [] };
  }

  const procMatch = line.match(/^proc\s+([a-zA-Z0-9_]+)/i);
  if (procMatch && !current) {
    current = { type: 'PROC', name: procMatch[1].toUpperCase(), startLine: lineNum, text: [] };
  }

  if (current) {
    current.text.push(line);
    if (line.match(/^run\s*;/i) || line.match(/^quit\s*;/i)) {
      current.endLine = lineNum;
      steps.push(current);
      current = null;
    }
  }
}

// Sort steps by startLine
steps.sort((a, b) => a.startLine - b.startLine);

// Assign stable step IDs
let stepIdx = 1;
for (const s of steps) {
  s.stepId = `STEP-${String(stepIdx++).padStart(3, '0')}`;
}

console.log('Total registered steps:', steps.length);
const dataCount = steps.filter(s => s.type === 'DATA').length;
const procCount = steps.filter(s => s.type === 'PROC').length;
const macroCount = steps.filter(s => s.type === 'MACRO_CALL').length;
const globalCount = steps.filter(s => s.type === 'GLOBAL').length;

console.log({ total: steps.length, dataCount, procCount, macroCount, globalCount });
fs.writeFileSync('scripts/parsed-steps.json', JSON.stringify(steps, null, 2));
