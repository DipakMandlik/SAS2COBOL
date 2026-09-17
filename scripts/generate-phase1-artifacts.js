const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve('.');
const p1Dir = path.join(rootDir, 'workspace', 'phase-1-understanding');
if (!fs.existsSync(p1Dir)) {
  fs.mkdirSync(p1Dir, { recursive: true });
}

const sasFile = path.join(rootDir, 'input', 'sas', 'SYN_ENTERPRISE_SALES_MODERNIZATION.sas');
const sasContent = fs.readFileSync(sasFile, 'utf8');
const sasLines = sasContent.split(/\r?\n/);
const fileHash = crypto.createHash('sha256').update(fs.readFileSync(sasFile)).digest('hex');

console.log('Building Phase 1 artifacts for:', sasFile);
console.log('Lines:', sasLines.length, 'SHA256:', fileHash);

// Step definition builder
const rawSteps = [
  { type: 'GLOBAL', name: 'GLOBAL_OPTIONS', startLine: 8, endLine: 17 },
  { type: 'GLOBAL', name: 'MACRO_DEF_SET_RUN_CONTEXT', startLine: 18, endLine: 22 },
  { type: 'GLOBAL', name: 'MACRO_DEF_CHOOSE_PERIOD', startLine: 24, endLine: 38 },
  { type: 'MACRO_CALL', name: '%set_run_context(region=ALL,min_amount=100)', startLine: 40, endLine: 40 },
  { type: 'MACRO_CALL', name: '%choose_period(period=MONTHLY)', startLine: 41, endLine: 41 },
  { type: 'DATA', name: 'WORKLIB.customer_base', startLine: 43, endLine: 53 },
  { type: 'PROC', name: 'SORT', startLine: 55, endLine: 58 },
  { type: 'DATA', name: 'WORKLIB.product_base', startLine: 60, endLine: 67 },
  { type: 'PROC', name: 'SORT', startLine: 69, endLine: 72 },
  { type: 'DATA', name: 'WORKLIB.sales_base', startLine: 74, endLine: 93 },
  { type: 'PROC', name: 'SORT', startLine: 95, endLine: 98 },
  { type: 'DATA', name: 'WORKLIB.customer_sales', startLine: 100, endLine: 108 },
  { type: 'PROC', name: 'SORT', startLine: 110, endLine: 113 },
  { type: 'DATA', name: 'WORKLIB.customer_monthly', startLine: 115, endLine: 128 },
  { type: 'PROC', name: 'SUMMARY', startLine: 130, endLine: 141 },
  { type: 'PROC', name: 'MEANS', startLine: 143, endLine: 151 },
  { type: 'PROC', name: 'FREQ', startLine: 153, endLine: 156 },
  { type: 'PROC', name: 'TRANSPOSE', startLine: 158, endLine: 162 },
  { type: 'PROC', name: 'SQL', startLine: 164, endLine: 199 },
  { type: 'DATA', name: 'WORKLIB.sales_rules', startLine: 201, endLine: 213 },
  { type: 'PROC', name: 'SORT', startLine: 215, endLine: 217 },
  { type: 'DATA', name: 'WORKLIB.review_queue_final', startLine: 219, endLine: 230 },
  { type: 'PROC', name: 'SQL', startLine: 232, endLine: 245 },
  { type: 'PROC', name: 'SQL', startLine: 247, endLine: 258 },
  { type: 'DATA', name: 'WORKLIB.customer_tier', startLine: 260, endLine: 269 },
  { type: 'PROC', name: 'SORT', startLine: 271, endLine: 273 },
  { type: 'DATA', name: 'WORKLIB.daily_sales', startLine: 275, endLine: 287 },
  { type: 'PROC', name: 'SORT', startLine: 289, endLine: 291 },
  { type: 'PROC', name: 'TRANSPOSE', startLine: 293, endLine: 297 },
  { type: 'DATA', name: 'WORKLIB.customer_flags', startLine: 299, endLine: 309 },
  { type: 'PROC', name: 'SORT', startLine: 311, endLine: 314 },
  { type: 'PROC', name: 'SUMMARY', startLine: 316, endLine: 324 },
  { type: 'PROC', name: 'FREQ', startLine: 326, endLine: 329 },
  { type: 'GLOBAL', name: 'MACRO_DEF_BUILD_REGION_REPORT', startLine: 331, endLine: 343 },
  { type: 'DATA', name: 'WORKLIB.region_report_input_all', startLine: 333, endLine: 335 },
  { type: 'DATA', name: 'WORKLIB.region_report_input_filtered', startLine: 338, endLine: 341 },
  { type: 'MACRO_CALL', name: '%build_region_report(region=&RUN_REGION)', startLine: 345, endLine: 345 },
  { type: 'PROC', name: 'SQL', startLine: 347, endLine: 357 },
  { type: 'DATA', name: 'WORKLIB.final_sales_extract', startLine: 359, endLine: 370 },
  { type: 'PROC', name: 'SORT', startLine: 372, endLine: 374 },
  { type: 'PROC', name: 'DATASETS', startLine: 376, endLine: 378 },
  { type: 'DATA', name: 'WORKLIB.audit_extract', startLine: 380, endLine: 390 },
  { type: 'PROC', name: 'SQL', startLine: 392, endLine: 398 },
  { type: 'DATA', name: 'WORKLIB.reconciliation', startLine: 400, endLine: 411 },
  { type: 'DATA', name: 'WORKLIB.segment_rollup', startLine: 416, endLine: 428 },
  { type: 'PROC', name: 'SORT', startLine: 430, endLine: 432 },
  { type: 'PROC', name: 'SQL', startLine: 434, endLine: 440 },
  { type: 'DATA', name: 'WORKLIB.exception_extract', startLine: 442, endLine: 451 },
  { type: 'PROC', name: 'FREQ', startLine: 453, endLine: 455 },
  { type: 'DATA', name: 'WORKLIB.exception_summary', startLine: 457, endLine: 463 },
  { type: 'PROC', name: 'SQL', startLine: 465, endLine: 477 },
  { type: 'DATA', name: 'WORKLIB.delivery_manifest', startLine: 479, endLine: 486 },
  { type: 'PROC', name: 'SORT', startLine: 488, endLine: 490 },
  { type: 'GLOBAL', name: 'MACRO_DEF_PARAMETERIZED_FILTER', startLine: 492, endLine: 500 },
  { type: 'DATA', name: 'WORKLIB.high_value_sales_def', startLine: 495, endLine: 498 },
  { type: 'MACRO_CALL', name: '%parameterized_filter(input=WORKLIB.enriched_sales, output=WORKLIB.high_value_sales, threshold=10000)', startLine: 501, endLine: 505 },
  { type: 'PROC', name: 'SQL', startLine: 507, endLine: 515 },
  { type: 'DATA', name: 'WORKLIB.final_customer_profile', startLine: 517, endLine: 528 },
  { type: 'PROC', name: 'SORT', startLine: 530, endLine: 532 },
  { type: 'DATA', name: 'WORKLIB.final_customer_profile_seq', startLine: 534, endLine: 539 },
  { type: 'PROC', name: 'SUMMARY', startLine: 541, endLine: 548 },
  { type: 'PROC', name: 'SQL', startLine: 550, endLine: 563 },
  { type: 'DATA', name: 'WORKLIB.customer_scoring', startLine: 572, endLine: 594 },
  { type: 'PROC', name: 'SORT', startLine: 596, endLine: 598 },
  { type: 'PROC', name: 'FREQ', startLine: 600, endLine: 602 },
  { type: 'PROC', name: 'SUMMARY', startLine: 604, endLine: 614 },
  { type: 'DATA', name: 'WORKLIB.score_summary', startLine: 616, endLine: 622 },
  { type: 'PROC', name: 'SQL', startLine: 624, endLine: 635 },
  { type: 'DATA', name: 'WORKLIB.region_customer_score_flags', startLine: 637, endLine: 643 },
  { type: 'PROC', name: 'SORT', startLine: 645, endLine: 647 },
  { type: 'PROC', name: 'SQL', startLine: 653, endLine: 668 },
  { type: 'DATA', name: 'WORKLIB.product_performance', startLine: 670, endLine: 680 },
  { type: 'PROC', name: 'SORT', startLine: 682, endLine: 684 },
  { type: 'PROC', name: 'SUMMARY', startLine: 686, endLine: 693 },
  { type: 'PROC', name: 'FREQ', startLine: 695, endLine: 697 },
  { type: 'DATA', name: 'WORKLIB.sales_period_flags', startLine: 703, endLine: 715 },
  { type: 'PROC', name: 'SORT', startLine: 717, endLine: 719 },
  { type: 'PROC', name: 'SUMMARY', startLine: 721, endLine: 728 },
  { type: 'PROC', name: 'SUMMARY', startLine: 730, endLine: 737 },
  { type: 'PROC', name: 'SQL', startLine: 739, endLine: 750 },
  { type: 'PROC', name: 'SORT', startLine: 756, endLine: 761 },
  { type: 'DATA', name: 'WORKLIB.sales_quality', startLine: 763, endLine: 792 },
  { type: 'PROC', name: 'FREQ', startLine: 794, endLine: 796 },
  { type: 'PROC', name: 'SQL', startLine: 798, endLine: 807 },
  { type: 'PROC', name: 'SQL', startLine: 813, endLine: 823 },
  { type: 'DATA', name: 'WORKLIB.customer_activity', startLine: 825, endLine: 835 },
  { type: 'PROC', name: 'SORT', startLine: 837, endLine: 839 },
  { type: 'PROC', name: 'FREQ', startLine: 841, endLine: 843 },
  { type: 'PROC', name: 'SUMMARY', startLine: 845, endLine: 852 },
  { type: 'DATA', name: 'WORKLIB.region_controls', startLine: 858, endLine: 875 },
  { type: 'PROC', name: 'FREQ', startLine: 877, endLine: 879 },
  { type: 'PROC', name: 'SQL', startLine: 881, endLine: 892 },
  { type: 'DATA', name: 'WORKLIB.region_running_sales', startLine: 898, endLine: 910 },
  { type: 'PROC', name: 'SORT', startLine: 912, endLine: 914 },
  { type: 'DATA', name: 'WORKLIB.region_running_sales_delta', startLine: 916, endLine: 923 },
  { type: 'PROC', name: 'SUMMARY', startLine: 925, endLine: 932 },
  { type: 'PROC', name: 'SQL', startLine: 938, endLine: 946 },
  { type: 'DATA', name: 'WORKLIB.sales_lookup_enriched', startLine: 948, endLine: 965 },
  { type: 'PROC', name: 'FREQ', startLine: 967, endLine: 969 },
  { type: 'DATA', name: 'WORKLIB.semantic_edge_cases', startLine: 975, endLine: 986 },
  { type: 'PROC', name: 'FREQ', startLine: 988, endLine: 990 },
  { type: 'PROC', name: 'SQL', startLine: 996, endLine: 1006 },
  { type: 'DATA', name: 'WORKLIB.operational_dashboard', startLine: 1008, endLine: 1016 },
  { type: 'PROC', name: 'PRINT', startLine: 1018, endLine: 1019 }
];

// Assign stable sequential step IDs
const steps = rawSteps.map((s, idx) => ({
  stepId: `STEP-${String(idx + 1).padStart(3, '0')}`,
  type: s.type,
  name: s.name,
  startLine: s.startLine,
  endLine: s.endLine
}));

const dataStepsCount = steps.filter(s => s.type === 'DATA').length;
const procStepsCount = steps.filter(s => s.type === 'PROC').length;

// 1. source-inventory.json
const sourceInventory = {
  files: [{
    fileId: 'SRC-001',
    filePath: 'input/sas/SYN_ENTERPRISE_SALES_MODERNIZATION.sas',
    linesOfCode: sasLines.length,
    sha256: fileHash,
    macroDefinitions: [
      'set_run_context',
      'choose_period',
      'build_region_report',
      'parameterized_filter'
    ],
    steps: steps
  }],
  totals: {
    totalFiles: 1,
    totalLines: sasLines.length,
    totalDataSteps: dataStepsCount,
    totalProcSteps: procStepsCount
  }
};

fs.writeFileSync(path.join(p1Dir, 'source-inventory.json'), JSON.stringify(sourceInventory, null, 2));
console.log('Wrote source-inventory.json');
