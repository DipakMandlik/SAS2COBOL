# ADR-002: Target Mainframe File Organization & Storage Paradigm

## Status
**ACCEPTED**

## Context
The legacy SAS application operates on 84 datasets (3 raw inputs, 81 intermediate/work datasets). The target z/OS batch architecture must select appropriate physical storage structures among QSAM (Queued Sequential Access Method), VSAM KSDS (Key-Sequenced Data Set), and DB2 relational tables.

## Decision
1. **Primary Transit Streams (QSAM Fixed Blocked - FB)**: All intermediate pipeline datasets are implemented as QSAM sequential files with Fixed Blocked (`RECFM=FB`) format, optimized block sizes (`BLKSIZE=27920` or system-determined), and standard record lengths matching generated copybooks.
2. **In-Memory Lookups**: Steps requiring table lookups (e.g. `STEP-097` / `STEP-098`) load reference data into COBOL WORKING-STORAGE `OCCURS ... INDEXED BY` tables during `1000-INITIALIZE` and use binary search (`SEARCH ALL`), avoiding external VSAM overhead for reference tables with < 10,000 entries.
3. **Permanent Audit & Reconciliation Records**: Final extracts (`REVIEW_QUEUE_FINAL`, `RECONCILIATION`, `DELIVERY_MANIFEST`, `OPERATIONAL_DASHBOARD`) are cataloged as permanent GDG generation datasets (`DISP=(NEW,CATLG,DELETE)`).

## Consequences
- High sequential throughput with minimal DASD footprint.
- Simple restartability at job step boundaries.
