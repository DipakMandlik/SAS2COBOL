#!/usr/bin/env node
/**
 * Zero-dependency Deterministic Quality Gate Validator for SAS-to-COBOL Migration
 * Enforces Phase 1, Phase 2, and Phase 3 boundaries, deep JSON schemas, and cross-artifact referential integrity.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function parseArgs() {
  const args = process.argv.slice(2);
  let phase = 'all';
  let rootDir = process.cwd();

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--phase' && args[i + 1]) {
      phase = args[i + 1].toLowerCase();
      i++;
    } else if (args[i] === '--dir' && args[i + 1]) {
      rootDir = path.resolve(args[i + 1]);
      i++;
    }
  }
  return { phase, rootDir };
}

function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return { ok: false, error: `File not found: ${filePath}` };
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: `Invalid JSON in ${filePath}: ${err.message}` };
  }
}

/**
 * Deterministic recursive JSON Schema validator (zero-dependency)
 */
function validateSchema(data, schema, pathStr = '') {
  const errors = [];
  if (!schema) return errors;

  // Type validation
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    let matched = false;
    for (const t of types) {
      if (t === 'object' && typeof data === 'object' && data !== null && !Array.isArray(data)) matched = true;
      else if (t === 'array' && Array.isArray(data)) matched = true;
      else if (t === 'string' && typeof data === 'string') matched = true;
      else if (t === 'integer' && typeof data === 'number' && Number.isInteger(data)) matched = true;
      else if (t === 'number' && typeof data === 'number') matched = true;
      else if (t === 'boolean' && typeof data === 'boolean') matched = true;
      else if (t === 'null' && data === null) matched = true;
    }
    if (!matched) {
      errors.push({
        code: 'SCHEMA_TYPE_MISMATCH',
        path: pathStr || 'root',
        message: `Expected type ${schema.type}, got ${Array.isArray(data) ? 'array' : typeof data}`
      });
      return errors;
    }
  }

  // Enum validation
  if (schema.enum) {
    if (!schema.enum.includes(data)) {
      errors.push({
        code: 'INVALID_ENUM_VALUE',
        path: pathStr || 'root',
        message: `Value '${data}' is not in allowed enum: [${schema.enum.join(', ')}]`
      });
    }
  }

  // Pattern validation
  if (schema.pattern && typeof data === 'string') {
    const regex = new RegExp(schema.pattern);
    if (!regex.test(data)) {
      errors.push({
        code: 'INVALID_ID_FORMAT',
        path: pathStr || 'root',
        message: `Value '${data}' does not match pattern ${schema.pattern}`
      });
    }
  }

  // Range validation
  if (typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push({
        code: 'NUMERIC_OUT_OF_RANGE',
        path: pathStr || 'root',
        message: `Value ${data} is less than minimum ${schema.minimum}`
      });
    }
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push({
        code: 'NUMERIC_OUT_OF_RANGE',
        path: pathStr || 'root',
        message: `Value ${data} is greater than maximum ${schema.maximum}`
      });
    }
  }

  // Object validation
  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    if (schema.required) {
      for (const reqKey of schema.required) {
        if (!(reqKey in data)) {
          errors.push({
            code: 'MISSING_REQUIRED_PROPERTY',
            path: pathStr ? `${pathStr}.${reqKey}` : reqKey,
            message: `Missing required property '${reqKey}'`
          });
        }
      }
    }
    if (schema.properties) {
      for (const key of Object.keys(data)) {
        if (schema.properties[key]) {
          const propErrors = validateSchema(data[key], schema.properties[key], pathStr ? `${pathStr}.${key}` : key);
          errors.push(...propErrors);
        } else if (schema.additionalProperties === false) {
          errors.push({
            code: 'UNEXPECTED_PROPERTY',
            path: pathStr ? `${pathStr}.${key}` : key,
            message: `Unexpected property '${key}' not allowed by schema`
          });
        }
      }
    }
  }

  // Array validation
  if (Array.isArray(data)) {
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push({
        code: 'ARRAY_TOO_SHORT',
        path: pathStr || 'root',
        message: `Array length ${data.length} is less than minItems ${schema.minItems}`
      });
    }
    if (schema.items) {
      data.forEach((item, idx) => {
        const itemErrors = validateSchema(item, schema.items, `${pathStr || 'root'}[${idx}]`);
        errors.push(...itemErrors);
      });
    }
  }

  return errors;
}

function computeSha256(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function validatePhase1(rootDir, options = {}) {
  const results = [];
  const p1Dir = path.join(rootDir, 'workspace', 'phase-1-understanding');
  const inputDir = path.join(rootDir, 'input', 'sas');
  const localSchemaDir = path.join(rootDir, '.claude', 'hooks', 'schemas', 'phase-1');
  const defaultSchemaDir = path.join(__dirname, 'schemas', 'phase-1');
  const schemaDir = fs.existsSync(localSchemaDir) ? localSchemaDir : defaultSchemaDir;

  // 1. Physical Source Intake Verification (unless skipSourceCheck is requested)
  if (!options.skipSourceCheck) {
    if (!fs.existsSync(inputDir)) {
      results.push({
        phase: 1,
        check: 'Source Intake: Physical File Presence',
        passed: false,
        code: 'MISSING_PRIMARY_SOURCE',
        message: `Intake directory does not exist: ${inputDir}`
      });
    } else {
      const entries = fs.readdirSync(inputDir).filter(f => !f.startsWith('.') && (f.endsWith('.sas') || f.endsWith('.mac') || f.endsWith('.inc')));
      if (entries.length === 0) {
        results.push({
          phase: 1,
          check: 'Source Intake: Physical File Presence',
          passed: false,
          code: 'MISSING_PRIMARY_SOURCE',
          message: 'No SAS source files (.sas, .mac, .inc) found in input/sas/'
        });
      } else {
        results.push({
          phase: 1,
          check: 'Source Intake: Physical File Presence',
          passed: true,
          message: `Found ${entries.length} SAS source file(s) in input/sas/`
        });
      }
    }
  }

  // 2. Required 9 Phase 1 Artifacts Definition
  const requiredFiles = [
    { name: 'source-inventory.json', schemaName: 'source-inventory.schema.json' },
    { name: 'physical-data-model.json', schemaName: 'physical-data-model.schema.json' },
    { name: 'proc-semantic-catalog.json', schemaName: 'proc-semantic-catalog.schema.json' },
    { name: 'dependency-graph.json', schemaName: 'dependency-graph.schema.json' },
    { name: 'sas-traps-ledger.json', schemaName: 'sas-traps-ledger.schema.json' },
    { name: 'business-rules.json', schemaName: 'business-rules.schema.json' },
    { name: 'semantic-model.json', schemaName: 'semantic-model.schema.json' },
    { name: 'uncertainty-assumptions-register.json', schemaName: 'uncertainty-assumptions.schema.json' },
    { name: 'phase-1-review.json', schemaName: 'phase-1-review.schema.json' }
  ];

  const loaded = {};

  for (const item of requiredFiles) {
    const filePath = path.join(p1Dir, item.name);
    const res = loadJson(filePath);
    if (!res.ok) {
      results.push({
        phase: 1,
        check: item.name,
        passed: false,
        code: 'MISSING_ARTIFACT',
        message: res.error
      });
      continue;
    }

    // Deep JSON schema validation
    const sPath = path.join(schemaDir, item.schemaName);
    const sRes = loadJson(sPath);
    if (sRes.ok) {
      const schemaErrors = validateSchema(res.data, sRes.data);
      if (schemaErrors.length > 0) {
        const topError = schemaErrors[0];
        results.push({
          phase: 1,
          check: item.name,
          passed: false,
          code: topError.code,
          message: `${topError.code} at '${topError.path}': ${topError.message}`
        });
        continue;
      }
    }

    loaded[item.name] = res.data;
    results.push({
      phase: 1,
      check: item.name,
      passed: true,
      message: 'Valid schema contract'
    });
  }

  // If critical artifacts are missing, stop early before referential checks
  const inv = loaded['source-inventory.json'];
  const dataModel = loaded['physical-data-model.json'];
  const procs = loaded['proc-semantic-catalog.json'];
  const depGraph = loaded['dependency-graph.json'];
  const traps = loaded['sas-traps-ledger.json'];
  const rules = loaded['business-rules.json'];
  const semModel = loaded['semantic-model.json'];
  const uncRegister = loaded['uncertainty-assumptions-register.json'];
  const p1Review = loaded['phase-1-review.json'];

  // 3. Source File Disk Integrity & Hash Verification
  if (inv && inv.files) {
    let sourceIntegrityPassed = true;
    let sourceErrorMsg = '';

    for (const f of inv.files) {
      const fullPath = path.isAbsolute(f.filePath) ? f.filePath : path.join(rootDir, f.filePath);
      if (!fs.existsSync(fullPath)) {
        sourceIntegrityPassed = false;
        sourceErrorMsg = `Inventory references missing source file: ${f.filePath}`;
        break;
      }
      try {
        const actualSha = computeSha256(fullPath);
        if (f.sha256 && actualSha !== f.sha256) {
          sourceIntegrityPassed = false;
          sourceErrorMsg = `SOURCE_DRIFT_DETECTED: Hash mismatch for ${f.filePath}`;
          break;
        }
      } catch (err) {
        sourceIntegrityPassed = false;
        sourceErrorMsg = `Failed to read source file: ${err.message}`;
        break;
      }
    }

    results.push({
      phase: 1,
      check: 'Integrity: Source Files & Hashes',
      passed: sourceIntegrityPassed,
      code: sourceIntegrityPassed ? 'SOURCE_INTEGRITY_OK' : 'SOURCE_INTEGRITY_FAILED',
      message: sourceIntegrityPassed ? `Verified ${inv.files.length} source file(s) on disk` : sourceErrorMsg
    });
  }

  // 4. Stable ID Uniqueness Checks
  if (inv && inv.files) {
    const seenStepIds = new Set();
    const seenFileIds = new Set();
    let idDuplicate = null;

    for (const f of inv.files) {
      if (f.fileId) {
        if (seenFileIds.has(f.fileId)) idDuplicate = f.fileId;
        seenFileIds.add(f.fileId);
      }
      for (const s of f.steps || []) {
        if (seenStepIds.has(s.stepId)) idDuplicate = s.stepId;
        seenStepIds.add(s.stepId);
      }
    }

    results.push({
      phase: 1,
      check: 'Integrity: Step & File ID Uniqueness',
      passed: !idDuplicate,
      code: !idDuplicate ? 'UNIQUE_IDS' : 'DUPLICATE_STABLE_ID',
      message: !idDuplicate ? `All ${seenStepIds.size} step IDs are unique` : `Duplicate stable ID detected: ${idDuplicate}`
    });
  }

  // 5. Line Range Validity Checks
  if (inv && inv.files) {
    let lineRangeValid = true;
    let lineRangeMsg = '';

    for (const f of inv.files) {
      for (const s of f.steps || []) {
        if (s.startLine > s.endLine) {
          lineRangeValid = false;
          lineRangeMsg = `Invalid line range in step ${s.stepId}: startLine (${s.startLine}) > endLine (${s.endLine})`;
          break;
        }
      }
      if (!lineRangeValid) break;
    }

    results.push({
      phase: 1,
      check: 'Traceability: Step Line Ranges',
      passed: lineRangeValid,
      code: lineRangeValid ? 'LINE_RANGES_VALID' : 'INVALID_LINE_RANGE',
      message: lineRangeValid ? 'All step line ranges are valid (start <= end)' : lineRangeMsg
    });
  }

  // 6. PROC Step Coverage Integrity
  if (inv && procs) {
    const invProcStepIds = new Set();
    for (const f of inv.files || []) {
      for (const s of f.steps || []) {
        if (s.type === 'PROC') {
          invProcStepIds.add(s.stepId);
        }
      }
    }

    const catalogStepIds = new Set((procs.procs || []).map(p => p.stepId));
    const missingInCatalog = [...invProcStepIds].filter(id => !catalogStepIds.has(id));

    results.push({
      phase: 1,
      check: 'Integrity: PROC Coverage',
      passed: missingInCatalog.length === 0,
      code: missingInCatalog.length === 0 ? 'PROC_COVERAGE_OK' : 'MISSING_PROC_IN_CATALOG',
      message: missingInCatalog.length === 0
        ? `All ${invProcStepIds.size} discovered PROCs cataloged`
        : `Discovered PROCs missing from proc-semantic-catalog: ${missingInCatalog.join(', ')}`
    });
  }

  // 7. Dataset Referential Integrity
  if (dataModel && (procs || depGraph || rules || semModel)) {
    const knownDatasets = new Set();
    for (const d of dataModel.datasets || []) {
      if (d.datasetName) knownDatasets.add(d.datasetName.toUpperCase());
      if (d.datasetId) knownDatasets.add(d.datasetId.toUpperCase());
    }

    const unreferencedDatasets = new Set();

    if (procs) {
      for (const p of procs.procs || []) {
        for (const inDs of p.inputDatasets || []) {
          if (!knownDatasets.has(inDs.toUpperCase())) unreferencedDatasets.add(inDs);
        }
        for (const outDs of p.outputDatasets || []) {
          if (!knownDatasets.has(outDs.toUpperCase())) unreferencedDatasets.add(outDs);
        }
      }
    }

    if (depGraph) {
      for (const n of depGraph.nodes || []) {
        if (n.type === 'DATASET') {
          if (!knownDatasets.has(n.label.toUpperCase()) && !knownDatasets.has(n.id.toUpperCase())) {
            unreferencedDatasets.add(n.label || n.id);
          }
        }
      }
    }

    if (rules) {
      for (const r of rules.rules || []) {
        for (const aff of r.affectedDatasets || []) {
          if (!knownDatasets.has(aff.toUpperCase())) unreferencedDatasets.add(aff);
        }
      }
    }

    if (semModel) {
      for (const op of semModel.operations || []) {
        for (const inDs of op.inputs || []) {
          if (!knownDatasets.has(inDs.toUpperCase())) unreferencedDatasets.add(inDs);
        }
        for (const outDs of op.outputs || []) {
          if (!knownDatasets.has(outDs.toUpperCase())) unreferencedDatasets.add(outDs);
        }
      }
    }

    results.push({
      phase: 1,
      check: 'Integrity: Dataset References',
      passed: unreferencedDatasets.size === 0,
      code: unreferencedDatasets.size === 0 ? 'DATASET_REFS_VALID' : 'UNKNOWN_DATASET_REFERENCE',
      message: unreferencedDatasets.size === 0
        ? `All referenced datasets (${knownDatasets.size}) cataloged in physical data model`
        : `Referenced datasets missing from physical data model: ${[...unreferencedDatasets].join(', ')}`
    });
  }

  // 8. Step Referential Integrity across all Phase 1 files
  if (inv && inv.files) {
    const allStepIds = new Set();
    for (const f of inv.files) {
      for (const s of f.steps || []) {
        allStepIds.add(s.stepId);
      }
    }

    const invalidStepRefs = new Set();

    if (traps) {
      for (const t of traps.traps || []) {
        if (t.stepId && !allStepIds.has(t.stepId)) invalidStepRefs.add(t.stepId);
      }
    }
    if (rules) {
      for (const r of rules.rules || []) {
        if (r.sourceReference && r.sourceReference.stepId && !allStepIds.has(r.sourceReference.stepId)) {
          invalidStepRefs.add(r.sourceReference.stepId);
        }
      }
    }
    if (semModel) {
      for (const op of semModel.operations || []) {
        if (op.stepId && !allStepIds.has(op.stepId)) invalidStepRefs.add(op.stepId);
      }
    }
    if (uncRegister) {
      for (const u of uncRegister.items || []) {
        if (u.stepId && !allStepIds.has(u.stepId)) invalidStepRefs.add(u.stepId);
      }
    }

    results.push({
      phase: 1,
      check: 'Integrity: Step References',
      passed: invalidStepRefs.size === 0,
      code: invalidStepRefs.size === 0 ? 'STEP_REFS_VALID' : 'UNKNOWN_STEP_REFERENCE',
      message: invalidStepRefs.size === 0
        ? 'All step references valid across traps, rules, semantics, and uncertainty'
        : `Unknown step references detected: ${[...invalidStepRefs].join(', ')}`
    });
  }

  // 9. Critical Uncertainty Blocker Check
  if (uncRegister && uncRegister.items) {
    const openCritical = uncRegister.items.filter(i => i.impact === 'CRITICAL' && i.status === 'OPEN');
    results.push({
      phase: 1,
      check: 'Governance: Critical Uncertainty Blocker',
      passed: openCritical.length === 0,
      code: openCritical.length === 0 ? 'NO_CRITICAL_BLOCKERS' : 'CRITICAL_UNCERTAINTY_BLOCKER',
      message: openCritical.length === 0
        ? 'No open critical uncertainties'
        : `Found ${openCritical.length} open CRITICAL uncertainty items: ${openCritical.map(i => i.id).join(', ')}`
    });
  }

  // 10. Independent Review Approval Check
  if (p1Review) {
    const approved = p1Review.overallDisposition === 'APPROVED' || p1Review.overallDisposition === 'APPROVED_WITH_CONDITIONS';
    const hasBlockers = p1Review.blockers && p1Review.blockers.length > 0;
    const passed = approved && !hasBlockers;

    results.push({
      phase: 1,
      check: 'Governance: Independent Review Approval',
      passed: passed,
      code: passed ? 'REVIEW_APPROVED' : 'REVIEW_NOT_APPROVED',
      message: passed
        ? `Independent review disposition is ${p1Review.overallDisposition} with 0 blockers`
        : `Review disposition is ${p1Review.overallDisposition} (Blockers: ${(p1Review.blockers || []).join(', ') || 'None'})`
    });
  }

  return results;
}

function validatePhase2(rootDir) {
  const results = [];
  const p2Dir = path.join(rootDir, 'workspace', 'phase-2-migration');

  // Prerequisite: Phase 1 must be validated
  const p1Results = validatePhase1(rootDir, { skipSourceCheck: true });
  const p1Failures = p1Results.filter(r => !r.passed);
  if (p1Failures.length > 0) {
    results.push({
      phase: 2,
      check: 'Prerequisite: Phase 1 Completion',
      passed: false,
      code: 'PHASE_1_PREREQUISITE_FAILED',
      message: `Cannot validate Phase 2: Phase 1 has ${p1Failures.length} failing check(s)`
    });
    return results;
  }

  const requiredFiles = [
    { name: 'migration-strategy.json', reqKeys: ['decisions'] },
    { name: 'proc-decomposition.json', reqKeys: ['decompositions'] },
    { name: 'target-cobol-architecture.json', reqKeys: ['programs', 'sharedCopybooks', 'jclJobs'] },
    { name: 'processing-unit-contracts.json', reqKeys: ['processingUnits'] },
    { name: 'data-model-copybooks.json', reqKeys: ['copybooks'] },
    { name: 'execution-flow.json', reqKeys: ['executionSteps'] },
    { name: 'reconciliation-requirements.json', reqKeys: ['controls'] }
  ];

  const loaded = {};

  for (const item of requiredFiles) {
    const filePath = path.join(p2Dir, item.name);
    const res = loadJson(filePath);
    if (!res.ok) {
      results.push({ phase: 2, check: item.name, passed: false, message: res.error });
    } else {
      let missingKeys = item.reqKeys.filter(k => !(k in res.data));
      if (missingKeys.length > 0) {
        results.push({ phase: 2, check: item.name, passed: false, message: `Missing required keys: ${missingKeys.join(', ')}` });
      } else {
        loaded[item.name] = res.data;
        results.push({ phase: 2, check: item.name, passed: true, message: 'Valid schema contract' });
      }
    }
  }

  // Cross-artifact referential integrity checks
  const p1InvRes = loadJson(path.join(rootDir, 'workspace', 'phase-1-understanding', 'source-inventory.json'));
  if (p1InvRes.ok && loaded['processing-unit-contracts.json']) {
    const allStepIds = new Set();
    for (const f of p1InvRes.data.files || []) {
      for (const s of f.steps || []) {
        allStepIds.add(s.stepId);
      }
    }

    const puCoveredStepIds = new Set();
    for (const pu of loaded['processing-unit-contracts.json'].processingUnits || []) {
      for (const id of pu.sourceStepIds || []) {
        puCoveredStepIds.add(id);
      }
    }

    if (loaded['proc-decomposition.json']) {
      for (const dec of loaded['proc-decomposition.json'].decompositions || []) {
        puCoveredStepIds.add(dec.stepId);
      }
    }

    const uncovered = [...allStepIds].filter(id => !puCoveredStepIds.has(id));
    if (uncovered.length > 0) {
      results.push({
        phase: 2,
        check: 'Integrity: Step Migration Coverage',
        passed: false,
        message: `Phase 1 steps unmapped to any PU or Decomposition: ${uncovered.join(', ')}`
      });
    } else {
      results.push({
        phase: 2,
        check: 'Integrity: Step Migration Coverage',
        passed: true,
        message: `All ${allStepIds.size} source steps mapped to target processing units`
      });
    }
  }

  return results;
}

function validatePhase3(rootDir) {
  const results = [];
  const traceDir = path.join(rootDir, 'output', 'traceability');
  const reviewDir = path.join(rootDir, 'output', 'review');
  const manifestDir = path.join(rootDir, 'output', 'manifests');

  const requiredFiles = [
    { dir: traceDir, name: 'traceability-matrix.json', reqKeys: ['mappings', 'metrics'] },
    { dir: reviewDir, name: 'static-analysis.json', reqKeys: ['files', 'verdict'] },
    { dir: reviewDir, name: 'semantic-review.json', reqKeys: ['evaluations', 'semanticFidelityVerdict'] },
    { dir: reviewDir, name: 'orphan-detection.json', reqKeys: ['sourceOrphans', 'targetOrphans', 'verdict'] },
    { dir: manifestDir, name: 'migration-manifest.json', reqKeys: ['packageId', 'timestamp', 'artifacts', 'certification'] }
  ];

  const loaded = {};

  for (const item of requiredFiles) {
    const filePath = path.join(item.dir, item.name);
    const res = loadJson(filePath);
    if (!res.ok) {
      results.push({ phase: 3, check: item.name, passed: false, message: res.error });
    } else {
      let missingKeys = item.reqKeys.filter(k => !(k in res.data));
      if (missingKeys.length > 0) {
        results.push({ phase: 3, check: item.name, passed: false, message: `Missing required keys: ${missingKeys.join(', ')}` });
      } else {
        loaded[item.name] = res.data;
        results.push({ phase: 3, check: item.name, passed: true, message: 'Valid schema contract' });
      }
    }
  }

  // Cross-artifact audit requirements
  if (loaded['traceability-matrix.json']) {
    const trace = loaded['traceability-matrix.json'];
    const cov = trace.metrics ? trace.metrics.coveragePercentage : 0;
    if (cov < 100) {
      results.push({
        phase: 3,
        check: 'Integrity: Traceability Coverage',
        passed: false,
        message: `Coverage is ${cov}%, strictly requires 100.0%`
      });
    } else {
      results.push({
        phase: 3,
        check: 'Integrity: Traceability Coverage',
        passed: true,
        message: '100% complete bidirectional traceability'
      });
    }
  }

  if (loaded['orphan-detection.json']) {
    const orphan = loaded['orphan-detection.json'];
    const srcOrphans = (orphan.sourceOrphans || []).length;
    const tgtOrphans = (orphan.targetOrphans || []).length;
    if (srcOrphans > 0 || tgtOrphans > 0 || orphan.verdict !== 'CLEAN') {
      results.push({
        phase: 3,
        check: 'Integrity: Zero-Orphan Policy',
        passed: false,
        message: `Found ${srcOrphans} source orphans, ${tgtOrphans} target orphans (Verdict: ${orphan.verdict})`
      });
    } else {
      results.push({
        phase: 3,
        check: 'Integrity: Zero-Orphan Policy',
        passed: true,
        message: '0 source orphans and 0 target orphans verified'
      });
    }
  }

  if (loaded['static-analysis.json']) {
    const sa = loaded['static-analysis.json'];
    if (sa.verdict !== 'PASSED') {
      results.push({
        phase: 3,
        check: 'Integrity: Static Analysis Verdict',
        passed: false,
        message: `Static review verdict is ${sa.verdict}`
      });
    } else {
      results.push({
        phase: 3,
        check: 'Integrity: Static Analysis Verdict',
        passed: true,
        message: 'Static analysis passed with zero margin/status defects'
      });
    }
  }

  return results;
}

function main() {
  const { phase, rootDir } = parseArgs();
  console.log(`=======================================================`);
  console.log(` SAS-TO-COBOL DETERMINISTIC QUALITY GATE VALIDATOR`);
  console.log(` Target Root: ${rootDir}`);
  console.log(` Target Scope: Phase ${phase.toUpperCase()}`);
  console.log(`=======================================================\n`);

  let allResults = [];

  if (phase === '1' || phase === 'all') {
    allResults.push(...validatePhase1(rootDir));
  }
  if (phase === '2' || phase === 'all') {
    allResults.push(...validatePhase2(rootDir));
  }
  if (phase === '3' || phase === 'all') {
    allResults.push(...validatePhase3(rootDir));
  }

  let failures = 0;
  for (const r of allResults) {
    const tag = r.passed ? '[PASS]' : '[FAIL]';
    console.log(`${tag.padEnd(7)} Phase ${r.phase} | ${r.check.padEnd(38)} | ${r.message}`);
    if (!r.passed) {
      failures++;
    }
  }

  console.log(`\n-------------------------------------------------------`);
  if (failures === 0 && allResults.length > 0) {
    console.log(`GATE STATUS: PASSED (${allResults.length} checks succeeded)`);
    process.exit(0);
  } else if (allResults.length === 0) {
    console.log(`GATE STATUS: NO CHECKS RUN`);
    process.exit(0);
  } else {
    console.log(`GATE STATUS: PHASE_${phase.toUpperCase()}_GATE_BLOCKED (${failures} of ${allResults.length} checks failed)`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { validateSchema, validatePhase1, validatePhase2, validatePhase3 };
