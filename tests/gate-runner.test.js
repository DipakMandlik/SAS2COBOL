const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('crypto');
const { validateSchema, validatePhase1, validatePhase2, validatePhase3 } = require('../.claude/hooks/gate-validator.js');

function createValidPhase1Mock(tmpDir) {
  const p1Dir = path.join(tmpDir, 'workspace', 'phase-1-understanding');
  const sasDir = path.join(tmpDir, 'input', 'sas');
  fs.mkdirSync(p1Dir, { recursive: true });
  fs.mkdirSync(sasDir, { recursive: true });

  const testSasFile = path.join(sasDir, 'test.sas');
  const sasCode = "DATA WORK.INPUT_DATA;\n  INPUT CUST_ID $ AMOUNT;\nRUN;\nPROC SORT DATA=WORK.INPUT_DATA OUT=WORK.SORTED_DATA;\n  BY CUST_ID;\nRUN;\n";
  fs.writeFileSync(testSasFile, sasCode, 'utf8');
  const fileHash = crypto.createHash('sha256').update(fs.readFileSync(testSasFile)).digest('hex');

  fs.writeFileSync(path.join(p1Dir, 'source-inventory.json'), JSON.stringify({
    files: [{
      fileId: 'SRC-001',
      filePath: 'input/sas/test.sas',
      linesOfCode: 6,
      sha256: fileHash,
      macroDefinitions: [],
      steps: [
        { stepId: 'STEP-001', type: 'DATA', name: 'WORK.INPUT_DATA', startLine: 1, endLine: 3 },
        { stepId: 'PROC-001', type: 'PROC', name: 'SORT', startLine: 4, endLine: 6 }
      ]
    }],
    totals: { totalFiles: 1, totalLines: 6, totalDataSteps: 1, totalProcSteps: 1 }
  }, null, 2));

  fs.writeFileSync(path.join(p1Dir, 'physical-data-model.json'), JSON.stringify({
    datasets: [
      {
        datasetId: 'DATA-001',
        datasetName: 'WORK.INPUT_DATA',
        library: 'WORK',
        isPermanent: false,
        schemaStatus: 'COMPLETE',
        producerStepId: 'STEP-001',
        variables: [
          { fieldId: 'FIELD-001', name: 'CUST_ID', type: 'CHAR', semanticRole: 'BUSINESS_IDENTIFIER' },
          { fieldId: 'FIELD-002', name: 'AMOUNT', type: 'NUM', semanticRole: 'MEASURE' }
        ]
      },
      {
        datasetId: 'DATA-002',
        datasetName: 'WORK.SORTED_DATA',
        library: 'WORK',
        isPermanent: false,
        schemaStatus: 'COMPLETE',
        producerStepId: 'PROC-001',
        variables: [
          { fieldId: 'FIELD-003', name: 'CUST_ID', type: 'CHAR', semanticRole: 'BUSINESS_IDENTIFIER' }
        ],
        sortKeys: [{ name: 'CUST_ID', direction: 'ASC' }]
      }
    ]
  }, null, 2));

  fs.writeFileSync(path.join(p1Dir, 'proc-semantic-catalog.json'), JSON.stringify({
    procs: [{
      procId: 'PROC-001',
      stepId: 'PROC-001',
      procName: 'SORT',
      inputDatasets: ['WORK.INPUT_DATA'],
      outputDatasets: ['WORK.SORTED_DATA'],
      semanticOperations: ['SORTING'],
      byVariables: ['CUST_ID'],
      shapeTransformation: 'REORDERED'
    }]
  }, null, 2));

  fs.writeFileSync(path.join(p1Dir, 'dependency-graph.json'), JSON.stringify({
    nodes: [
      { id: 'DATA-001', type: 'DATASET', label: 'WORK.INPUT_DATA' },
      { id: 'PROC-001', type: 'STEP', label: 'PROC SORT' },
      { id: 'DATA-002', type: 'DATASET', label: 'WORK.SORTED_DATA' }
    ],
    edges: [
      { edgeId: 'DEP-001', from: 'DATA-001', to: 'PROC-001', relation: 'READS' },
      { edgeId: 'DEP-002', from: 'PROC-001', to: 'DATA-002', relation: 'WRITES' }
    ],
    executionSequence: ['STEP-001', 'PROC-001']
  }, null, 2));

  fs.writeFileSync(path.join(p1Dir, 'sas-traps-ledger.json'), JSON.stringify({
    traps: [{
      trapId: 'TRAP-001',
      stepId: 'STEP-001',
      category: 'MISSING_VALUE_COMPARISON',
      line: 2,
      description: 'Check missing values in amount',
      mitigation: 'Implement 88-level sentinel guard'
    }]
  }, null, 2));

  fs.writeFileSync(path.join(p1Dir, 'business-rules.json'), JSON.stringify({
    rules: [{
      ruleId: 'RULE-001',
      description: 'Order customer records by ID',
      sourceReference: {
        file: 'input/sas/test.sas',
        startLine: 4,
        endLine: 6,
        stepId: 'PROC-001'
      },
      ruleType: 'SORTING',
      affectedDatasets: ['WORK.SORTED_DATA'],
      affectedFields: ['CUST_ID'],
      condition: 'INPUT DATASET LOADED',
      action: 'SORT BY CUST_ID ASCENDING',
      evidence: 'BY CUST_ID;',
      confidence: 'KNOWN'
    }]
  }, null, 2));

  fs.writeFileSync(path.join(p1Dir, 'semantic-model.json'), JSON.stringify({
    modelId: 'SEM-MDL-001',
    operations: [{
      operationId: 'SEM-001',
      stepId: 'PROC-001',
      type: 'SORT_OPERATION',
      inputs: ['WORK.INPUT_DATA'],
      outputs: ['WORK.SORTED_DATA'],
      groupKeys: ['CUST_ID'],
      businessRuleIds: ['RULE-001'],
      sourceReference: {
        file: 'input/sas/test.sas',
        startLine: 4,
        endLine: 6
      },
      uncertaintyStatus: 'KNOWN'
    }]
  }, null, 2));

  fs.writeFileSync(path.join(p1Dir, 'uncertainty-assumptions-register.json'), JSON.stringify({
    items: [{
      id: 'ASM-001',
      kind: 'ASSUMPTION',
      stepId: 'STEP-001',
      description: 'Input dataset encoding is standard UTF-8',
      impact: 'LOW',
      status: 'RESOLVED'
    }]
  }, null, 2));

  fs.writeFileSync(path.join(p1Dir, 'phase-1-review.json'), JSON.stringify({
    reviewId: 'REV-001',
    reviewer: { agent: 'quality-auditor', timestamp: '2026-09-17T12:00:00Z' },
    reviewedArtifacts: [
      'source-inventory.json',
      'physical-data-model.json',
      'proc-semantic-catalog.json',
      'dependency-graph.json',
      'sas-traps-ledger.json',
      'business-rules.json',
      'semantic-model.json',
      'uncertainty-assumptions-register.json'
    ],
    findings: [],
    traceabilityAssessment: { status: 'COMPLETE', coveragePercentage: 100.0 },
    referentialIntegrityAssessment: { status: 'PASSED' },
    uncertaintyAssessment: { openCriticalCount: 0, status: 'ACCEPTABLE' },
    overallDisposition: 'APPROVED',
    blockers: []
  }, null, 2));
}

describe('Quality Gate Validator Suite — Hardened Framework', () => {
  const tmpDir = path.join(__dirname, 'tmp-gate-test');

  beforeEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  after(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  test('Gate 1 fails when input/sas/ contains no SAS source files (MISSING_PRIMARY_SOURCE)', () => {
    fs.mkdirSync(path.join(tmpDir, 'input', 'sas'), { recursive: true });
    const results = validatePhase1(tmpDir);
    const srcFail = results.find(r => r.code === 'MISSING_PRIMARY_SOURCE');
    assert.ok(srcFail, 'Should report MISSING_PRIMARY_SOURCE when input/sas/ is empty');
  });

  test('Gate 1 fails when any of the 9 required artifacts is missing', () => {
    createValidPhase1Mock(tmpDir);
    // Delete business-rules.json
    fs.unlinkSync(path.join(tmpDir, 'workspace', 'phase-1-understanding', 'business-rules.json'));
    const results = validatePhase1(tmpDir);
    const missingFail = results.find(r => r.check === 'business-rules.json' && !r.passed);
    assert.ok(missingFail, 'Should fail when business-rules.json is missing');
  });

  test('Gate 1 deep schema validation catches invalid nested types and enum values', () => {
    createValidPhase1Mock(tmpDir);
    const p1Dir = path.join(tmpDir, 'workspace', 'phase-1-understanding');

    // Mutate business-rules.json with invalid enum
    const rules = JSON.parse(fs.readFileSync(path.join(p1Dir, 'business-rules.json'), 'utf8'));
    rules.rules[0].ruleType = 'INVALID_RULE_TYPE';
    fs.writeFileSync(path.join(p1Dir, 'business-rules.json'), JSON.stringify(rules));

    const results = validatePhase1(tmpDir);
    const enumFail = results.find(r => r.check === 'business-rules.json' && r.code === 'INVALID_ENUM_VALUE');
    assert.ok(enumFail, 'Should detect INVALID_ENUM_VALUE in business-rules.json');
  });

  test('Gate 1 deep schema validation catches invalid stable ID patterns', () => {
    createValidPhase1Mock(tmpDir);
    const p1Dir = path.join(tmpDir, 'workspace', 'phase-1-understanding');

    // Mutate source-inventory.json with invalid fileId format
    const inv = JSON.parse(fs.readFileSync(path.join(p1Dir, 'source-inventory.json'), 'utf8'));
    inv.files[0].fileId = 'INVALID_ID_FORMAT_123';
    fs.writeFileSync(path.join(p1Dir, 'source-inventory.json'), JSON.stringify(inv));

    const results = validatePhase1(tmpDir);
    const idFail = results.find(r => r.check === 'source-inventory.json' && r.code === 'INVALID_ID_FORMAT');
    assert.ok(idFail, 'Should detect INVALID_ID_FORMAT in source-inventory.json');
  });

  test('Gate 1 detects source drift when file hash differs from recorded hash', () => {
    createValidPhase1Mock(tmpDir);
    // Mutate the physical SAS file after inventory was created
    const sasFile = path.join(tmpDir, 'input', 'sas', 'test.sas');
    fs.appendFileSync(sasFile, '/* Tampered Comment */\n');

    const results = validatePhase1(tmpDir);
    const driftFail = results.find(r => r.code === 'SOURCE_INTEGRITY_FAILED');
    assert.ok(driftFail, 'Should detect SOURCE_DRIFT_DETECTED when source hash mismatches');
  });

  test('Gate 1 referential integrity catches unknown dataset references', () => {
    createValidPhase1Mock(tmpDir);
    const p1Dir = path.join(tmpDir, 'workspace', 'phase-1-understanding');

    // Mutate proc-semantic-catalog to reference an unknown dataset
    const procs = JSON.parse(fs.readFileSync(path.join(p1Dir, 'proc-semantic-catalog.json'), 'utf8'));
    procs.procs[0].inputDatasets = ['WORK.UNKNOWN_NONEXISTENT_DATASET'];
    fs.writeFileSync(path.join(p1Dir, 'proc-semantic-catalog.json'), JSON.stringify(procs));

    const results = validatePhase1(tmpDir);
    const refFail = results.find(r => r.code === 'UNKNOWN_DATASET_REFERENCE');
    assert.ok(refFail, 'Should detect UNKNOWN_DATASET_REFERENCE when PROC references unregistered dataset');
  });

  test('Gate 1 blocks on open CRITICAL uncertainty items', () => {
    createValidPhase1Mock(tmpDir);
    const p1Dir = path.join(tmpDir, 'workspace', 'phase-1-understanding');

    // Add an open CRITICAL blocker to uncertainty register
    const unc = JSON.parse(fs.readFileSync(path.join(p1Dir, 'uncertainty-assumptions-register.json'), 'utf8'));
    unc.items.push({
      id: 'BLK-001',
      kind: 'BLOCKED',
      stepId: 'STEP-001',
      description: 'Critical missing external database definition',
      impact: 'CRITICAL',
      status: 'OPEN'
    });
    fs.writeFileSync(path.join(p1Dir, 'uncertainty-assumptions-register.json'), JSON.stringify(unc));

    const results = validatePhase1(tmpDir);
    const blockFail = results.find(r => r.code === 'CRITICAL_UNCERTAINTY_BLOCKER');
    assert.ok(blockFail, 'Should block Gate 1 when open CRITICAL uncertainty exists');
  });

  test('Gate 1 blocks when Independent Phase 1 Review is REJECTED', () => {
    createValidPhase1Mock(tmpDir);
    const p1Dir = path.join(tmpDir, 'workspace', 'phase-1-understanding');

    // Set review disposition to REJECTED with a blocker
    const rev = JSON.parse(fs.readFileSync(path.join(p1Dir, 'phase-1-review.json'), 'utf8'));
    rev.overallDisposition = 'REJECTED';
    rev.blockers = ['Lineage loop detected'];
    fs.writeFileSync(path.join(p1Dir, 'phase-1-review.json'), JSON.stringify(rev));

    const results = validatePhase1(tmpDir);
    const revFail = results.find(r => r.code === 'REVIEW_NOT_APPROVED');
    assert.ok(revFail, 'Should block Gate 1 when Phase 1 review is not approved');
  });

  test('Gate 1 passes completely when all 9 artifacts, schemas, hashes, and references are valid', () => {
    createValidPhase1Mock(tmpDir);
    const results = validatePhase1(tmpDir);
    const failures = results.filter(r => !r.passed);
    assert.strictEqual(failures.length, 0, `All Phase 1 checks should pass, failed: ${JSON.stringify(failures, null, 2)}`);
  });

  test('Phase 2 validation halts if Phase 1 prerequisite fails', () => {
    // Only Phase 2 directory created, Phase 1 empty
    fs.mkdirSync(path.join(tmpDir, 'workspace', 'phase-2-migration'), { recursive: true });
    const results = validatePhase2(tmpDir);
    const prereqFail = results.find(r => r.code === 'PHASE_1_PREREQUISITE_FAILED');
    assert.ok(prereqFail, 'Phase 2 must halt if Phase 1 prerequisite fails');
  });
});
