# SAS-to-COBOL Migration Intelligence Platform — Operational Rules

## 1. Architectural Philosophy
This repository implements an enterprise-grade AI migration engineering framework for transforming legacy SAS workloads (DATA steps, PROCs, macros, SQL) into maintainable, modular IBM Enterprise COBOL (v6.x / ANSI-85) and JCL job streams.

**Core Axiom**: Migration is an engineering discipline, not mechanical code translation.
`SAS Source Text → LLM → COBOL` is strictly prohibited. All migrations must proceed through three explicit, bounded, and audited phases.

---

## 2. Strict Phase Boundaries & Gate Enforcements

```
PHASE 1: UNDERSTAND       PHASE 2: REASON & DESIGN       PHASE 3: GENERATE & REVIEW
┌───────────────────┐    ┌────────────────────────┐    ┌─────────────────────────┐
│ SAS Source Scan   │    │ PROC Decomposition     │    │ COBOL & Copybooks       │
│ Physical Lineage  ├───►│ Processing Units (PUs) ├───►│ JCL Streams / DB2 SQL   │
│ Semantic Profiles │    │ Target COBOL Topology  │    │ Traceability Matrix     │
│ SAS Traps Ledger  │    │ Copybook Contracts     │    │ Static & Orphan Audits  │
└─────────┬─────────┘    └───────────┬────────────┘    └────────────┬────────────┘
          │                          │                              │
    [ GATE 1 PASS ]            [ GATE 2 PASS ]                [ GATE 3 PASS ]
```

### Phase 1: Understand (Source Understanding & Physical/Semantic Modeling)
- **Objective**: Reconstruct the ground-truth physical data model, dataset lifecycles, and canonical PROC operations.
- **Strict Prohibition**: Never design target COBOL or JCL in Phase 1.
- **Deliverables**: In `workspace/phase-1-understanding/`:
  - `source-inventory.json`
  - `physical-data-model.json`
  - `proc-semantic-catalog.json`
  - `dependency-graph.json`
  - `sas-traps-ledger.json`
  - `uncertainty-assumptions-register.json`
- **Quality Gate 1**: Run `node .claude/hooks/gate-validator.js --phase 1`. Must exit 0 before Phase 2 begins.

### Phase 2: Reason & Design (Target Mapping, Decomposition & Generation Contracts)
- **Objective**: Decompose monolithic PROCs into multi-stage execution units and establish strict Processing Unit (PU) contracts.
- **Strict Prohibition**: Never write final `.cbl` production source in Phase 2.
- **Deliverables**: In `workspace/phase-2-migration/`:
  - `migration-strategy.json`
  - `proc-decomposition.json`
  - `target-cobol-architecture.json`
  - `processing-unit-contracts.json`
  - `data-model-copybooks.json`
  - `execution-flow.json`
  - `reconciliation-requirements.json`
- **Quality Gate 2**: Run `node .claude/hooks/gate-validator.js --phase 2`. Must exit 0 before Phase 3 begins.

### Phase 3: Generate & Review (Synthesis, Bidirectional Traceability & Certification)
- **Objective**: Synthesize Enterprise COBOL programs, copybooks, JCL, bidirectional traceability matrix, and audit reports.
- **Strict Prohibition**: Never claim compile or runtime validation without execution telemetry.
- **Deliverables**: In `output/`:
  - `cobol/*.cbl`, `copybooks/*.cpy`, `jcl/*.jcl`, `sql/*.sql`
  - `traceability/traceability-matrix.json` (100% statement mapping)
  - `review/static-analysis.json`, `review/orphan-detection.json` (0 source/target orphans)
  - `manifests/migration-manifest.json` (SHA256 package hashes)
- **Quality Gate 3**: Run `node .claude/hooks/gate-validator.js --phase 3`. Must exit 0 for package certification.

---

## 3. Epistemic Standards (Hierarchy of Truth)
1. **Source Ground Truth**: Original `.sas` source code overrides all assumptions.
2. **Deterministic Precedence**:
   $$\text{SAS Source} \succ \text{Phase 1 Models} \succ \text{Phase 2 Contracts} \succ \text{Phase 3 Code}$$
3. **Execution Distinctions**:
   Every artifact, report, and prompt must maintain this distinction:
   $$\mathbf{GENERATED} \neq \mathbf{COMPILED} \neq \mathbf{EXECUTED} \neq \mathbf{VALIDATED}$$
4. **Explicit Uncertainty**: If a parameter, dataset structure, or business rule is ambiguous, tag it as `UNKNOWN` or `REQUIRES_REVIEW`. Never invent business logic.

---

## 4. Subagent Roles (`.claude/agents/*.md`)
- `sas-analyst`: Executes Phase 1 analysis. Extracts physical/semantic metadata from `input/sas/`.
- `migration-architect`: Executes Phase 2 architecture. Decomposes PROCs, specifies PUs, and creates copybook models.
- `cobol-engineer`: Executes Phase 3 generation. Emits ANSI-85 / COBOL 6.x source, copybooks, and JCL.
- `quality-auditor`: Enforces quality gates, audits static Area A/B formatting, and verifies bidirectional traceability.

---

## 5. Available Skills (`.claude/skills/*/SKILL.md`)
- `/sas-catalog`: Run Phase 1 source extraction and artifact generation.
- `/migration-design`: Run Phase 2 PROC decomposition and target architecture design.
- `/cobol-generate`: Run Phase 3 COBOL, copybook, and JCL synthesis.
- `/gate-validate [phase]`: Run deterministic quality gate validation (1, 2, 3, or all).
- `/trace-audit`: Audit bidirectional traceability and verify zero source/target orphans.

---

## 6. Enterprise COBOL Standards
- Target: IBM Enterprise COBOL for z/OS v6.x / ANSI-85 standard.
- Margin Conventions:
  - Cols 1-6: Sequence numbers or spaces.
  - Col 7: Indicator (` `, `*`, `-`).
  - Cols 8-11: Area A (Division headers, Section headers, Paragraph names, 01/77 levels).
  - Cols 12-72: Area B (Statements, continuation lines, 02-49 level items).
  - Cols 73-80: Program ID or blank.
- Arithmetic: Financial numbers must use `COMP-3` (packed decimal).
- File Handling: Strict `FILE STATUS` evaluation after every I/O operation.
