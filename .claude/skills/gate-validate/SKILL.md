---
name: gate-validate
description: Runs deterministic quality gate validation for Phase 1, Phase 2, Phase 3, or all phases. Usage `/gate-validate [1|2|3|all]`. Reports status tables, schema conformity, and referential integrity checks.
---

# /gate-validate Skill

Executes the deterministic quality gate validation engine.

## Usage
- `/gate-validate 1` — Validate Phase 1 Understanding artifacts.
- `/gate-validate 2` — Validate Phase 2 Migration Reasoning & Design contracts.
- `/gate-validate 3` — Validate Phase 3 Generation, Traceability, and Manifest deliverables.
- `/gate-validate all` — Validate entire pipeline end-to-end.

## Instructions
1. Determine the target phase argument (`1`, `2`, `3`, or `all`). Default to `all` if no argument is provided.
2. Execute the validator using PowerShell:
   ```powershell
   node .claude/hooks/gate-validator.js --phase <ARG>
   ```
3. Relay the stdout report cleanly to the user.
4. If the gate fails, list the specific missing keys, files, or integrity mismatches that must be resolved before proceeding.
