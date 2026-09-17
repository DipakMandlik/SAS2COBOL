---
name: cobol-generate
description: Triggers Phase 3 COBOL Target Generation. Validates Phase 2 contracts and synthesizes ANSI-85 / IBM Enterprise COBOL 6.x programs, copybooks, JCL execution streams, and DB2 SQL queries into output/.
---

# /cobol-generate Skill

Executes **Phase 3: Target Artifact Generation**.

## Instructions
1. **Pre-check Quality Gate 2**:
   - Run `node .claude/hooks/gate-validator.js --phase 2` using `PowerShell`.
   - If Gate 2 fails, HALT immediately.
2. **Launch Subagent**:
   - Invoke the `cobol-engineer` subagent using the `Agent` tool.
   - Instruct it to read `workspace/phase-2-migration/processing-unit-contracts.json` and `data-model-copybooks.json`.
3. **Generate Output Deliverables**:
   - Write structured COBOL source files to `output/cobol/*.cbl`.
   - Write shared copybooks to `output/copybooks/*.cpy`.
   - Write JCL job streams to `output/jcl/*.jcl`.
   - Write DB2 SQL queries or DDL to `output/sql/*.sql` (if applicable).
4. **Initial Verification**:
   - Verify that all generated files have strict Area A/B formatting, valid 88-level conditions, COMP-3 packed decimals for math, and FILE STATUS checks.
