# ADR-001: Mainframe Sorting Strategy — Native DFSORT Utility vs Internal COBOL SORT

## Status
**ACCEPTED**

## Context
The source SAS workload (`SYN_ENTERPRISE_SALES_MODERNIZATION.sas`) contains 19 distinct `PROC SORT` invocations, including key reordering, multi-key composite sorting, and deduplication with duplicate routing (`NODUPKEY DUPOUT=`, step `STEP-081`). In mainframe target design, two primary sorting architectures exist:
1. Native JCL DFSORT / SyncSort utility steps.
2. Internal COBOL `SORT ... USING ... GIVING` or `INPUT PROCEDURE / OUTPUT PROCEDURE`.

## Decision
We mandate **Native JCL DFSORT steps** for all dataset ordering operations in the batch flow:
1. **Performance & Memory**: DFSORT utilizes z/Architecture hardware sorting instructions, hyperspace/memory objects, and optimized multi-track EXCP I/O, outperforming COBOL internal sort routines by 3x-5x on high-volume sequential datasets.
2. **Decoupling & Modularity**: External sorting keeps COBOL programs single-purposed (read pre-ordered stream, evaluate logic, write output), minimizing WORKING-STORAGE footprint and simplifying program maintenance.
3. **NODUPKEY & Exception Routing**: For `STEP-081` (`PROC SORT NODUPKEY DUPOUT=WORKLIB.sales_duplicates`), DFSORT natively emulates this semantic via `SUM FIELDS=NONE` with the `XSUM` DD statement, directing duplicate records directly to an exception dataset without procedural code.

## Consequences
- Requires JCL job streams to include explicit `EXEC PGM=SORT` steps prior to control break COBOL programs.
- Temporary sorted datasets are passed via system temporary datasets (`&&TEMP`) or generation data groups (GDGs).
