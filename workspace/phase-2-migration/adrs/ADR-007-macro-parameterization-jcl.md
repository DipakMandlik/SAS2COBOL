# ADR-007: SAS Macro Parameterization via JCL SET Symbols and SYSIN Control Cards

## Status
**ACCEPTED**

## Context
The source workload contains 4 macro definitions and 4 macro call steps:
- `STEP-004`: `%set_run_context(region=ALL, min_amount=100)`
- `STEP-005`: `%choose_period(period=MONTHLY)`
- `STEP-037`: `%build_region_report(region=&RUN_REGION)`
- `STEP-056`: `%parameterized_filter(input=..., output=..., threshold=10000)`

## Decision
Macro compilation and execution are transformed into standard mainframe operational parameters:
1. **JCL SET Symbols**: Global run context variables are declared as JCL symbols:
   `// SET RUNREG='ALL'`
   `// SET MINAMT=100`
   `// SET PERIOD='MONTHLY'`
   `// SET THRESH=10000`
2. **SYSIN Parameter Passing**: Passed to COBOL programs via standard 80-byte `SYSIN` control cards or `PARM='...' ` strings in the JCL `EXEC` statement, parsed in `1000-INITIALIZE`.

## Consequences
- Eliminates reliance on proprietary SAS macro preprocessors.
- Fully compatible with enterprise batch scheduling tools (CA-7, Tivoli Workload Scheduler, Control-M).
