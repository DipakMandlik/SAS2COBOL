---
name: trace-audit
description: Triggers Independent Traceability and Quality Audit for Phase 3. Traverses the graph from SAS source to generated COBOL, checks 100% statement coverage, enforces zero-orphan policy, runs static analysis, and produces the final certified migration manifest.
---

# /trace-audit Skill

Executes **Independent Quality, Traceability & Orphan Audit**.

## Instructions
1. **Launch Subagent**:
   - Invoke the `quality-auditor` subagent using the `Agent` tool.
2. **Audit Objectives**:
   - **Bidirectional Traceability**: Verify that every SAS line is mapped in `output/traceability/traceability-matrix.json` with 100% coverage.
   - **Zero-Orphan Check**: Ensure 0 source orphans and 0 target orphans in `output/review/orphan-detection.json`.
   - **Static Analysis**: Scan all `.cbl` files in `output/cobol/` for Area A/B margin compliance, `FILE STATUS` error checks, and undeclared identifiers.
   - **Package Certification**: Compute SHA256 hashes of all artifacts and generate `output/manifests/migration-manifest.json`.
3. **Enforce Gate 3**:
   - Run `node .claude/hooks/gate-validator.js --phase 3` using `PowerShell`.
   - Report the final audit score and certification verdict.
