# SAS → COBOL AI Migration Intelligence Platform

A deterministic, multi-phase AI migration engineering workspace powered by Claude Code for modernizing legacy SAS systems (DATA steps, PROCs, macros, SQL) into maintainable, modular IBM Enterprise COBOL (v6.x / ANSI-85 standard) and JCL.

---

## 1. Architectural Overview

The platform decomposes the modernization challenge into three discrete, audited phases:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SAS SOURCE WORKLOAD                              │
│                                (input/sas/)                                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 1: SAS SYSTEM UNDERSTANDING                        │
│                           Agent: sas-analyst                                │
│                         Skill: /sas-catalog                                 │
│  - Statement & Macro Inventory          - Dataset Lineage Graph             │
│  - Physical Data Model Reconstruction   - SAS-Specific Semantic Traps       │
│  - Canonical PROC Semantic Catalog      - Uncertainty & Assumptions Ledger  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                              [ QUALITY GATE 1 ]
                     node .claude/hooks/gate-validator.js --phase 1
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   PHASE 2: MIGRATION REASONING & DESIGN                     │
│                        Agent: migration-architect                           │
│                        Skill: /migration-design                             │
│  - Multi-Stage PROC Decomposition       - Data Model & Copybook Contracts   │
│  - Target COBOL Architecture Blueprint  - Execution Topology & JCL Design   │
│  - Processing Unit (PU) Contracts       - Dual-Run Reconciliation Controls  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                              [ QUALITY GATE 2 ]
                     node .claude/hooks/gate-validator.js --phase 2
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 3: TARGET GENERATION & REVIEW                      │
│                  Agents: cobol-engineer & quality-auditor                   │
│                   Skills: /cobol-generate, /trace-audit                     │
│  - Enterprise COBOL 6.x Programs        - Bidirectional Traceability Matrix │
│  - Reusable Copybooks (.cpy)            - Zero-Orphan Verification (0/0)    │
│  - JCL Execution Streams (.jcl)         - Static Area A/B Margin Review     │
│  - DB2 SQL Queries & DDL                - Certified Package Manifest        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                              [ QUALITY GATE 3 ]
                     node .claude/hooks/gate-validator.js --phase 3
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CERTIFIED MIGRATION DELIVERABLE                      │
│                                  (output/)                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Layout

| Directory | Purpose |
| :--- | :--- |
| `CLAUDE.md` | Master operational instructions and quality governance for Claude Code. |
| `.claude/agents/` | Specialized subagent personas (`sas-analyst`, `migration-architect`, `cobol-engineer`, `quality-auditor`). |
| `.claude/skills/` | Custom slash commands (`/sas-catalog`, `/migration-design`, `/cobol-generate`, `/gate-validate`, `/trace-audit`). |
| `.claude/hooks/` | Deterministic Node.js quality gate validator and JSON schemas for Phases 1, 2, and 3. |
| `input/sas/` | Ingestion directory for raw client `.sas` source files, includes, and macros. |
| `knowledge/` | Ground-truth reference manuals (PDV lifecycle, PROC translation guides, match-merge algorithms, COBOL conventions). |
| `workspace/` | Persistent intermediate state holding machine-readable JSON contracts and models. |
| `output/` | Production deliverables: COBOL programs, copybooks, JCL, traceability matrices, and audit reports. |
| `tests/` | Automated test suite verifying quality gates against synthetic test fixtures. |

---

## 3. Workflow Runbook

### Step 1: Deposit Source SAS Code
Place the target `.sas` file(s) into `input/sas/`.

### Step 2: Execute Phase 1 (Understand)
Run the cataloging skill:
```text
/sas-catalog
```
Validate Phase 1 completion:
```text
/gate-validate 1
```

### Step 3: Execute Phase 2 (Reason & Design)
Run the migration design skill:
```text
/migration-design
```
Validate Phase 2 completion:
```text
/gate-validate 2
```

### Step 4: Execute Phase 3 (Generate & Review)
Run the generation and audit skills:
```text
/cobol-generate
/trace-audit
```
Validate final package certification:
```text
/gate-validate 3
```

---

## 4. Deterministic Quality Gates

Every transition between phases is guarded by `.claude/hooks/gate-validator.js` (Node.js stdlib):
- **Gate 1**: Verifies 100% of SAS statements cataloged, all PROCs profiled, dataset lineage closed, and SAS traps cataloged.
- **Gate 2**: Verifies every SAS step mapped to a Processing Unit, copybook PIC definitions assigned, and reconciliation metrics specified.
- **Gate 3**: Verifies 100% bidirectional traceability, 0 source orphans, 0 target orphans, and Area A/B margin compliance.
