---
name: migration-design
description: Triggers Phase 2 Migration Reasoning and Architecture Design. Validates Phase 1 artifacts, decomposes SAS PROCs into multi-stage mainframe execution units, specifies Processing Unit (PU) contracts, copybook models, job flow, and reconciliation requirements in workspace/phase-2-migration/.
---

# /migration-design Skill

Executes **Phase 2: Migration Reasoning & Target Design**.

## Instructions
1. **Pre-check Quality Gate 1**:
   - Run `node .claude/hooks/gate-validator.js --phase 1` using `PowerShell`.
   - If Gate 1 fails, HALT immediately and report that Phase 1 must be completed and compliant first.
2. **Launch Subagent**:
   - Invoke the `migration-architect` subagent using the `Agent` tool.
   - Pass all Phase 1 artifact summaries as context.
3. **Generate Phase 2 Artifacts**:
   - Ensure the subagent populates `workspace/phase-2-migration/`:
     - `migration-strategy.json`
     - `proc-decomposition.json`
     - `target-cobol-architecture.json`
     - `processing-unit-contracts.json`
     - `data-model-copybooks.json`
     - `execution-flow.json`
     - `reconciliation-requirements.json`
4. **Enforce Gate 2**:
   - Execute `node .claude/hooks/gate-validator.js --phase 2` using `PowerShell`.
   - Report the gate status table to the user.
