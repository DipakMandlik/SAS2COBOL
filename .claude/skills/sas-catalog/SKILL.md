---
name: sas-catalog
description: Triggers Phase 1 SAS Source Cataloging and Understanding. Ingests all raw .sas files in input/sas/, parses statements, reconstructs physical data models, profiles PROCs, extracts dataset lineage, extracts business rules, builds semantic intermediate models, audits traps, runs independent quality review, and validates Gate 1.
---

# /sas-catalog Skill

Executes **Phase 1: SAS Understanding & Semantic Modeling**.

## Instructions
1. **Source Discovery**:
   - Inspect `input/sas/` using `Glob` for all `.sas`, `.mac`, or `.inc` files.
   - If `input/sas/` contains no SAS source files, halt and inform the user to place SAS source files in `input/sas/`.
2. **Launch SAS Analyst**:
   - Invoke the `sas-analyst` subagent using the `Agent` tool to process the discovered source files.
   - Ensure the subagent writes the 8 primary understanding artifacts into `workspace/phase-1-understanding/`:
     - `source-inventory.json`
     - `physical-data-model.json`
     - `proc-semantic-catalog.json`
     - `dependency-graph.json`
     - `sas-traps-ledger.json`
     - `business-rules.json`
     - `semantic-model.json`
     - `uncertainty-assumptions-register.json`
3. **Launch Quality Auditor (Independent Phase 1 Review)**:
   - Invoke the `quality-auditor` subagent using the `Agent` tool to independently inspect all generated artifacts.
   - Ensure it produces:
     - `workspace/phase-1-understanding/phase-1-review.json`
     - `workspace/phase-1-understanding/phase-1-review.md`
4. **Enforce Gate 1**:
   - Execute `node .claude/hooks/gate-validator.js --phase 1` using `PowerShell`.
   - Report the gate status table to the user.
