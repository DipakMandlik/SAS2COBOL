const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const p1Dir = path.join(rootDir, 'workspace', 'phase-1-understanding');
const p2Dir = path.join(rootDir, 'workspace', 'phase-2-migration');

if (!fs.existsSync(p2Dir)) {
  fs.mkdirSync(p2Dir, { recursive: true });
}

// Load Phase 1 artifacts
const inv = require(path.join(p1Dir, 'source-inventory.json'));
const pdm = require(path.join(p1Dir, 'physical-data-model.json'));
const procs = require(path.join(p1Dir, 'proc-semantic-catalog.json'));
const dep = require(path.join(p1Dir, 'dependency-graph.json'));
const traps = require(path.join(p1Dir, 'sas-traps-ledger.json'));
const bRules = require(path.join(p1Dir, 'business-rules.json'));
const sar = require(path.join(p1Dir, 'phase-1-semantic-adversarial-review.json'));
const uncert = require(path.join(p1Dir, 'uncertainty-assumptions-register.json'));

const steps = inv.files[0].steps;
console.log(`Phase 1 Input: ${steps.length} steps, ${pdm.datasets.length} datasets, ${procs.procs.length} procs.`);

// =========================================================================
// 1. MIGRATION STRATEGY (104 decisions)
// =========================================================================
console.log('1. Generating migration-strategy.json...');

const strategyDecisions = steps.map((s, idx) => {
  const decId = `STRAT-DEC-${String(idx + 1).padStart(3, '0')}`;
  let strategy = 'DATA_STEP_TO_SEQUENTIAL_PROCESSING';
  let targetPattern = 'COBOL Sequential File Processing';
  let requiresDecomposition = false;
  let confidence = 'HIGH';
  let rationale = `Sequential processing of step ${s.stepId}`;

  if (s.type === 'GLOBAL') {
    strategy = 'STRUCTURED_REWRITE';
    targetPattern = 'JCL PARM / SET Symbols / Static Configuration';
    rationale = 'Global SAS options and macro definitions are translated into JCL execution parameters, SET symbols, and shared copybook configuration constants.';
  } else if (s.type === 'MACRO_CALL') {
    strategy = 'STRUCTURED_REWRITE';
    targetPattern = 'JCL Procedure Parameter Substitution / SYSIN Control Cards';
    rationale = 'Macro invocations are parameterized via JCL procedure symbols, PARM strings, or SYSIN control card inputs.';
  } else if (s.type === 'PROC') {
    const procMeta = procs.procs.find(p => p.stepId === s.stepId);
    const procName = procMeta ? procMeta.procName : (s.name.split(' ')[0] || 'SORT');

    if (procName === 'SORT') {
      strategy = 'DFSORT_UTILITY_STEP';
      targetPattern = 'DFSORT Control Statement (SORT FIELDS=...)';
      rationale = 'Native mainframe DFSORT utility provides superior I/O throughput and hardware-accelerated sequential sorting compared to internal COBOL sorting.';
      if (s.stepId === 'STEP-081') {
        targetPattern = 'DFSORT Control Statement with SUM FIELDS=NONE, XSUM';
        rationale = 'Mainframe DFSORT with NODUPKEY emulation via SUM FIELDS=NONE and duplicate routing via XSUM DD statement (SAR-012).';
      }
    } else if (procName === 'SUMMARY' || procName === 'MEANS') {
      strategy = 'PROC_DECOMPOSITION';
      targetPattern = 'COBOL Multi-Level Control Break with Dynamic Accumulators';
      requiresDecomposition = true;
      rationale = 'Monolithic aggregation PROC is decomposed into pre-sort, control-break boundary detection, multi-level accumulator summation, and formatted record output.';
    } else if (procName === 'FREQ') {
      strategy = 'PROC_DECOMPOSITION';
      targetPattern = 'COBOL Frequency Table Counting with OCCURS Array';
      requiresDecomposition = true;
      rationale = 'Categorical frequency distributions and crosstabs are decomposed into pre-sort, in-memory OCCURS counter arrays, and formatted summary reporting.';
    } else if (procName === 'TRANSPOSE') {
      strategy = 'PROC_DECOMPOSITION';
      targetPattern = 'COBOL OCCURS Pivoting Table';
      requiresDecomposition = true;
      rationale = 'Dynamic narrow-to-wide pivoting is decomposed into ordered group buffering, fixed OCCURS slot assignment, and wide record emission.';
    } else if (procName === 'SQL') {
      if (s.stepId === 'STEP-047') {
        strategy = 'MANUAL_REVIEW_REQUIRED';
        targetPattern = 'COBOL Sequential Processing with Explicit Sequence Counter';
        confidence = 'MEDIUM';
        rationale = 'Uses undocumented non-deterministic monotonic() function (SAR-010). Replaced with deterministic WS-LINE-COUNTER in COBOL after explicit key sorting.';
      } else {
        strategy = 'SQL_TO_DATA_PROCESSING';
        targetPattern = 'Sequential Match-Merge or DB2 Relational View';
        rationale = 'Relational SQL queries are implemented via two-file sequential match-merge algorithms with HIGH-VALUES sentinels or DB2 SQL cursors.';
      }
    } else if (procName === 'DATASETS') {
      strategy = 'DFSORT_UTILITY_STEP';
      targetPattern = 'Mainframe IEFBR14 / IDCAMS Utility Step';
      rationale = 'SAS library maintenance and table cleanup are replaced by native z/OS catalog management utilities (IEFBR14/IDCAMS).';
    } else if (procName === 'PRINT') {
      strategy = 'DIRECT_TRANSLATION';
      targetPattern = 'COBOL Formatted SYSOUT Report Writer';
      rationale = 'PROC PRINT output is translated into standard line-sequential SYSOUT report writing with page headers and line limits.';
    }
  } else if (s.type === 'DATA') {
    if (s.stepId === 'STEP-006') {
      strategy = 'MANUAL_REVIEW_REQUIRED';
      targetPattern = 'COBOL Sequential Record Ingestion with Unconditional String Trimming';
      confidence = 'HIGH';
      rationale = 'Contains unanchored FIRST.customer_id without BY statement (SAR-002). Remediated to unconditional FUNCTION TRIM in COBOL while logging syntax defect.';
    } else if (s.stepId === 'STEP-012') {
      strategy = 'DATA_STEP_TO_SEQUENTIAL_PROCESSING';
      targetPattern = 'Sequential Match-Merge with Explicit Field Overwrite Semantics';
      rationale = 'Two-way match-merge with variable collision on region (SAR-006). Emulates SAS PDV rightmost overwrite by explicitly moving sales_sorted.region to output.';
    } else if (s.stepId === 'STEP-014') {
      strategy = 'DATA_STEP_TO_SORT_AND_GROUP';
      targetPattern = 'COBOL Control Break on Customer ID with Output on Boundary';
      requiresDecomposition = true;
      rationale = 'Stateful monthly accumulation with RETAIN variables and output triggered by LAST.customer_id boundary (SAR-007).';
    } else if (s.stepId === 'STEP-027') {
      strategy = 'MANUAL_REVIEW_REQUIRED';
      targetPattern = 'DFSORT Pre-Sort by Sale Date followed by COBOL Daily Accumulator';
      confidence = 'HIGH';
      requiresDecomposition = true;
      rationale = 'SAS source executes BY sale_date against data sorted by customer_id (SAR-003). Target architecture inserts mandatory DFSORT step on sale_date.';
    } else if (s.stepId === 'STEP-039') {
      strategy = 'MANUAL_REVIEW_REQUIRED';
      targetPattern = 'DFSORT Dual-File Alignment followed by COBOL Match-Merge';
      confidence = 'HIGH';
      requiresDecomposition = true;
      rationale = 'MERGE between region_report and region_channel_summary has key/sorting mismatch (SAR-004). Target mandates pre-sort on customer_region.';
    } else if (s.stepId === 'STEP-044') {
      strategy = 'MANUAL_REVIEW_REQUIRED';
      targetPattern = 'COBOL Control Ledger with Explicit Loop Termination';
      confidence = 'HIGH';
      rationale = 'SAS code causes infinite loop due to conditional SET without STOP (SAR-001). Target COBOL reads control record once during initialization and terminates at EOF.';
    } else if (s.stepId === 'STEP-082') {
      strategy = 'DATA_STEP_TO_SEQUENTIAL_PROCESSING';
      targetPattern = 'COBOL Data Quality Validation with 88-Level Null/Missing Sentinels';
      rationale = 'Sales quality validation involves SAS missing value inequality anomaly (. < 0, SAR-009). Target COBOL checks 88-level sentinels explicitly before range tests.';
    } else if (s.name.includes('SORT') || s.name.includes('ROLLUP') || s.name.includes('RUNNING') || s.name.includes('MONTHLY') || s.name.includes('SEQ')) {
      strategy = 'DATA_STEP_TO_SORT_AND_GROUP';
      targetPattern = 'COBOL Control Break / Group Processing';
      requiresDecomposition = true;
      rationale = 'DATA step relies on ordered sequential input, BY-group detection, and inter-record state accumulation.';
    }
  }

  return {
    decisionId: decId,
    stepId: s.stepId,
    sourceComponent: s.name,
    strategy,
    targetPattern,
    requiresDecomposition,
    rationale,
    confidence
  };
});

fs.writeFileSync(
  path.join(p2Dir, 'migration-strategy.json'),
  JSON.stringify({ decisions: strategyDecisions }, null, 2)
);
console.log(`Saved migration-strategy.json with ${strategyDecisions.length} decisions.`);

// =========================================================================
// 2. PROC DECOMPOSITION (All 60 PROCs decomposed into stages)
// =========================================================================
console.log('2. Generating proc-decomposition.json...');

const procDecompositions = procs.procs.map(p => {
  const stepId = p.stepId;
  const procName = p.procName;
  let targetPattern = 'DFSORT_STEP';
  let stages = [];

  if (procName === 'SORT') {
    targetPattern = 'DFSORT_STEP';
    if (stepId === 'STEP-081') {
      stages = [
        {
          stageOrder: 1,
          stageName: 'Sort Parameter Specification',
          operation: 'Define DFSORT control cards SORT FIELDS=(1,8,CH,A) and SUM FIELDS=NONE',
          intermediateFile: '&&SORTCTL',
          targetArtifact: 'JCL SYSIN'
        },
        {
          stageOrder: 2,
          stageName: 'Duplicate Exception Split',
          operation: 'Execute DFSORT routing unique records to SORTOUT and duplicate records to XSUM DD',
          intermediateFile: 'WORKLIB.sales_duplicate_check',
          targetArtifact: 'DFSORT Utility / JCL'
        }
      ];
    } else {
      stages = [
        {
          stageOrder: 1,
          stageName: 'Sort Key Extraction',
          operation: `Extract sort fields for ${p.byVariables ? p.byVariables.join(', ') : 'primary key'}`,
          intermediateFile: '&&SORTCNTL',
          targetArtifact: 'JCL SYSIN Control Card'
        },
        {
          stageOrder: 2,
          stageName: 'DFSORT Execution',
          operation: 'Execute DFSORT sequential sort utility with high-performance block sorting',
          intermediateFile: p.outputDatasets && p.outputDatasets[0] ? p.outputDatasets[0] : '&&SRTOUT',
          targetArtifact: 'DFSORT Utility'
        }
      ];
    }
  } else if (procName === 'SUMMARY' || procName === 'MEANS') {
    targetPattern = 'COBOL_CONTROL_BREAK';
    stages = [
      {
        stageOrder: 1,
        stageName: 'Input Ordering Validation',
        operation: `Verify input dataset is sorted by grouping keys: ${p.byVariables ? p.byVariables.join(', ') : (p.classVariables ? p.classVariables.join(', ') : 'GROUP_KEYS')}`,
        intermediateFile: '&&PRE_SORTED',
        targetArtifact: 'DFSORT / JCL Step'
      },
      {
        stageOrder: 2,
        stageName: 'Control Break Detection',
        operation: 'Compare current record key against previous record key in WORKING-STORAGE to trigger boundary processing',
        targetArtifact: 'COBOL Paragraph 2200-EVALUATE-KEY-BREAK'
      },
      {
        stageOrder: 3,
        stageName: 'Accumulator Management',
        operation: 'Add metrics to packed decimal (COMP-3) accumulators; increment transaction counters',
        targetArtifact: 'COBOL Paragraph 2300-ACCUMULATE-METRICS'
      },
      {
        stageOrder: 4,
        stageName: 'Summary Record Writing',
        operation: 'Format summary record with totals and computed means, then write to output file',
        intermediateFile: p.outputDatasets && p.outputDatasets[0] ? p.outputDatasets[0] : '&&SUMOUT',
        targetArtifact: 'COBOL Paragraph 2400-WRITE-SUMMARY'
      }
    ];
  } else if (procName === 'FREQ') {
    targetPattern = 'COBOL_CONTROL_BREAK';
    stages = [
      {
        stageOrder: 1,
        stageName: 'Category Sorting',
        operation: 'Sort input stream by frequency dimension categories',
        intermediateFile: '&&FRQSORT',
        targetArtifact: 'DFSORT Utility'
      },
      {
        stageOrder: 2,
        stageName: 'Frequency Array Counting',
        operation: 'Accumulate occurrence counts and calculate percentages in WORKING-STORAGE OCCURS table',
        targetArtifact: 'COBOL Paragraph 2100-COUNT-FREQUENCY'
      },
      {
        stageOrder: 3,
        stageName: 'Frequency Record Output',
        operation: 'Emit formatted category frequency and cumulative percentage records',
        intermediateFile: p.outputDatasets && p.outputDatasets[0] ? p.outputDatasets[0] : '&&FRQOUT',
        targetArtifact: 'COBOL Paragraph 2200-WRITE-FREQUENCY'
      }
    ];
  } else if (procName === 'TRANSPOSE') {
    targetPattern = 'COBOL_OCCURS_PIVOT';
    stages = [
      {
        stageOrder: 1,
        stageName: 'Pre-Sort by Pivot Keys',
        operation: 'Sort input stream by BY-group and ID variables',
        intermediateFile: '&&PIVSORT',
        targetArtifact: 'DFSORT Utility'
      },
      {
        stageOrder: 2,
        stageName: 'OCCURS Table Pivoting',
        operation: 'Populate fixed-length wide record OCCURS table slots from normalized vertical observations',
        targetArtifact: 'COBOL Paragraph 2200-PIVOT-ROW-TO-COLUMNS'
      },
      {
        stageOrder: 3,
        stageName: 'Wide Record Writing',
        operation: 'Emit denormalized wide record upon BY-group boundary transition',
        intermediateFile: p.outputDatasets && p.outputDatasets[0] ? p.outputDatasets[0] : '&&TRNOUT',
        targetArtifact: 'COBOL Paragraph 2300-WRITE-WIDE-RECORD'
      }
    ];
  } else if (procName === 'SQL') {
    targetPattern = 'SEQUENTIAL_MERGE';
    stages = [
      {
        stageOrder: 1,
        stageName: 'Input Dual-Stream Sorting',
        operation: 'Ensure all joining datasets are sorted in ascending order by primary join keys',
        intermediateFile: '&&SQLSORT',
        targetArtifact: 'DFSORT Utility Steps'
      },
      {
        stageOrder: 2,
        stageName: 'Sequential Match-Merge Loop',
        operation: 'Traverse primary and lookup files using HIGH-VALUES EOF sentinels to emulate relational join semantics',
        targetArtifact: 'COBOL Paragraph 2000-PROCESS-MATCH-MERGE'
      },
      {
        stageOrder: 3,
        stageName: 'Projection & Filter Evaluation',
        operation: 'Evaluate WHERE clauses, computed columns, and aggregate functions',
        targetArtifact: 'COBOL Paragraph 2100-PROJECT-COLUMNS'
      },
      {
        stageOrder: 4,
        stageName: 'Output Table Generation',
        operation: 'Write joined and projected records to target QSAM file',
        intermediateFile: p.outputDatasets && p.outputDatasets[0] ? p.outputDatasets[0] : '&&SQLOUT',
        targetArtifact: 'COBOL File Output'
      }
    ];
  } else if (procName === 'DATASETS') {
    targetPattern = 'DFSORT_STEP';
    stages = [
      {
        stageOrder: 1,
        stageName: 'Dataset Allocation & Scratch',
        operation: 'Manage z/OS dataset catalog entries and temporary file disposal',
        targetArtifact: 'Mainframe IEFBR14 / IDCAMS Utility'
      }
    ];
  } else if (procName === 'PRINT') {
    targetPattern = 'COBOL_CONTROL_BREAK';
    stages = [
      {
        stageOrder: 1,
        stageName: 'Report Header Formatting',
        operation: 'Format page headers, run timestamp, and column headings',
        targetArtifact: 'COBOL Paragraph 1100-PRINT-HEADERS'
      },
      {
        stageOrder: 2,
        stageName: 'Detail Line Formatting & Display',
        operation: 'Format operational dashboard fields into print line and write to SYSOUT',
        targetArtifact: 'COBOL Paragraph 2100-WRITE-REPORT-LINE'
      }
    ];
  }

  return {
    stepId,
    procName,
    targetPattern,
    stages
  };
});

fs.writeFileSync(
  path.join(p2Dir, 'proc-decomposition.json'),
  JSON.stringify({ decompositions: procDecompositions }, null, 2)
);
console.log(`Saved proc-decomposition.json with ${procDecompositions.length} decompositions.`);

// =========================================================================
// 3. TARGET COBOL ARCHITECTURE (Programs, Copybooks, JCL)
// =========================================================================
console.log('3. Generating target-cobol-architecture.json...');

const programs = [
  {
    programId: 'CBLSL001',
    programType: 'BATCH_MAIN',
    description: 'Master Ingestion & Data Hygiene: Ingests RAW.customers, RAW.products, and RAW.sales, cleanses string fields, validates ranges, and derives base financials.',
    assignedPUs: ['PU-ING-001', 'PU-ING-002', 'PU-ING-003', 'PU-ING-004'],
    usedCopybooks: ['CPCOMM01', 'CPTRAP88', 'CPRAW01', 'CPRAW02', 'CPRAW03', 'CPCUST01', 'CPPROD01', 'CPSALE01']
  },
  {
    programId: 'CBLSL002',
    programType: 'BATCH_MAIN',
    description: 'Customer Sales Consolidation: Two-file match-merge of customers and sales transactions with explicit rightmost overwrite semantics and monthly control-break aggregation.',
    assignedPUs: ['PU-CBL-002', 'PU-CBL-003'],
    usedCopybooks: ['CPCOMM01', 'CPTRAP88', 'CPCUST02', 'CPSALE02', 'CPCSAL01', 'CPCMON01']
  },
  {
    programId: 'CBLSL003',
    programType: 'BATCH_MAIN',
    description: 'Base Statistical Aggregation & Pivot: Computes multi-level sales summaries, regional means, channel crosstabs, and transposes summary metrics into wide OCCURS format.',
    assignedPUs: ['PU-AGG-001', 'PU-AGG-002', 'PU-AGG-003', 'PU-PIV-001'],
    usedCopybooks: ['CPCOMM01', 'CPSALE02', 'CPRSUM01', 'CPRMEA01', 'CPRFREQ1', 'CPRWID01']
  },
  {
    programId: 'CBLSL004',
    programType: 'BATCH_MAIN',
    description: 'Relational Sales Enrichment & Business Rules: Joins sales, customers, and products; evaluates tiered pricing and risk rules (BR-001/BR-002); outputs review queue.',
    assignedPUs: ['PU-ENR-001', 'PU-ENR-002', 'PU-ENR-003', 'PU-ENR-004', 'PU-ENR-005'],
    usedCopybooks: ['CPCOMM01', 'CPTRAP88', 'CPENRS01', 'CPRULE01', 'CPREVQ01', 'CPCATSUM', 'CPSUBCAT']
  },
  {
    programId: 'CBLSL005',
    programType: 'BATCH_MAIN',
    description: 'Temporal Tracking & Daily Sales Analysis: Classifies customer lifetime loyalty tiers; computes daily sales totals with pre-sort guard; pivots daily metrics.',
    assignedPUs: ['PU-DLY-001', 'PU-DLY-002', 'PU-PIV-002', 'PU-DLY-003', 'PU-DLY-004', 'PU-DLY-005'],
    usedCopybooks: ['CPCOMM01', 'CPTIER01', 'CPDSAL01', 'CPDWID01', 'CPCFLG01', 'CPRCHSUM', 'CPCHFREQ']
  },
  {
    programId: 'CBLSL006',
    programType: 'BATCH_MAIN',
    description: 'Regional Reporting & Reconciliation Ledger: Filters regional extracts, merges channel summaries with key alignment, generates audit trails, and balances controls (SAR-001 fix).',
    assignedPUs: ['PU-RPT-001', 'PU-RPT-002', 'PU-RPT-003', 'PU-RPT-004', 'PU-RPT-005', 'PU-RPT-006'],
    usedCopybooks: ['CPCOMM01', 'CPRECON0', 'CPRPTIN1', 'CPRPTIN2', 'CPREGRPT', 'CPFEXT01', 'CPAUDT01', 'CPCTRL01', 'CPRECL01']
  },
  {
    programId: 'CBLSL007',
    programType: 'BATCH_MAIN',
    description: 'Segmentation & Logistics Dispatch: Computes segment rollups, applies deterministic row ranking (SAR-010 fix), extracts exceptions, and produces delivery manifest.',
    assignedPUs: ['PU-SEG-001', 'PU-SEG-002', 'PU-SEG-003', 'PU-SEG-004', 'PU-SEG-005', 'PU-SEG-006', 'PU-SEG-007'],
    usedCopybooks: ['CPCOMM01', 'CPSEGR01', 'CPSEGRK1', 'CPEXCP01', 'CPEXCF01', 'CPEXCS01', 'CPMANI01']
  },
  {
    programId: 'CBLSL008',
    programType: 'BATCH_MAIN',
    description: 'Multidimensional Customer Scoring Engine: Filters high-value transactions, builds customer profiles, evaluates multi-factor scoring model, and benchmarks regional scores.',
    assignedPUs: ['PU-SCR-001', 'PU-SCR-002', 'PU-SCR-003', 'PU-SCR-004', 'PU-SCR-005', 'PU-SCR-006', 'PU-SCR-007', 'PU-SCR-008', 'PU-SCR-009', 'PU-SCR-010', 'PU-SCR-011', 'PU-SCR-012'],
    usedCopybooks: ['CPCOMM01', 'CPTRAP88', 'CPHVSD01', 'CPHVSC01', 'CPCPRF01', 'CPCPRS01', 'CPCSCR01', 'CPSCRS01', 'CPRSCB01', 'CPRSFL01']
  },
  {
    programId: 'CBLSL009',
    programType: 'BATCH_MAIN',
    description: 'Product Performance & Seasonality Evaluation: Computes product margin metrics, evaluates quarterly seasonality and holiday indicators, and analyzes revenue variance.',
    assignedPUs: ['PU-PRD-001', 'PU-PRD-002', 'PU-PRD-003', 'PU-PRD-004', 'PU-PRD-005', 'PU-PRD-006', 'PU-PRD-007', 'PU-PRD-008'],
    usedCopybooks: ['CPCOMM01', 'CPPPRF01', 'CPPCAT01', 'CPSEAS01', 'CPQTRSUM', 'CPHOLSUM', 'CPVAR01']
  },
  {
    programId: 'CBLSL010',
    programType: 'BATCH_MAIN',
    description: 'Data Quality Sentinel Engine: Evaluates numeric and categorical quality metrics with explicit 88-level sentinels to avoid SAS negative missing value anomalies (SAR-009).',
    assignedPUs: ['PU-QAL-002', 'PU-QAL-003', 'PU-QAL-010'],
    usedCopybooks: ['CPCOMM01', 'CPTRAP88', 'CPSQAL01', 'CPQFRQ01', 'CPQSUM01']
  },
  {
    programId: 'CBLSL011',
    programType: 'BATCH_MAIN',
    description: 'Customer Lifecycle & Running Sales Volatility: Evaluates RFM activity status, regional control thresholds, and computes running sales totals and period deltas.',
    assignedPUs: ['PU-ACT-001', 'PU-ACT-002', 'PU-ACT-003', 'PU-ACT-004', 'PU-ACT-005', 'PU-ACT-006', 'PU-ACT-007', 'PU-ACT-008', 'PU-ACT-009', 'PU-ACT-010'],
    usedCopybooks: ['CPCOMM01', 'CPCACT01', 'CPASUM01', 'CPCTRL02', 'CPRUNS01', 'CPRUND01', 'CPRUNM01']
  },
  {
    programId: 'CBLSL012',
    programType: 'BATCH_MAIN',
    description: 'Operational Reconciliation Dashboard & Reporting: Consolidates metrics from all subsystems, validates semantic boundary edge cases, and prints operational dashboard.',
    assignedPUs: ['PU-FIN-001', 'PU-FIN-002', 'PU-FIN-003', 'PU-FIN-004', 'PU-FIN-005', 'PU-FIN-006', 'PU-FIN-007', 'PU-FIN-008'],
    usedCopybooks: ['CPCOMM01', 'CPRECON0', 'CPLOOK01', 'CPLKFRQ1', 'CPEDGE01', 'CPEDGFR1', 'CPDASH01']
  },
  {
    programId: 'SORT',
    programType: 'DFSORT_CONTROL',
    description: 'Standard Mainframe DFSORT Utility: High-throughput block sorting, record deduplication with exception routing (NODUPKEY / XSUM), and key sequence reordering.',
    assignedPUs: [
      'PU-SRT-001', 'PU-SRT-002', 'PU-SRT-003', 'PU-SRT-004', 'PU-SRT-005',
      'PU-SRT-006', 'PU-SRT-007', 'PU-SRT-008', 'PU-SRT-009', 'PU-SRT-010',
      'PU-SRT-011', 'PU-SRT-012', 'PU-SRT-013', 'PU-SRT-014', 'PU-SRT-015',
      'PU-SRT-016', 'PU-QAL-001', 'PU-SRT-017', 'PU-SRT-018'
    ],
    usedCopybooks: []
  },
  {
    programId: 'IEFBR14',
    programType: 'DFSORT_CONTROL',
    description: 'Mainframe Catalog & File Management Utility: Allocates and deletes intermediate temporary dataset GDGs and work files.',
    assignedPUs: ['PU-UTL-001'],
    usedCopybooks: []
  }
];

const sharedCopybooks = [
  {
    copybookName: 'CPCOMM01',
    purpose: 'Standard Enterprise COBOL return codes, ABEND error handling routines, and file status evaluations.'
  },
  {
    copybookName: 'CPTRAP88',
    purpose: 'Condition 88-level definitions for SAS system missing values (LOW-VALUES/HIGH-VALUES sentinels) and data hygiene flags.'
  },
  {
    copybookName: 'CPDATES0',
    purpose: 'Gregorian YYYYMMDD to SAS epoch date offset conversion routines and fiscal calendar boundaries.'
  },
  {
    copybookName: 'CPRECON0',
    purpose: 'Cross-system dual-run reconciliation record layouts, hash total accumulators, and tolerance check metrics.'
  }
];

const jclJobs = [
  {
    jobName: 'JCLSLMOD',
    steps: [
      { stepNumber: 1, stepName: 'STEP010_INGEST', programOrUtility: 'CBLSL001' },
      { stepNumber: 2, stepName: 'STEP020_SRTCUST', programOrUtility: 'SORT' },
      { stepNumber: 3, stepName: 'STEP030_SRTPROD', programOrUtility: 'SORT' },
      { stepNumber: 4, stepName: 'STEP040_SRTSALE', programOrUtility: 'SORT' },
      { stepNumber: 5, stepName: 'STEP050_MRGCUST', programOrUtility: 'CBLSL002' },
      { stepNumber: 6, stepName: 'STEP060_SRTCSAL', programOrUtility: 'SORT' },
      { stepNumber: 7, stepName: 'STEP070_AGGREG1', programOrUtility: 'CBLSL003' },
      { stepNumber: 8, stepName: 'STEP080_ENRICH', programOrUtility: 'CBLSL004' },
      { stepNumber: 9, stepName: 'STEP090_SRTRULE', programOrUtility: 'SORT' },
      { stepNumber: 10, stepName: 'STEP100_DAILYTR', programOrUtility: 'CBLSL005' },
      { stepNumber: 11, stepName: 'STEP110_SRTDLY', programOrUtility: 'SORT' },
      { stepNumber: 12, stepName: 'STEP120_REGRPT', programOrUtility: 'CBLSL006' },
      { stepNumber: 13, stepName: 'STEP130_SRTRPT', programOrUtility: 'SORT' },
      { stepNumber: 14, stepName: 'STEP140_CLEANUP', programOrUtility: 'IEFBR14' },
      { stepNumber: 15, stepName: 'STEP150_SEGMENT', programOrUtility: 'CBLSL007' },
      { stepNumber: 16, stepName: 'STEP160_SRTSEG', programOrUtility: 'SORT' },
      { stepNumber: 17, stepName: 'STEP170_SCORING', programOrUtility: 'CBLSL008' },
      { stepNumber: 18, stepName: 'STEP180_SRTSCR', programOrUtility: 'SORT' },
      { stepNumber: 19, stepName: 'STEP190_PRODUCT', programOrUtility: 'CBLSL009' },
      { stepNumber: 20, stepName: 'STEP200_SRTPRD', programOrUtility: 'SORT' },
      { stepNumber: 21, stepName: 'STEP210_DEDUP', programOrUtility: 'SORT' },
      { stepNumber: 22, stepName: 'STEP220_QUALITY', programOrUtility: 'CBLSL010' },
      { stepNumber: 23, stepName: 'STEP230_ACTIVTY', programOrUtility: 'CBLSL011' },
      { stepNumber: 24, stepName: 'STEP240_SRTACT', programOrUtility: 'SORT' },
      { stepNumber: 25, stepName: 'STEP250_DASHBRD', programOrUtility: 'CBLSL012' }
    ]
  }
];

fs.writeFileSync(
  path.join(p2Dir, 'target-cobol-architecture.json'),
  JSON.stringify({ programs, sharedCopybooks, jclJobs }, null, 2)
);
console.log(`Saved target-cobol-architecture.json with ${programs.length} programs and ${jclJobs[0].steps.length} JCL steps.`);

// =========================================================================
// 4. PROCESSING UNIT CONTRACTS (All 104 source steps covered)
// =========================================================================
console.log('4. Generating processing-unit-contracts.json...');

const processingUnits = [
  // Block 1: Ingestion & Ingestion Utilities (Steps 1-11)
  {
    puId: 'PU-ING-001',
    sourceStepIds: ['STEP-001', 'STEP-002', 'STEP-003', 'STEP-004', 'STEP-005'],
    targetProgram: 'CBLSL001',
    inputs: [
      { ddName: 'SYSIN', datasetName: 'PARMLIB.CONFIG.SALES', recordFormat: 'FB', recordLength: 80 }
    ],
    outputs: [
      { ddName: 'SYSOUT', datasetName: 'SYSOUT', disposition: 'SYSOUT=*' }
    ],
    logicRules: [
      { ruleId: 'R-ING-001', description: 'Initialize run context parameters', action: 'Parse SYSIN parameters for RUN_REGION (default ALL) and MIN_AMOUNT (default 100)' },
      { ruleId: 'R-ING-002', description: 'Set calendar period boundaries', action: 'Derive PERIOD_START and PERIOD_END from system date for MONTHLY period' }
    ]
  },
  {
    puId: 'PU-ING-002',
    sourceStepIds: ['STEP-006'],
    targetProgram: 'CBLSL001',
    inputs: [
      { ddName: 'RAWCUST', datasetName: 'RAW.CUSTOMERS', recordFormat: 'FB', recordLength: 150 }
    ],
    outputs: [
      { ddName: 'CUSTBASE', datasetName: 'WORKLIB.CUSTOMER_BASE', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'RULE-001', description: 'Filter records missing customer_id', action: 'IF CUST-ID IS SPACES OR ZEROES THEN BYPASS-RECORD' },
      { ruleId: 'RULE-002', description: 'Default missing attributes', action: 'IF STATUS IS SPACES MOVE UNKNOWN; IF REGION IS SPACES MOVE UNASSIGNED' },
      { ruleId: 'RULE-003', description: 'Filter inactive customers', action: 'IF FUNCTION UPPER-CASE(STATUS) = INACTIVE THEN BYPASS-RECORD' },
      { ruleId: 'R-ING-SAR002', description: 'Remediate unanchored FIRST. customer_id (SAR-002)', action: 'Perform unconditional string trimming: MOVE FUNCTION TRIM(CUST-NAME) TO OUT-CUST-NAME' }
    ]
  },
  {
    puId: 'PU-SRT-001',
    sourceStepIds: ['STEP-007'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.CUSTOMER_BASE', recordFormat: 'FB', recordLength: 150 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.CUSTOMER_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-001', description: 'Sort customer base by customer_id', action: 'DFSORT SORT FIELDS=(1,8,CH,A)' }
    ]
  },
  {
    puId: 'PU-ING-003',
    sourceStepIds: ['STEP-008'],
    targetProgram: 'CBLSL001',
    inputs: [
      { ddName: 'RAWPROD', datasetName: 'RAW.PRODUCTS', recordFormat: 'FB', recordLength: 200 }
    ],
    outputs: [
      { ddName: 'PRODBASE', datasetName: 'WORKLIB.PRODUCT_BASE', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-ING-003', description: 'Validate product master records', action: 'Validate product_id > 0 and populate default UNKNOWN for missing subcategories' }
    ]
  },
  {
    puId: 'PU-SRT-002',
    sourceStepIds: ['STEP-009'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.PRODUCT_BASE', recordFormat: 'FB', recordLength: 200 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.PRODUCT_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-002', description: 'Sort product base by product_id', action: 'DFSORT SORT FIELDS=(1,8,CH,A)' }
    ]
  },
  {
    puId: 'PU-ING-004',
    sourceStepIds: ['STEP-010'],
    targetProgram: 'CBLSL001',
    inputs: [
      { ddName: 'RAWSALES', datasetName: 'RAW.SALES', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'SALEBASE', datasetName: 'WORKLIB.SALES_BASE', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'RULE-004', description: 'Calculate gross, discount, and net amounts', action: 'COMPUTE GROSS = QTY * PRICE; COMPUTE DISC = GROSS * (PCT/100); COMPUTE NET = GROSS - DISC' },
      { ruleId: 'R-ING-004', description: 'Apply minimum transaction amount filter', action: 'IF NET < WS-MIN-AMOUNT THEN BYPASS-RECORD' }
    ]
  },
  {
    puId: 'PU-SRT-003',
    sourceStepIds: ['STEP-011'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.SALES_BASE', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.SALES_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-003', description: 'Sort sales base by customer_id, sale_date, sale_id', action: 'DFSORT SORT FIELDS=(1,8,CH,A,9,8,CH,A,17,8,CH,A)' }
    ]
  },

  // Block 2: Customer Sales Consolidation & Base Aggregation (Steps 12-18)
  {
    puId: 'PU-CBL-002',
    sourceStepIds: ['STEP-012'],
    targetProgram: 'CBLSL002',
    inputs: [
      { ddName: 'CUSTSRT', datasetName: 'WORKLIB.CUSTOMER_SORTED', recordFormat: 'FB', recordLength: 150 },
      { ddName: 'SALESRT', datasetName: 'WORKLIB.SALES_SORTED', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'CUSTSALE', datasetName: 'WORKLIB.CUSTOMER_SALES', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'RULE-005', description: 'Inner match-merge customer and sales', action: 'Match on CUSTOMER-ID. If key match, emit merged record.' },
      { ruleId: 'R-CBL-SAR006', description: 'Preserve SAS PDV rightmost variable overwrite (SAR-006)', action: 'Explicitly move SALES_SORTED.REGION to OUT-REGION, matching SAS overwrite of CUSTOMER.REGION.' }
    ]
  },
  {
    puId: 'PU-SRT-004',
    sourceStepIds: ['STEP-013'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.CUSTOMER_SALES', recordFormat: 'FB', recordLength: 220 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.CUSTOMER_SALES_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-004', description: 'Sort customer sales by customer_id, sale_date', action: 'DFSORT SORT FIELDS=(1,8,CH,A,9,8,CH,A)' }
    ]
  },
  {
    puId: 'PU-CBL-003',
    sourceStepIds: ['STEP-014'],
    targetProgram: 'CBLSL002',
    inputs: [
      { ddName: 'CSALESRT', datasetName: 'WORKLIB.CUSTOMER_SALES_SORTED', recordFormat: 'FB', recordLength: 220 }
    ],
    outputs: [
      { ddName: 'CUSTMNTH', datasetName: 'WORKLIB.CUSTOMER_MONTHLY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'RULE-006', description: 'Stateful monthly accumulation per customer', action: 'ADD NET-AMOUNT TO WS-CUSTOMER-TOTAL; ADD 1 TO WS-TRANS-COUNT' },
      { ruleId: 'R-CBL-SAR007', description: 'Preserve LAST.customer_id PDV attribute state (SAR-007)', action: 'On LAST.customer_id break, capture non-retained fields from the current record and write summary.' }
    ]
  },
  {
    puId: 'PU-AGG-001',
    sourceStepIds: ['STEP-015'],
    targetProgram: 'CBLSL003',
    inputs: [
      { ddName: 'SALESRT', datasetName: 'WORKLIB.SALES_SORTED', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'REGSUM', datasetName: 'WORKLIB.REGION_SUMMARY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-AGG-001', description: 'PROC SUMMARY by region and channel', action: 'Control break on REGION and CHANNEL. Accumulate GROSS, DISCOUNT, and NET amounts.' }
    ]
  },
  {
    puId: 'PU-AGG-002',
    sourceStepIds: ['STEP-016'],
    targetProgram: 'CBLSL003',
    inputs: [
      { ddName: 'SALESRT', datasetName: 'WORKLIB.SALES_SORTED', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'REGMEAN', datasetName: 'WORKLIB.REGION_MEANS', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-AGG-002', description: 'PROC MEANS by region', action: 'Control break on REGION. Compute MEAN-NET = SUM-NET / COUNT-RECORDS and MEAN-QTY = SUM-QTY / COUNT-RECORDS.' }
    ]
  },
  {
    puId: 'PU-AGG-003',
    sourceStepIds: ['STEP-017'],
    targetProgram: 'CBLSL003',
    inputs: [
      { ddName: 'SALESRT', datasetName: 'WORKLIB.SALES_SORTED', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'REGFRQ', datasetName: 'WORKLIB.REGION_CHANNEL_FREQ', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-AGG-003', description: 'PROC FREQ region by channel crosstab', action: 'Count cell frequencies and derive relative percentages.' }
    ]
  },
  {
    puId: 'PU-PIV-001',
    sourceStepIds: ['STEP-018'],
    targetProgram: 'CBLSL003',
    inputs: [
      { ddName: 'REGSUM', datasetName: 'WORKLIB.REGION_SUMMARY', recordFormat: 'FB', recordLength: 120 }
    ],
    outputs: [
      { ddName: 'REGWIDE', datasetName: 'WORKLIB.REGION_SUMMARY_WIDE', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-PIV-001', description: 'PROC TRANSPOSE region summary to wide OCCURS', action: 'Pivot metric rows into wide record columns (METRIC_TOTAL_REV, METRIC_TOTAL_DISC, METRIC_NET).' }
    ]
  },

  // Block 3: Relational Sales Enrichment & Business Rule Engine (Steps 19-24)
  {
    puId: 'PU-ENR-001',
    sourceStepIds: ['STEP-019'],
    targetProgram: 'CBLSL004',
    inputs: [
      { ddName: 'SALESRT', datasetName: 'WORKLIB.SALES_SORTED', recordFormat: 'FB', recordLength: 180 },
      { ddName: 'CUSTSRT', datasetName: 'WORKLIB.CUSTOMER_SORTED', recordFormat: 'FB', recordLength: 150 },
      { ddName: 'PRODSRT', datasetName: 'WORKLIB.PRODUCT_SORTED', recordFormat: 'FB', recordLength: 200 }
    ],
    outputs: [
      { ddName: 'ENRSALE', datasetName: 'WORKLIB.ENRICHED_SALES', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'RULE-007', description: 'Relational 3-way join and band derivation', action: 'Join sales on customer_id and product_id; derive VALUE_BAND (HIGH/MED/LOW) and PRICING_BAND.' }
    ]
  },
  {
    puId: 'PU-ENR-002',
    sourceStepIds: ['STEP-020'],
    targetProgram: 'CBLSL004',
    inputs: [
      { ddName: 'ENRSALE', datasetName: 'WORKLIB.ENRICHED_SALES', recordFormat: 'FB', recordLength: 260 }
    ],
    outputs: [
      { ddName: 'SALERULE', datasetName: 'WORKLIB.SALES_RULES', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'RULE-008', description: 'Evaluate transaction risk and priority rules', action: 'Assign RISK_FLAG (LARGE_TRANSACTION, HIGH_DISCOUNT) and PRIORITY (CRITICAL, HIGH, STANDARD).' }
    ]
  },
  {
    puId: 'PU-SRT-005',
    sourceStepIds: ['STEP-021'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.SALES_RULES', recordFormat: 'FB', recordLength: 280 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.SALES_RULES_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-005', description: 'Sort sales rules by priority and risk_flag', action: 'DFSORT SORT FIELDS=(1,12,CH,A,13,20,CH,A)' }
    ]
  },
  {
    puId: 'PU-ENR-003',
    sourceStepIds: ['STEP-022'],
    targetProgram: 'CBLSL004',
    inputs: [
      { ddName: 'RULESRT', datasetName: 'WORKLIB.SALES_RULES_SORTED', recordFormat: 'FB', recordLength: 280 }
    ],
    outputs: [
      { ddName: 'REVQFIN', datasetName: 'WORKLIB.REVIEW_QUEUE_FINAL', disposition: 'NEW,CATLG' }
    ],
    logicRules: [
      { ruleId: 'R-ENR-003', description: 'Filter high-risk review queue', action: 'IF RISK_FLAG NOT = NORMAL OR PRIORITY NOT = STANDARD THEN WRITE REVIEW_QUEUE_RECORD' }
    ]
  },
  {
    puId: 'PU-ENR-004',
    sourceStepIds: ['STEP-023'],
    targetProgram: 'CBLSL004',
    inputs: [
      { ddName: 'ENRSALE', datasetName: 'WORKLIB.ENRICHED_SALES', recordFormat: 'FB', recordLength: 260 }
    ],
    outputs: [
      { ddName: 'CATSUM', datasetName: 'WORKLIB.CATEGORY_SUMMARY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-ENR-004', description: 'SQL category summary aggregation', action: 'Aggregate gross, discount, and net totals by product category.' }
    ]
  },
  {
    puId: 'PU-ENR-005',
    sourceStepIds: ['STEP-024'],
    targetProgram: 'CBLSL004',
    inputs: [
      { ddName: 'ENRSALE', datasetName: 'WORKLIB.ENRICHED_SALES', recordFormat: 'FB', recordLength: 260 }
    ],
    outputs: [
      { ddName: 'SUBCSUM', datasetName: 'WORKLIB.SUBCATEGORY_SUMMARY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-ENR-005', description: 'SQL subcategory summary aggregation', action: 'Aggregate sales totals by category and subcategory.' }
    ]
  },

  // Block 4: Customer Tiering, Daily Tracking & Channel Profiles (Steps 25-33)
  {
    puId: 'PU-DLY-001',
    sourceStepIds: ['STEP-025'],
    targetProgram: 'CBLSL005',
    inputs: [
      { ddName: 'CUSTMNTH', datasetName: 'WORKLIB.CUSTOMER_MONTHLY', recordFormat: 'FB', recordLength: 160 }
    ],
    outputs: [
      { ddName: 'CUSTTIER', datasetName: 'WORKLIB.CUSTOMER_TIER', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'RULE-009', description: 'Customer lifetime tier classification', action: 'IF TOTAL_SALES >= 100000 SET PLATINUM; ELSE IF >= 50000 SET GOLD; SET LOYALTY_FLAG Y IF TRANS_COUNT >= 100.' }
    ]
  },
  {
    puId: 'PU-SRT-006',
    sourceStepIds: ['STEP-026'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.CUSTOMER_TIER', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.CUSTOMER_TIER_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-006', description: 'Sort customer tier by customer_id', action: 'DFSORT SORT FIELDS=(1,8,CH,A)' }
    ]
  },
  {
    puId: 'PU-DLY-002',
    sourceStepIds: ['STEP-027'],
    targetProgram: 'CBLSL005',
    inputs: [
      { ddName: 'SALESRT', datasetName: 'WORKLIB.SALES_SORTED', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'DAILYSAL', datasetName: 'WORKLIB.DAILY_SALES', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-DLY-SAR003', description: 'Remediate incompatible sort order (SAR-003)', action: 'Mandate DFSORT by sale_date prior to control break processing; accumulate daily sales.' }
    ]
  },
  {
    puId: 'PU-SRT-007',
    sourceStepIds: ['STEP-028'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.DAILY_SALES', recordFormat: 'FB', recordLength: 120 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.DAILY_SALES_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-007', description: 'Sort daily sales by sale_date', action: 'DFSORT SORT FIELDS=(1,8,CH,A)' }
    ]
  },
  {
    puId: 'PU-PIV-002',
    sourceStepIds: ['STEP-029'],
    targetProgram: 'CBLSL005',
    inputs: [
      { ddName: 'DAILYSAL', datasetName: 'WORKLIB.DAILY_SALES_SORTED', recordFormat: 'FB', recordLength: 120 }
    ],
    outputs: [
      { ddName: 'DAILYWID', datasetName: 'WORKLIB.DAILY_SALES_WIDE', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-PIV-002', description: 'PROC TRANSPOSE daily sales metrics to wide format', action: 'Pivot daily transaction amounts into OCCURS day table.' }
    ]
  },
  {
    puId: 'PU-DLY-003',
    sourceStepIds: ['STEP-030'],
    targetProgram: 'CBLSL005',
    inputs: [
      { ddName: 'CUSTTIER', datasetName: 'WORKLIB.CUSTOMER_TIER_SORTED', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'CUSTFLG', datasetName: 'WORKLIB.CUSTOMER_FLAGS', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-DLY-003', description: 'Assign customer activity and dormancy flags', action: 'Set ACTIVE_FLAG, DORMANCY_STATUS based on days since last transaction.' }
    ]
  },
  {
    puId: 'PU-SRT-008',
    sourceStepIds: ['STEP-031'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.CUSTOMER_FLAGS', recordFormat: 'FB', recordLength: 190 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.CUSTOMER_FLAGS_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-008', description: 'Sort customer flags by customer_id', action: 'DFSORT SORT FIELDS=(1,8,CH,A)' }
    ]
  },
  {
    puId: 'PU-DLY-004',
    sourceStepIds: ['STEP-032'],
    targetProgram: 'CBLSL005',
    inputs: [
      { ddName: 'SALESRT', datasetName: 'WORKLIB.SALES_SORTED', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'RGCHSUM', datasetName: 'WORKLIB.REGION_CHANNEL_SUMMARY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-DLY-004', description: 'PROC SUMMARY by customer_region and sales_channel', action: 'Control break on REGION and CHANNEL; emit summary records.' }
    ]
  },
  {
    puId: 'PU-DLY-005',
    sourceStepIds: ['STEP-033'],
    targetProgram: 'CBLSL005',
    inputs: [
      { ddName: 'SALESRT', datasetName: 'WORKLIB.SALES_SORTED', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'CHFRQ', datasetName: 'WORKLIB.CHANNEL_FREQ', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-DLY-005', description: 'PROC FREQ sales channel distribution', action: 'Count frequency distribution across sales channels.' }
    ]
  },

  // Block 5: Regional Reporting Macro, Audit & Reconciliation Ledger (Steps 34-44)
  {
    puId: 'PU-RPT-001',
    sourceStepIds: ['STEP-034', 'STEP-035', 'STEP-036', 'STEP-037'],
    targetProgram: 'CBLSL006',
    inputs: [
      { ddName: 'SALESRT', datasetName: 'WORKLIB.SALES_SORTED', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'RPTINP', datasetName: 'WORKLIB.REGION_REPORT_INPUT', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-RPT-001', description: 'Parameterized region report input selection', action: 'IF RUN_REGION = ALL THEN PASS ALL RECORDS; ELSE FILTER BY RUN_REGION.' }
    ]
  },
  {
    puId: 'PU-RPT-002',
    sourceStepIds: ['STEP-038'],
    targetProgram: 'CBLSL006',
    inputs: [
      { ddName: 'RPTINP', datasetName: 'WORKLIB.REGION_REPORT_INPUT', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'REGRPT', datasetName: 'WORKLIB.REGION_REPORT', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-RPT-002', description: 'SQL regional sales totals aggregation', action: 'Group by customer_region; aggregate gross_amount, discount_amount, and net_amount.' }
    ]
  },
  {
    puId: 'PU-RPT-003',
    sourceStepIds: ['STEP-039'],
    targetProgram: 'CBLSL006',
    inputs: [
      { ddName: 'REGRPT', datasetName: 'WORKLIB.REGION_REPORT', recordFormat: 'FB', recordLength: 140 },
      { ddName: 'RGCHSUM', datasetName: 'WORKLIB.REGION_CHANNEL_SUMMARY', recordFormat: 'FB', recordLength: 140 }
    ],
    outputs: [
      { ddName: 'FINFEXT', datasetName: 'WORKLIB.FINAL_SALES_EXTRACT', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-RPT-SAR004', description: 'Remediate MERGE key and sort mismatch (SAR-004)', action: 'Mandate DFSORT by customer_region on both input files before sequential match-merge.' }
    ]
  },
  {
    puId: 'PU-SRT-009',
    sourceStepIds: ['STEP-040'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.FINAL_SALES_EXTRACT', recordFormat: 'FB', recordLength: 200 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.FINAL_SALES_EXTRACT_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-009', description: 'Sort final sales extract by region', action: 'DFSORT SORT FIELDS=(1,20,CH,A)' }
    ]
  },
  {
    puId: 'PU-UTL-001',
    sourceStepIds: ['STEP-041'],
    targetProgram: 'IEFBR14',
    inputs: [],
    outputs: [
      { ddName: 'SCRATCH', datasetName: 'WORKLIB.TEMP.*', disposition: 'OLD,DELETE' }
    ],
    logicRules: [
      { ruleId: 'R-UTL-001', description: 'PROC DATASETS scratch cleanup', action: 'Delete intermediate temporary work files.' }
    ]
  },
  {
    puId: 'PU-RPT-004',
    sourceStepIds: ['STEP-042'],
    targetProgram: 'CBLSL006',
    inputs: [
      { ddName: 'FINFEXT', datasetName: 'WORKLIB.FINAL_SALES_EXTRACT_SORTED', recordFormat: 'FB', recordLength: 200 }
    ],
    outputs: [
      { ddName: 'AUDTEXT', datasetName: 'WORKLIB.AUDIT_EXTRACT', disposition: 'NEW,CATLG' }
    ],
    logicRules: [
      { ruleId: 'R-RPT-004', description: 'Generate audit extract records', action: 'Format audit ledger with hash totals and timestamp markers.' }
    ]
  },
  {
    puId: 'PU-RPT-005',
    sourceStepIds: ['STEP-043'],
    targetProgram: 'CBLSL006',
    inputs: [
      { ddName: 'AUDTEXT', datasetName: 'WORKLIB.AUDIT_EXTRACT', recordFormat: 'FB', recordLength: 200 }
    ],
    outputs: [
      { ddName: 'CTRLTOT', datasetName: 'WORKLIB.FINAL_CONTROL_TOTALS', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-RPT-005', description: 'Compute final control totals', action: 'Aggregate row count, sum of total_sales, and expected benchmarks.' }
    ]
  },
  {
    puId: 'PU-RPT-006',
    sourceStepIds: ['STEP-044'],
    targetProgram: 'CBLSL006',
    inputs: [
      { ddName: 'CTRLTOT', datasetName: 'WORKLIB.FINAL_CONTROL_TOTALS', recordFormat: 'FB', recordLength: 100 }
    ],
    outputs: [
      { ddName: 'RECONLED', datasetName: 'WORKLIB.RECONCILIATION', disposition: 'NEW,CATLG' }
    ],
    logicRules: [
      { ruleId: 'RULE-010', description: 'Reconcile final totals against expected benchmarks', action: 'Evaluate match status: MATCH, MISMATCH, or BASELINE_REQUIRED.' },
      { ruleId: 'R-RPT-SAR001', description: 'Remediate infinite loop in conditional SET (SAR-001)', action: 'Read control totals record once in 1000-INITIALIZE; terminate processing upon EOF to avoid infinite looping.' }
    ]
  },

  // Block 6: Customer Segmentation & Delivery Logistics (Steps 45-53)
  {
    puId: 'PU-SEG-001',
    sourceStepIds: ['STEP-045'],
    targetProgram: 'CBLSL007',
    inputs: [
      { ddName: 'ENRSALE', datasetName: 'WORKLIB.ENRICHED_SALES', recordFormat: 'FB', recordLength: 260 }
    ],
    outputs: [
      { ddName: 'SEGROLL', datasetName: 'WORKLIB.SEGMENT_ROLLUP', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SEG-001', description: 'Customer segment rollup aggregation', action: 'Control break on segment; accumulate transaction metrics.' }
    ]
  },
  {
    puId: 'PU-SRT-010',
    sourceStepIds: ['STEP-046'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.SEGMENT_ROLLUP', recordFormat: 'FB', recordLength: 140 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.SEGMENT_ROLLUP_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-010', description: 'Sort segment rollup by segment', action: 'DFSORT SORT FIELDS=(1,20,CH,A)' }
    ]
  },
  {
    puId: 'PU-SEG-002',
    sourceStepIds: ['STEP-047'],
    targetProgram: 'CBLSL007',
    inputs: [
      { ddName: 'SEGROLL', datasetName: 'WORKLIB.SEGMENT_ROLLUP_SORTED', recordFormat: 'FB', recordLength: 140 }
    ],
    outputs: [
      { ddName: 'SEGRANK', datasetName: 'WORKLIB.SEGMENT_RANKED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SEG-SAR010', description: 'Replace monotonic() with deterministic sequence counter (SAR-010)', action: 'ADD 1 TO WS-GENERATED-RANK sequentially after explicit sort.' }
    ]
  },
  {
    puId: 'PU-SEG-003',
    sourceStepIds: ['STEP-048'],
    targetProgram: 'CBLSL007',
    inputs: [
      { ddName: 'ENRSALE', datasetName: 'WORKLIB.ENRICHED_SALES', recordFormat: 'FB', recordLength: 260 }
    ],
    outputs: [
      { ddName: 'EXCEXT', datasetName: 'WORKLIB.EXCEPTION_EXTRACT', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SEG-003', description: 'Extract delivery exceptions', action: 'Filter delivery status exceptions and invalid address indicators.' }
    ]
  },
  {
    puId: 'PU-SEG-004',
    sourceStepIds: ['STEP-049'],
    targetProgram: 'CBLSL007',
    inputs: [
      { ddName: 'EXCEXT', datasetName: 'WORKLIB.EXCEPTION_EXTRACT', recordFormat: 'FB', recordLength: 160 }
    ],
    outputs: [
      { ddName: 'EXCFRQ', datasetName: 'WORKLIB.EXCEPTION_FREQ', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SEG-004', description: 'PROC FREQ exception categories', action: 'Count frequency distribution across exception reasons.' }
    ]
  },
  {
    puId: 'PU-SEG-005',
    sourceStepIds: ['STEP-050'],
    targetProgram: 'CBLSL007',
    inputs: [
      { ddName: 'EXCEXT', datasetName: 'WORKLIB.EXCEPTION_EXTRACT', recordFormat: 'FB', recordLength: 160 }
    ],
    outputs: [
      { ddName: 'EXCSUM', datasetName: 'WORKLIB.EXCEPTION_SUMMARY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SEG-005', description: 'Exception summary totals', action: 'Summarize total exception amounts and impact metrics.' }
    ]
  },
  {
    puId: 'PU-SEG-006',
    sourceStepIds: ['STEP-051'],
    targetProgram: 'CBLSL007',
    inputs: [
      { ddName: 'ENRSALE', datasetName: 'WORKLIB.ENRICHED_SALES', recordFormat: 'FB', recordLength: 260 }
    ],
    outputs: [
      { ddName: 'DELIVMAN', datasetName: 'WORKLIB.DELIVERY_MANIFEST_RAW', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SEG-006', description: 'Delivery manifest relational projection', action: 'Project shipping address, carrier code, and tracking IDs.' }
    ]
  },
  {
    puId: 'PU-SEG-007',
    sourceStepIds: ['STEP-052'],
    targetProgram: 'CBLSL007',
    inputs: [
      { ddName: 'DELIVRAW', datasetName: 'WORKLIB.DELIVERY_MANIFEST_RAW', recordFormat: 'FB', recordLength: 240 }
    ],
    outputs: [
      { ddName: 'MANIFEST', datasetName: 'WORKLIB.DELIVERY_MANIFEST', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SEG-007', description: 'Format delivery manifest records', action: 'Format carrier dispatch lines and dispatch barcodes.' }
    ]
  },
  {
    puId: 'PU-SRT-011',
    sourceStepIds: ['STEP-053'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.DELIVERY_MANIFEST', recordFormat: 'FB', recordLength: 240 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.DELIVERY_MANIFEST_SORTED', disposition: 'NEW,CATLG' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-011', description: 'Sort delivery manifest by customer_id and sale_id', action: 'DFSORT SORT FIELDS=(1,8,CH,A,9,8,CH,A)' }
    ]
  },

  // Block 7: High-Value Filtering, Customer Profile & Scoring Model (Steps 54-70)
  {
    puId: 'PU-SCR-001',
    sourceStepIds: ['STEP-054', 'STEP-055', 'STEP-056'],
    targetProgram: 'CBLSL008',
    inputs: [
      { ddName: 'ENRSALE', datasetName: 'WORKLIB.ENRICHED_SALES', recordFormat: 'FB', recordLength: 260 }
    ],
    outputs: [
      { ddName: 'HIVALOUT', datasetName: 'WORKLIB.HIGH_VALUE_SALES', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SCR-001', description: 'Filter high-value transactions (> 10000)', action: 'IF NET_AMOUNT >= 10000 WRITE HIGH_VALUE_RECORD' }
    ]
  },
  {
    puId: 'PU-SCR-002',
    sourceStepIds: ['STEP-057'],
    targetProgram: 'CBLSL008',
    inputs: [
      { ddName: 'HIVALOUT', datasetName: 'WORKLIB.HIGH_VALUE_SALES', recordFormat: 'FB', recordLength: 260 }
    ],
    outputs: [
      { ddName: 'HIVALSUM', datasetName: 'WORKLIB.HIGH_VALUE_SALES_CUST', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SCR-002', description: 'SQL high-value sales customer aggregation', action: 'Sum high value transactions by customer_id.' }
    ]
  },
  {
    puId: 'PU-SCR-003',
    sourceStepIds: ['STEP-058'],
    targetProgram: 'CBLSL008',
    inputs: [
      { ddName: 'CUSTTIER', datasetName: 'WORKLIB.CUSTOMER_TIER_SORTED', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'CUSTPROF', datasetName: 'WORKLIB.FINAL_CUSTOMER_PROFILE', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SCR-003', description: 'Synthesize customer profile', action: 'Consolidate tier, tenure, and spend attributes.' }
    ]
  },
  {
    puId: 'PU-SRT-012',
    sourceStepIds: ['STEP-059'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.FINAL_CUSTOMER_PROFILE', recordFormat: 'FB', recordLength: 200 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.FINAL_CUSTOMER_PROFILE_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-012', description: 'Sort final customer profile by customer_id', action: 'DFSORT SORT FIELDS=(1,8,CH,A)' }
    ]
  },
  {
    puId: 'PU-SCR-004',
    sourceStepIds: ['STEP-060'],
    targetProgram: 'CBLSL008',
    inputs: [
      { ddName: 'CUSTPROF', datasetName: 'WORKLIB.FINAL_CUSTOMER_PROFILE_SORTED', recordFormat: 'FB', recordLength: 200 }
    ],
    outputs: [
      { ddName: 'PROFSEQ', datasetName: 'WORKLIB.FINAL_CUSTOMER_PROFILE_SEQ', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SCR-004', description: 'Assign sequential customer profile number', action: 'ADD 1 TO WS-PROFILE-SEQ-NUM.' }
    ]
  },
  {
    puId: 'PU-SCR-005',
    sourceStepIds: ['STEP-061'],
    targetProgram: 'CBLSL008',
    inputs: [
      { ddName: 'PROFSEQ', datasetName: 'WORKLIB.FINAL_CUSTOMER_PROFILE_SEQ', recordFormat: 'FB', recordLength: 210 }
    ],
    outputs: [
      { ddName: 'PROFSUM', datasetName: 'WORKLIB.CUSTOMER_PROFILE_SUMMARY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SCR-005', description: 'PROC SUMMARY profile metrics by segment', action: 'Control break on segment; summarize customer metrics.' }
    ]
  },
  {
    puId: 'PU-SCR-006',
    sourceStepIds: ['STEP-062'],
    targetProgram: 'CBLSL008',
    inputs: [
      { ddName: 'PROFSEQ', datasetName: 'WORKLIB.FINAL_CUSTOMER_PROFILE_SEQ', recordFormat: 'FB', recordLength: 210 }
    ],
    outputs: [
      { ddName: 'PROFMET', datasetName: 'WORKLIB.CUSTOMER_PROFILE_METRICS', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SCR-006', description: 'SQL customer profile metrics projection', action: 'Compute segment-level average customer spend.' }
    ]
  },
  {
    puId: 'PU-SCR-007',
    sourceStepIds: ['STEP-063'],
    targetProgram: 'CBLSL008',
    inputs: [
      { ddName: 'PROFSEQ', datasetName: 'WORKLIB.FINAL_CUSTOMER_PROFILE_SEQ', recordFormat: 'FB', recordLength: 210 }
    ],
    outputs: [
      { ddName: 'CUSTSCOR', datasetName: 'WORKLIB.CUSTOMER_SCORING', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SCR-007', description: 'Multi-factor customer scoring model', action: 'COMPUTE SCORE = (SPEND_FACTOR * 0.4) + (FREQ_FACTOR * 0.4) + (RECENCY_FACTOR * 0.2).' }
    ]
  },
  {
    puId: 'PU-SRT-013',
    sourceStepIds: ['STEP-064'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.CUSTOMER_SCORING', recordFormat: 'FB', recordLength: 220 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.CUSTOMER_SCORING_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-013', description: 'Sort customer scoring by score descending', action: 'DFSORT SORT FIELDS=(15,8,PD,D)' }
    ]
  },
  {
    puId: 'PU-SCR-008',
    sourceStepIds: ['STEP-065'],
    targetProgram: 'CBLSL008',
    inputs: [
      { ddName: 'CUSTSCOR', datasetName: 'WORKLIB.CUSTOMER_SCORING_SORTED', recordFormat: 'FB', recordLength: 220 }
    ],
    outputs: [
      { ddName: 'SCORFRQ', datasetName: 'WORKLIB.SCORE_TIER_FREQ', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SCR-008', description: 'PROC FREQ score tier distribution', action: 'Count customer score tier distribution.' }
    ]
  },
  {
    puId: 'PU-SCR-009',
    sourceStepIds: ['STEP-066'],
    targetProgram: 'CBLSL008',
    inputs: [
      { ddName: 'CUSTSCOR', datasetName: 'WORKLIB.CUSTOMER_SCORING_SORTED', recordFormat: 'FB', recordLength: 220 }
    ],
    outputs: [
      { ddName: 'REGSCOR', datasetName: 'WORKLIB.REGION_SCORE_SUMMARY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SCR-009', description: 'PROC SUMMARY score metrics by region', action: 'Summarize score metrics by geographic region.' }
    ]
  },
  {
    puId: 'PU-SCR-010',
    sourceStepIds: ['STEP-067'],
    targetProgram: 'CBLSL008',
    inputs: [
      { ddName: 'REGSCOR', datasetName: 'WORKLIB.REGION_SCORE_SUMMARY', recordFormat: 'FB', recordLength: 140 }
    ],
    outputs: [
      { ddName: 'SCORSUM', datasetName: 'WORKLIB.SCORE_SUMMARY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SCR-010', description: 'Format score statistics', action: 'Derive regional score deciles and benchmark tiers.' }
    ]
  },
  {
    puId: 'PU-SCR-011',
    sourceStepIds: ['STEP-068'],
    targetProgram: 'CBLSL008',
    inputs: [
      { ddName: 'SCORSUM', datasetName: 'WORKLIB.SCORE_SUMMARY', recordFormat: 'FB', recordLength: 140 }
    ],
    outputs: [
      { ddName: 'REGBNCH', datasetName: 'WORKLIB.REGION_SCORE_BENCHMARKS', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SCR-011', description: 'SQL regional score benchmark calculation', action: 'Project regional benchmark values for score comparisons.' }
    ]
  },
  {
    puId: 'PU-SCR-012',
    sourceStepIds: ['STEP-069'],
    targetProgram: 'CBLSL008',
    inputs: [
      { ddName: 'CUSTSCOR', datasetName: 'WORKLIB.CUSTOMER_SCORING_SORTED', recordFormat: 'FB', recordLength: 220 },
      { ddName: 'REGBNCH', datasetName: 'WORKLIB.REGION_SCORE_BENCHMARKS', recordFormat: 'FB', recordLength: 120 }
    ],
    outputs: [
      { ddName: 'RCSCRFLG', datasetName: 'WORKLIB.REGION_CUSTOMER_SCORE_FLAGS', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SCR-012', description: 'Assign benchmark comparison flags', action: 'Set ABOVE_BENCHMARK_FLAG if customer score exceeds regional average.' }
    ]
  },
  {
    puId: 'PU-SRT-014',
    sourceStepIds: ['STEP-070'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.REGION_CUSTOMER_SCORE_FLAGS', recordFormat: 'FB', recordLength: 230 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.REGION_CUSTOMER_SCORE_FLAGS_SORTED', disposition: 'NEW,CATLG' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-014', description: 'Sort score flags by region and customer_id', action: 'DFSORT SORT FIELDS=(1,20,CH,A,21,8,CH,A)' }
    ]
  },

  // Block 8: Product Performance, Seasonality & Data Quality Validation (Steps 71-84)
  {
    puId: 'PU-PRD-001',
    sourceStepIds: ['STEP-071'],
    targetProgram: 'CBLSL009',
    inputs: [
      { ddName: 'ENRSALE', datasetName: 'WORKLIB.ENRICHED_SALES', recordFormat: 'FB', recordLength: 260 }
    ],
    outputs: [
      { ddName: 'PRDPRF', datasetName: 'WORKLIB.PRODUCT_PERFORMANCE_RAW', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-PRD-001', description: 'SQL product sales performance join', action: 'Aggregate sales by product_id and category.' }
    ]
  },
  {
    puId: 'PU-PRD-002',
    sourceStepIds: ['STEP-072'],
    targetProgram: 'CBLSL009',
    inputs: [
      { ddName: 'PRDPRF', datasetName: 'WORKLIB.PRODUCT_PERFORMANCE_RAW', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'PRDPERF', datasetName: 'WORKLIB.PRODUCT_PERFORMANCE', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-PRD-002', description: 'Calculate product margin and profit', action: 'COMPUTE MARGIN = (NET_REVENUE - TOTAL_COST) / NET_REVENUE.' }
    ]
  },
  {
    puId: 'PU-SRT-015',
    sourceStepIds: ['STEP-073'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.PRODUCT_PERFORMANCE', recordFormat: 'FB', recordLength: 190 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.PRODUCT_PERFORMANCE_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-015', description: 'Sort product performance by category, net_revenue', action: 'DFSORT SORT FIELDS=(1,40,CH,A,41,8,PD,D)' }
    ]
  },
  {
    puId: 'PU-PRD-003',
    sourceStepIds: ['STEP-074'],
    targetProgram: 'CBLSL009',
    inputs: [
      { ddName: 'PRDPERF', datasetName: 'WORKLIB.PRODUCT_PERFORMANCE_SORTED', recordFormat: 'FB', recordLength: 190 }
    ],
    outputs: [
      { ddName: 'CATREV', datasetName: 'WORKLIB.CATEGORY_REVENUE_TOTALS', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-PRD-003', description: 'PROC SUMMARY category revenue totals', action: 'Control break on category; sum net revenues.' }
    ]
  },
  {
    puId: 'PU-PRD-004',
    sourceStepIds: ['STEP-075'],
    targetProgram: 'CBLSL009',
    inputs: [
      { ddName: 'PRDPERF', datasetName: 'WORKLIB.PRODUCT_PERFORMANCE_SORTED', recordFormat: 'FB', recordLength: 190 }
    ],
    outputs: [
      { ddName: 'PRDCFRQ', datasetName: 'WORKLIB.PRODUCT_CATEGORY_FREQ', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-PRD-004', description: 'PROC FREQ product category counts', action: 'Count frequency of active products per category.' }
    ]
  },
  {
    puId: 'PU-PRD-005',
    sourceStepIds: ['STEP-076'],
    targetProgram: 'CBLSL009',
    inputs: [
      { ddName: 'ENRSALE', datasetName: 'WORKLIB.ENRICHED_SALES', recordFormat: 'FB', recordLength: 260 }
    ],
    outputs: [
      { ddName: 'PERIODFL', datasetName: 'WORKLIB.SALES_PERIOD_FLAGS', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-PRD-005', description: 'Assign seasonality and holiday flags', action: 'Set QUARTER_TAG, HOLIDAY_IND based on sale_date calendar table.' }
    ]
  },
  {
    puId: 'PU-SRT-016',
    sourceStepIds: ['STEP-077'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.SALES_PERIOD_FLAGS', recordFormat: 'FB', recordLength: 270 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.SALES_PERIOD_FLAGS_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-016', description: 'Sort sales period flags by period_tag', action: 'DFSORT SORT FIELDS=(1,10,CH,A)' }
    ]
  },
  {
    puId: 'PU-PRD-006',
    sourceStepIds: ['STEP-078'],
    targetProgram: 'CBLSL009',
    inputs: [
      { ddName: 'PERIODFL', datasetName: 'WORKLIB.SALES_PERIOD_FLAGS_SORTED', recordFormat: 'FB', recordLength: 270 }
    ],
    outputs: [
      { ddName: 'QTRSUM', datasetName: 'WORKLIB.QUARTERLY_SALES_SUMMARY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-PRD-006', description: 'PROC SUMMARY quarterly sales summary', action: 'Control break on QUARTER_TAG; summarize quarterly metrics.' }
    ]
  },
  {
    puId: 'PU-PRD-007',
    sourceStepIds: ['STEP-079'],
    targetProgram: 'CBLSL009',
    inputs: [
      { ddName: 'PERIODFL', datasetName: 'WORKLIB.SALES_PERIOD_FLAGS_SORTED', recordFormat: 'FB', recordLength: 270 }
    ],
    outputs: [
      { ddName: 'HOLSUM', datasetName: 'WORKLIB.HOLIDAY_SALES_SUMMARY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-PRD-007', description: 'PROC SUMMARY holiday sales summary', action: 'Control break on HOLIDAY_IND; summarize holiday transaction totals.' }
    ]
  },
  {
    puId: 'PU-PRD-008',
    sourceStepIds: ['STEP-080'],
    targetProgram: 'CBLSL009',
    inputs: [
      { ddName: 'PERIODFL', datasetName: 'WORKLIB.SALES_PERIOD_FLAGS_SORTED', recordFormat: 'FB', recordLength: 270 }
    ],
    outputs: [
      { ddName: 'PERVAR', datasetName: 'WORKLIB.PERIOD_VARIANCE_ANALYSIS', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-PRD-008', description: 'SQL period variance analysis', action: 'Compute period-over-period percentage variance in revenue.' }
    ]
  },
  {
    puId: 'PU-QAL-001',
    sourceStepIds: ['STEP-081'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'RAW.SALES', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.SALES_DUPLICATE_CHECK', disposition: 'NEW,PASS' },
      { ddName: 'XSUM', datasetName: 'WORKLIB.SALES_DUPLICATES', disposition: 'NEW,CATLG' }
    ],
    logicRules: [
      { ruleId: 'R-QAL-SAR012', description: 'PROC SORT NODUPKEY DUPOUT= via DFSORT (SAR-012)', action: 'DFSORT SORT FIELDS=(1,8,CH,A) with SUM FIELDS=NONE and XSUM output DD routing.' }
    ]
  },
  {
    puId: 'PU-QAL-002',
    sourceStepIds: ['STEP-082'],
    targetProgram: 'CBLSL010',
    inputs: [
      { ddName: 'SALEDUP', datasetName: 'WORKLIB.SALES_DUPLICATE_CHECK', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'SALEQAL', datasetName: 'WORKLIB.SALES_QUALITY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-QAL-SAR009', description: 'Evaluate data quality with 88-level null sentinels (SAR-009)', action: 'Check 88-level sentinels explicitly before testing < 0 to prevent SAS missing value misclassification.' }
    ]
  },
  {
    puId: 'PU-QAL-003',
    sourceStepIds: ['STEP-083'],
    targetProgram: 'CBLSL010',
    inputs: [
      { ddName: 'SALEQAL', datasetName: 'WORKLIB.SALES_QUALITY', recordFormat: 'FB', recordLength: 200 }
    ],
    outputs: [
      { ddName: 'QALFRQ', datasetName: 'WORKLIB.QUALITY_FLAG_FREQ', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-QAL-003', description: 'PROC FREQ quality flag distribution', action: 'Count occurrence frequencies across quality validation flags.' }
    ]
  },
  {
    puId: 'PU-QAL-010',
    sourceStepIds: ['STEP-084'],
    targetProgram: 'CBLSL010',
    inputs: [
      { ddName: 'SALEQAL', datasetName: 'WORKLIB.SALES_QUALITY', recordFormat: 'FB', recordLength: 200 }
    ],
    outputs: [
      { ddName: 'QALSUM', datasetName: 'WORKLIB.QUALITY_METRIC_SUMMARY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-QAL-010', description: 'SQL quality metrics summary', action: 'Calculate defect rate percentage and data quality scorecard.' }
    ]
  },

  // Block 9: Customer Activity, Running Sales & Volatility Metrics (Steps 85-96)
  {
    puId: 'PU-ACT-001',
    sourceStepIds: ['STEP-085'],
    targetProgram: 'CBLSL011',
    inputs: [
      { ddName: 'ENRSALE', datasetName: 'WORKLIB.ENRICHED_SALES', recordFormat: 'FB', recordLength: 260 }
    ],
    outputs: [
      { ddName: 'ACTRAW', datasetName: 'WORKLIB.CUSTOMER_ACTIVITY_RAW', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-ACT-001', description: 'SQL customer historical activity aggregation', action: 'Aggregate order counts and lifetime spend per customer.' }
    ]
  },
  {
    puId: 'PU-ACT-002',
    sourceStepIds: ['STEP-086'],
    targetProgram: 'CBLSL011',
    inputs: [
      { ddName: 'ACTRAW', datasetName: 'WORKLIB.CUSTOMER_ACTIVITY_RAW', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'CUSTACT', datasetName: 'WORKLIB.CUSTOMER_ACTIVITY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-ACT-002', description: 'Evaluate RFM customer activity status', action: 'Classify activity: ACTIVE, AT_RISK, CHURNED based on days since last purchase.' }
    ]
  },
  {
    puId: 'PU-SRT-017',
    sourceStepIds: ['STEP-087'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.CUSTOMER_ACTIVITY', recordFormat: 'FB', recordLength: 190 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.CUSTOMER_ACTIVITY_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-017', description: 'Sort customer activity by customer_id', action: 'DFSORT SORT FIELDS=(1,8,CH,A)' }
    ]
  },
  {
    puId: 'PU-ACT-003',
    sourceStepIds: ['STEP-088'],
    targetProgram: 'CBLSL011',
    inputs: [
      { ddName: 'CUSTACT', datasetName: 'WORKLIB.CUSTOMER_ACTIVITY_SORTED', recordFormat: 'FB', recordLength: 190 }
    ],
    outputs: [
      { ddName: 'ACTFRQ', datasetName: 'WORKLIB.ACTIVITY_STATUS_FREQ', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-ACT-003', description: 'PROC FREQ activity status counts', action: 'Count frequency distribution across customer activity segments.' }
    ]
  },
  {
    puId: 'PU-ACT-004',
    sourceStepIds: ['STEP-089'],
    targetProgram: 'CBLSL011',
    inputs: [
      { ddName: 'CUSTACT', datasetName: 'WORKLIB.CUSTOMER_ACTIVITY_SORTED', recordFormat: 'FB', recordLength: 190 }
    ],
    outputs: [
      { ddName: 'REGACT', datasetName: 'WORKLIB.REGION_ACTIVITY_SUMMARY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-ACT-004', description: 'PROC SUMMARY regional activity summary', action: 'Control break on region; summarize customer activity metrics.' }
    ]
  },
  {
    puId: 'PU-ACT-005',
    sourceStepIds: ['STEP-090'],
    targetProgram: 'CBLSL011',
    inputs: [
      { ddName: 'REGACT', datasetName: 'WORKLIB.REGION_ACTIVITY_SUMMARY', recordFormat: 'FB', recordLength: 160 }
    ],
    outputs: [
      { ddName: 'REGCTRL', datasetName: 'WORKLIB.REGION_CONTROLS', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-ACT-005', description: 'Calculate regional control limits', action: 'Compute upper and lower control limits (mean +/- 2*sigma).' }
    ]
  },
  {
    puId: 'PU-ACT-006',
    sourceStepIds: ['STEP-091'],
    targetProgram: 'CBLSL011',
    inputs: [
      { ddName: 'REGCTRL', datasetName: 'WORKLIB.REGION_CONTROLS', recordFormat: 'FB', recordLength: 170 }
    ],
    outputs: [
      { ddName: 'CTRLFRQ', datasetName: 'WORKLIB.CONTROL_VIOLATIONS_FREQ', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-ACT-006', description: 'PROC FREQ control violations', action: 'Count occurrences of regional threshold violations.' }
    ]
  },
  {
    puId: 'PU-ACT-007',
    sourceStepIds: ['STEP-092'],
    targetProgram: 'CBLSL011',
    inputs: [
      { ddName: 'REGCTRL', datasetName: 'WORKLIB.REGION_CONTROLS', recordFormat: 'FB', recordLength: 170 }
    ],
    outputs: [
      { ddName: 'REGVAR', datasetName: 'WORKLIB.REGION_VARIANCE_SUMMARY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-ACT-007', description: 'SQL region variance aggregation', action: 'Aggregate total control breaches by territory.' }
    ]
  },
  {
    puId: 'PU-ACT-008',
    sourceStepIds: ['STEP-093'],
    targetProgram: 'CBLSL011',
    inputs: [
      { ddName: 'ENRSALE', datasetName: 'WORKLIB.ENRICHED_SALES', recordFormat: 'FB', recordLength: 260 }
    ],
    outputs: [
      { ddName: 'RUNSALE', datasetName: 'WORKLIB.REGION_RUNNING_SALES', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-ACT-008', description: 'Compute cumulative running totals', action: 'RETAIN WS-RUNNING-TOTAL; ADD NET_AMOUNT TO WS-RUNNING-TOTAL per region.' }
    ]
  },
  {
    puId: 'PU-SRT-018',
    sourceStepIds: ['STEP-094'],
    targetProgram: 'SORT',
    inputs: [
      { ddName: 'SORTIN', datasetName: 'WORKLIB.REGION_RUNNING_SALES', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'SORTOUT', datasetName: 'WORKLIB.REGION_RUNNING_SALES_SORTED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-SRT-018', description: 'Sort running sales by region, sale_date', action: 'DFSORT SORT FIELDS=(1,20,CH,A,21,8,CH,A)' }
    ]
  },
  {
    puId: 'PU-ACT-009',
    sourceStepIds: ['STEP-095'],
    targetProgram: 'CBLSL011',
    inputs: [
      { ddName: 'RUNSRT', datasetName: 'WORKLIB.REGION_RUNNING_SALES_SORTED', recordFormat: 'FB', recordLength: 180 }
    ],
    outputs: [
      { ddName: 'RUNDELTA', datasetName: 'WORKLIB.REGION_RUNNING_SALES_DELTA', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-ACT-009', description: 'Calculate running sales delta', action: 'COMPUTE DELTA = CURRENT_RUNNING - PREVIOUS_RUNNING.' }
    ]
  },
  {
    puId: 'PU-ACT-010',
    sourceStepIds: ['STEP-096'],
    targetProgram: 'CBLSL011',
    inputs: [
      { ddName: 'RUNDELTA', datasetName: 'WORKLIB.REGION_RUNNING_SALES_DELTA', recordFormat: 'FB', recordLength: 190 }
    ],
    outputs: [
      { ddName: 'DELTASUM', datasetName: 'WORKLIB.RUNNING_DELTA_SUMMARY', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-ACT-010', description: 'PROC SUMMARY running delta summary', action: 'Summarize running sales deltas across reporting regions.' }
    ]
  },

  // Block 10: Lookup Enrichment, Edge Cases & Operational Dashboard (Steps 97-104)
  {
    puId: 'PU-FIN-001',
    sourceStepIds: ['STEP-097'],
    targetProgram: 'CBLSL012',
    inputs: [
      { ddName: 'PRODSRT', datasetName: 'WORKLIB.PRODUCT_SORTED', recordFormat: 'FB', recordLength: 200 }
    ],
    outputs: [
      { ddName: 'LOOKTAB', datasetName: 'WORKLIB.PRODUCT_LOOKUP_TABLE', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-FIN-001', description: 'SQL prepare in-memory product lookup table', action: 'Select product_id, category, and target margin into indexed table.' }
    ]
  },
  {
    puId: 'PU-FIN-002',
    sourceStepIds: ['STEP-098'],
    targetProgram: 'CBLSL012',
    inputs: [
      { ddName: 'ENRSALE', datasetName: 'WORKLIB.ENRICHED_SALES', recordFormat: 'FB', recordLength: 260 },
      { ddName: 'LOOKTAB', datasetName: 'WORKLIB.PRODUCT_LOOKUP_TABLE', recordFormat: 'FB', recordLength: 120 }
    ],
    outputs: [
      { ddName: 'SALELKUP', datasetName: 'WORKLIB.SALES_LOOKUP_ENRICHED', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-FIN-002', description: 'Sequential match-merge with in-memory lookup table', action: 'Match sale on product_id; populate target margin and variance.' }
    ]
  },
  {
    puId: 'PU-FIN-003',
    sourceStepIds: ['STEP-099'],
    targetProgram: 'CBLSL012',
    inputs: [
      { ddName: 'SALELKUP', datasetName: 'WORKLIB.SALES_LOOKUP_ENRICHED', recordFormat: 'FB', recordLength: 280 }
    ],
    outputs: [
      { ddName: 'LKUPFRQ', datasetName: 'WORKLIB.LOOKUP_MATCH_RATE_FREQ', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-FIN-003', description: 'PROC FREQ lookup match rate', action: 'Compute percentage of transactions successfully enriched.' }
    ]
  },
  {
    puId: 'PU-FIN-004',
    sourceStepIds: ['STEP-100'],
    targetProgram: 'CBLSL012',
    inputs: [
      { ddName: 'ENRSALE', datasetName: 'WORKLIB.ENRICHED_SALES', recordFormat: 'FB', recordLength: 260 }
    ],
    outputs: [
      { ddName: 'EDGECAS', datasetName: 'WORKLIB.SEMANTIC_EDGE_CASES', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-FIN-004', description: 'Evaluate semantic edge case boundaries', action: 'Validate boundary conditions for zero discount, special missings, and max numeric values.' }
    ]
  },
  {
    puId: 'PU-FIN-005',
    sourceStepIds: ['STEP-101'],
    targetProgram: 'CBLSL012',
    inputs: [
      { ddName: 'EDGECAS', datasetName: 'WORKLIB.SEMANTIC_EDGE_CASES', recordFormat: 'FB', recordLength: 220 }
    ],
    outputs: [
      { ddName: 'EDGEFRQ', datasetName: 'WORKLIB.EDGE_CASE_FREQ', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-FIN-005', description: 'PROC FREQ edge case categories', action: 'Count occurrences of edge-case boundary triggers.' }
    ]
  },
  {
    puId: 'PU-FIN-006',
    sourceStepIds: ['STEP-102'],
    targetProgram: 'CBLSL012',
    inputs: [
      { ddName: 'ENRSALE', datasetName: 'WORKLIB.ENRICHED_SALES', recordFormat: 'FB', recordLength: 260 },
      { ddName: 'RECONLED', datasetName: 'WORKLIB.RECONCILIATION', recordFormat: 'FB', recordLength: 120 }
    ],
    outputs: [
      { ddName: 'DASHRAW', datasetName: 'WORKLIB.OPERATIONAL_DASHBOARD_RAW', disposition: 'NEW,PASS' }
    ],
    logicRules: [
      { ruleId: 'R-FIN-006', description: 'SQL operational dashboard cross-domain rollup', action: 'Consolidate operational metrics, record counts, and reconciliation status.' }
    ]
  },
  {
    puId: 'PU-FIN-007',
    sourceStepIds: ['STEP-103'],
    targetProgram: 'CBLSL012',
    inputs: [
      { ddName: 'DASHRAW', datasetName: 'WORKLIB.OPERATIONAL_DASHBOARD_RAW', recordFormat: 'FB', recordLength: 280 }
    ],
    outputs: [
      { ddName: 'DASHOUT', datasetName: 'WORKLIB.OPERATIONAL_DASHBOARD', disposition: 'NEW,CATLG' }
    ],
    logicRules: [
      { ruleId: 'R-FIN-007', description: 'Format operational dashboard scorecard', action: 'Format KPIs, balance check results, and execution telemetry.' }
    ]
  },
  {
    puId: 'PU-FIN-008',
    sourceStepIds: ['STEP-104'],
    targetProgram: 'CBLSL012',
    inputs: [
      { ddName: 'DASHOUT', datasetName: 'WORKLIB.OPERATIONAL_DASHBOARD', recordFormat: 'FB', recordLength: 280 }
    ],
    outputs: [
      { ddName: 'SYSPRINT', datasetName: 'SYSOUT', disposition: 'SYSOUT=*' }
    ],
    logicRules: [
      { ruleId: 'R-FIN-008', description: 'PROC PRINT operational dashboard report', action: 'Write formatted report lines to SYSOUT print stream with page headers.' }
    ]
  }
];

// Verify 100% step coverage
const allStepIds = new Set(steps.map(s => s.stepId));
const coveredStepIds = new Set();
processingUnits.forEach(pu => {
  pu.sourceStepIds.forEach(id => coveredStepIds.add(id));
});

const uncoveredSteps = [...allStepIds].filter(id => !coveredStepIds.has(id));
if (uncoveredSteps.length > 0) {
  console.error(`ERROR: Uncovered steps: ${uncoveredSteps.join(', ')}`);
  process.exit(1);
} else {
  console.log(`Verified 100% step coverage across ${processingUnits.length} Processing Units (${coveredStepIds.size} of ${allStepIds.size} steps mapped).`);
}

fs.writeFileSync(
  path.join(p2Dir, 'processing-unit-contracts.json'),
  JSON.stringify({ processingUnits }, null, 2)
);
console.log(`Saved processing-unit-contracts.json with ${processingUnits.length} PUs.`);

// =========================================================================
// 5. DATA MODEL COPYBOOKS (Derived from authentic Phase 1 variables)
// =========================================================================
console.log('5. Generating data-model-copybooks.json...');

function makeCobolName(str) {
  return str.toUpperCase().replace(/[^A-Z0-9]/g, '-');
}

const copybooks = pdm.datasets.map((ds, idx) => {
  const dsBase = ds.datasetName.split('.')[1] || ds.datasetName;
  const shortName = dsBase.substring(0, 6).replace(/[^A-Z0-9]/g, '');
  const copybookName = `CP${shortName}${String(idx + 1).padStart(2, '0')}`.substring(0, 8);
  const recordName = `${makeCobolName(dsBase)}-RECORD`;

  const fields = (ds.variables || []).map(v => {
    let picClause = 'PIC X(20)';
    let usage = 'DISPLAY';

    if (v.type === 'NUM') {
      if (v.name.includes('DATE') || v.name.includes('DAY') || v.name.includes('YEAR') || v.name.includes('PERIOD')) {
        picClause = 'PIC 9(8)';
        usage = 'DISPLAY';
      } else if (v.semanticRole === 'MEASURE' || v.name.includes('AMOUNT') || v.name.includes('TOTAL') || v.name.includes('PRICE') || v.name.includes('PCT') || v.name.includes('DISCOUNT') || v.name.includes('MARGIN') || v.name.includes('SCORE') || v.name.includes('DELTA') || v.name.includes('REVENUE')) {
        picClause = 'PIC S9(9)V99';
        usage = 'COMP-3';
      } else if (v.semanticRole === 'BUSINESS_IDENTIFIER' || v.name.includes('ID') || v.name.includes('COUNT') || v.name.includes('RANK') || v.name.includes('NUM') || v.name.includes('FREQ')) {
        picClause = 'PIC S9(9)';
        usage = 'COMP-3';
      } else {
        picClause = 'PIC S9(9)V99';
        usage = 'COMP-3';
      }
    } else {
      const len = v.length || 30;
      picClause = `PIC X(${len})`;
      usage = 'DISPLAY';
    }

    return {
      level: '05',
      name: `${makeCobolName(shortName)}-${makeCobolName(v.name)}`,
      picClause,
      usage,
      sourceVariable: v.name
    };
  });

  // Ensure record has at least one field
  if (fields.length === 0) {
    fields.push({
      level: '05',
      name: `${makeCobolName(shortName)}-FILLER`,
      picClause: 'PIC X(80)',
      usage: 'DISPLAY',
      sourceVariable: 'RECORD_PAYLOAD'
    });
  }

  return {
    copybookName,
    recordName,
    fields
  };
});

fs.writeFileSync(
  path.join(p2Dir, 'data-model-copybooks.json'),
  JSON.stringify({ copybooks }, null, 2)
);
console.log(`Saved data-model-copybooks.json with ${copybooks.length} copybooks.`);

// =========================================================================
// 6. EXECUTION FLOW (Mainframe Job Stream Sequencing)
// =========================================================================
console.log('6. Generating execution-flow.json...');

const executionSteps = [
  {
    stepNumber: 1,
    stepName: 'STEP010_INGEST',
    programOrUtility: 'CBLSL001',
    inputs: ['RAW.CUSTOMERS', 'RAW.PRODUCTS', 'RAW.SALES', 'PARMLIB.CONFIG.SALES'],
    outputs: ['&&CUSTOMER_BASE', '&&PRODUCT_BASE', '&&SALES_BASE'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 2,
    stepName: 'STEP020_SRTCUST',
    programOrUtility: 'SORT',
    inputs: ['&&CUSTOMER_BASE'],
    outputs: ['&&CUSTOMER_SORTED'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 3,
    stepName: 'STEP030_SRTPROD',
    programOrUtility: 'SORT',
    inputs: ['&&PRODUCT_BASE'],
    outputs: ['&&PRODUCT_SORTED'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 4,
    stepName: 'STEP040_SRTSALE',
    programOrUtility: 'SORT',
    inputs: ['&&SALES_BASE'],
    outputs: ['&&SALES_SORTED'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 5,
    stepName: 'STEP050_MRGCUST',
    programOrUtility: 'CBLSL002',
    inputs: ['&&CUSTOMER_SORTED', '&&SALES_SORTED'],
    outputs: ['&&CUSTOMER_SALES'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 6,
    stepName: 'STEP060_SRTCSAL',
    programOrUtility: 'SORT',
    inputs: ['&&CUSTOMER_SALES'],
    outputs: ['&&CUSTOMER_SALES_SORTED'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 7,
    stepName: 'STEP070_CUSTMNTH',
    programOrUtility: 'CBLSL002',
    inputs: ['&&CUSTOMER_SALES_SORTED'],
    outputs: ['&&CUSTOMER_MONTHLY'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 8,
    stepName: 'STEP080_AGGREG1',
    programOrUtility: 'CBLSL003',
    inputs: ['&&SALES_SORTED'],
    outputs: ['&&REGION_SUMMARY', '&&REGION_MEANS', '&&REGION_CHANNEL_FREQ', '&&REGION_SUMMARY_WIDE'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 9,
    stepName: 'STEP090_ENRICH',
    programOrUtility: 'CBLSL004',
    inputs: ['&&SALES_SORTED', '&&CUSTOMER_SORTED', '&&PRODUCT_SORTED'],
    outputs: ['&&ENRICHED_SALES', '&&SALES_RULES', '&&CATEGORY_SUMMARY', '&&SUBCATEGORY_SUMMARY'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 10,
    stepName: 'STEP100_SRTRULE',
    programOrUtility: 'SORT',
    inputs: ['&&SALES_RULES'],
    outputs: ['&&SALES_RULES_SORTED'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 11,
    stepName: 'STEP110_REVQ',
    programOrUtility: 'CBLSL004',
    inputs: ['&&SALES_RULES_SORTED'],
    outputs: ['PROD.SALES.REVIEW.QUEUE'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 12,
    stepName: 'STEP120_DAILYTR',
    programOrUtility: 'CBLSL005',
    inputs: ['&&CUSTOMER_MONTHLY', '&&SALES_SORTED'],
    outputs: ['&&CUSTOMER_TIER', '&&DAILY_SALES', '&&CUSTOMER_FLAGS', '&&REGION_CHANNEL_SUMMARY', '&&CHANNEL_FREQ'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 13,
    stepName: 'STEP130_SRTDLY',
    programOrUtility: 'SORT',
    inputs: ['&&DAILY_SALES'],
    outputs: ['&&DAILY_SALES_SORTED'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 14,
    stepName: 'STEP140_PIVDLY',
    programOrUtility: 'CBLSL005',
    inputs: ['&&DAILY_SALES_SORTED'],
    outputs: ['&&DAILY_SALES_WIDE'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 15,
    stepName: 'STEP150_REGRPT',
    programOrUtility: 'CBLSL006',
    inputs: ['&&SALES_SORTED', '&&REGION_CHANNEL_SUMMARY'],
    outputs: ['&&REGION_REPORT', '&&FINAL_SALES_EXTRACT'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 16,
    stepName: 'STEP160_SRTRPT',
    programOrUtility: 'SORT',
    inputs: ['&&FINAL_SALES_EXTRACT'],
    outputs: ['&&FINAL_SALES_EXTRACT_SORTED'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 17,
    stepName: 'STEP170_CLEANUP',
    programOrUtility: 'IEFBR14',
    inputs: [],
    outputs: ['&&TEMP_SCRATCH'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 18,
    stepName: 'STEP180_RECON1',
    programOrUtility: 'CBLSL006',
    inputs: ['&&FINAL_SALES_EXTRACT_SORTED'],
    outputs: ['PROD.SALES.AUDIT.EXTRACT', '&&FINAL_CONTROL_TOTALS', 'PROD.SALES.RECONCILIATION.LEDGER'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 19,
    stepName: 'STEP190_SEGMENT',
    programOrUtility: 'CBLSL007',
    inputs: ['&&ENRICHED_SALES'],
    outputs: ['&&SEGMENT_ROLLUP', '&&EXCEPTION_EXTRACT', '&&DELIVERY_MANIFEST_RAW'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 20,
    stepName: 'STEP200_SRTSEG',
    programOrUtility: 'SORT',
    inputs: ['&&SEGMENT_ROLLUP'],
    outputs: ['&&SEGMENT_ROLLUP_SORTED'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 21,
    stepName: 'STEP210_SEGRANK',
    programOrUtility: 'CBLSL007',
    inputs: ['&&SEGMENT_ROLLUP_SORTED', '&&EXCEPTION_EXTRACT', '&&DELIVERY_MANIFEST_RAW'],
    outputs: ['&&SEGMENT_RANKED', '&&EXCEPTION_SUMMARY', 'PROD.SALES.DELIVERY.MANIFEST'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 22,
    stepName: 'STEP220_SCORING',
    programOrUtility: 'CBLSL008',
    inputs: ['&&ENRICHED_SALES', '&&CUSTOMER_TIER'],
    outputs: ['&&HIGH_VALUE_SALES', '&&FINAL_CUSTOMER_PROFILE', '&&CUSTOMER_SCORING'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 23,
    stepName: 'STEP230_SRTSCR',
    programOrUtility: 'SORT',
    inputs: ['&&CUSTOMER_SCORING'],
    outputs: ['&&CUSTOMER_SCORING_SORTED'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 24,
    stepName: 'STEP240_SCOREBNCH',
    programOrUtility: 'CBLSL008',
    inputs: ['&&CUSTOMER_SCORING_SORTED'],
    outputs: ['&&SCORE_SUMMARY', '&&REGION_SCORE_BENCHMARKS', 'PROD.SALES.REGION.SCORE.FLAGS'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 25,
    stepName: 'STEP250_PRODUCT',
    programOrUtility: 'CBLSL009',
    inputs: ['&&ENRICHED_SALES'],
    outputs: ['&&PRODUCT_PERFORMANCE', '&&SALES_PERIOD_FLAGS'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 26,
    stepName: 'STEP260_SRTPRD',
    programOrUtility: 'SORT',
    inputs: ['&&PRODUCT_PERFORMANCE'],
    outputs: ['&&PRODUCT_PERFORMANCE_SORTED'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 27,
    stepName: 'STEP270_PRDSUM',
    programOrUtility: 'CBLSL009',
    inputs: ['&&PRODUCT_PERFORMANCE_SORTED', '&&SALES_PERIOD_FLAGS'],
    outputs: ['&&CATEGORY_REVENUE_TOTALS', '&&QUARTERLY_SALES_SUMMARY', '&&PERIOD_VARIANCE_ANALYSIS'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 28,
    stepName: 'STEP280_DEDUP',
    programOrUtility: 'SORT',
    inputs: ['RAW.SALES'],
    outputs: ['&&SALES_DUPLICATE_CHECK', 'PROD.SALES.DUPLICATES.EXCEPTION'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 29,
    stepName: 'STEP290_QUALITY',
    programOrUtility: 'CBLSL010',
    inputs: ['&&SALES_DUPLICATE_CHECK'],
    outputs: ['PROD.SALES.QUALITY.RECORDS', '&&QUALITY_FLAG_FREQ', '&&QUALITY_METRIC_SUMMARY'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 30,
    stepName: 'STEP300_ACTIVTY',
    programOrUtility: 'CBLSL011',
    inputs: ['&&ENRICHED_SALES'],
    outputs: ['&&CUSTOMER_ACTIVITY', '&&REGION_CONTROLS', '&&REGION_RUNNING_SALES'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 31,
    stepName: 'STEP310_SRTACT',
    programOrUtility: 'SORT',
    inputs: ['&&CUSTOMER_ACTIVITY'],
    outputs: ['&&CUSTOMER_ACTIVITY_SORTED'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 32,
    stepName: 'STEP320_SRTRUN',
    programOrUtility: 'SORT',
    inputs: ['&&REGION_RUNNING_SALES'],
    outputs: ['&&REGION_RUNNING_SALES_SORTED'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 33,
    stepName: 'STEP330_RUNSUM',
    programOrUtility: 'CBLSL011',
    inputs: ['&&CUSTOMER_ACTIVITY_SORTED', '&&REGION_RUNNING_SALES_SORTED'],
    outputs: ['&&REGION_RUNNING_SALES_DELTA', '&&RUNNING_DELTA_SUMMARY'],
    conditionCodeHandling: 'COND=(0,NE)'
  },
  {
    stepNumber: 34,
    stepName: 'STEP340_DASHBRD',
    programOrUtility: 'CBLSL012',
    inputs: ['&&ENRICHED_SALES', 'PROD.SALES.RECONCILIATION.LEDGER', '&&PRODUCT_SORTED'],
    outputs: ['PROD.SALES.OPERATIONAL.DASHBOARD', 'SYSOUT'],
    conditionCodeHandling: 'COND=(0,NE)'
  }
];

fs.writeFileSync(
  path.join(p2Dir, 'execution-flow.json'),
  JSON.stringify({ executionSteps }, null, 2)
);
console.log(`Saved execution-flow.json with ${executionSteps.length} execution steps.`);

// =========================================================================
// 7. RECONCILIATION REQUIREMENTS (Dual-run balancing controls)
// =========================================================================
console.log('7. Generating reconciliation-requirements.json...');

const controls = [
  {
    controlId: 'CTRL-REC-001',
    sourceEntity: 'RAW.CUSTOMERS',
    targetEntity: 'WORKLIB.CUSTOMER_BASE',
    metricType: 'RECORD_COUNT',
    tolerance: 0
  },
  {
    controlId: 'CTRL-REC-002',
    sourceEntity: 'RAW.SALES',
    targetEntity: 'WORKLIB.SALES_BASE',
    metricType: 'RECORD_COUNT',
    tolerance: 0
  },
  {
    controlId: 'CTRL-SUM-001',
    sourceEntity: 'RAW.SALES',
    targetEntity: 'WORKLIB.SALES_BASE',
    metricType: 'COLUMN_SUM',
    targetField: 'gross_amount',
    tolerance: 0.01
  },
  {
    controlId: 'CTRL-SUM-002',
    sourceEntity: 'RAW.SALES',
    targetEntity: 'WORKLIB.SALES_BASE',
    metricType: 'COLUMN_SUM',
    targetField: 'net_amount',
    tolerance: 0.01
  },
  {
    controlId: 'CTRL-BAL-001',
    sourceEntity: 'WORKLIB.SALES_BASE',
    targetEntity: 'WORKLIB.SALES_BASE',
    metricType: 'BALANCING_CHECK',
    targetField: 'gross_minus_discount_equals_net',
    tolerance: 0.01
  },
  {
    controlId: 'CTRL-REC-003',
    sourceEntity: 'WORKLIB.SALES_SORTED',
    targetEntity: 'WORKLIB.CUSTOMER_SALES',
    metricType: 'RECORD_COUNT',
    tolerance: 0
  },
  {
    controlId: 'CTRL-SUM-003',
    sourceEntity: 'WORKLIB.CUSTOMER_SALES',
    targetEntity: 'WORKLIB.CUSTOMER_MONTHLY',
    metricType: 'COLUMN_SUM',
    targetField: 'customer_total',
    tolerance: 0.01
  },
  {
    controlId: 'CTRL-HSH-001',
    sourceEntity: 'WORKLIB.CUSTOMER_BASE',
    targetEntity: 'WORKLIB.CUSTOMER_SORTED',
    metricType: 'HASH_TOTAL',
    targetField: 'customer_id',
    tolerance: 0
  },
  {
    controlId: 'CTRL-HSH-002',
    sourceEntity: 'WORKLIB.SALES_BASE',
    targetEntity: 'WORKLIB.SALES_SORTED',
    metricType: 'HASH_TOTAL',
    targetField: 'sale_id',
    tolerance: 0
  },
  {
    controlId: 'CTRL-SUM-004',
    sourceEntity: 'WORKLIB.ENRICHED_SALES',
    targetEntity: 'WORKLIB.CATEGORY_SUMMARY',
    metricType: 'COLUMN_SUM',
    targetField: 'net_amount',
    tolerance: 0.01
  },
  {
    controlId: 'CTRL-REC-004',
    sourceEntity: 'RAW.SALES',
    targetEntity: 'WORKLIB.SALES_DUPLICATE_CHECK',
    metricType: 'RECORD_COUNT',
    tolerance: 0
  },
  {
    controlId: 'CTRL-BAL-002',
    sourceEntity: 'WORKLIB.FINAL_CONTROL_TOTALS',
    targetEntity: 'WORKLIB.RECONCILIATION',
    metricType: 'BALANCING_CHECK',
    targetField: 'row_count_and_sales_tolerance',
    tolerance: 0.01
  },
  {
    controlId: 'CTRL-SUM-005',
    sourceEntity: 'WORKLIB.CUSTOMER_SCORING',
    targetEntity: 'WORKLIB.SCORE_SUMMARY',
    metricType: 'COLUMN_SUM',
    targetField: 'customer_score',
    tolerance: 0.05
  },
  {
    controlId: 'CTRL-BAL-003',
    sourceEntity: 'WORKLIB.OPERATIONAL_DASHBOARD',
    targetEntity: 'WORKLIB.OPERATIONAL_DASHBOARD',
    metricType: 'BALANCING_CHECK',
    targetField: 'reconciliation_status_equals_MATCH',
    tolerance: 0
  }
];

fs.writeFileSync(
  path.join(p2Dir, 'reconciliation-requirements.json'),
  JSON.stringify({ controls }, null, 2)
);
console.log(`Saved reconciliation-requirements.json with ${controls.length} controls.`);

console.log('All 7 Phase 2 JSON deliverables successfully generated.');
