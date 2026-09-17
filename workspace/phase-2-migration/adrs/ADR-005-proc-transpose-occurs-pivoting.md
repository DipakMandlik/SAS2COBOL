# ADR-005: PROC TRANSPOSE Transformation to Static COBOL OCCURS Tables

## Status
**ACCEPTED**

## Context
The source workload contains two `PROC TRANSPOSE` steps:
- `STEP-018`: Pivots `WORKLIB.region_summary` metrics into wide record format (`WORKLIB.region_summary_wide`).
- `STEP-029`: Pivots `WORKLIB.daily_sales` into wide format (`WORKLIB.daily_sales_wide`).

## Decision
We implement a **Static OCCURS Pivoting Pattern**:
1. Input files are strictly pre-sorted by grouping keys (`REGION` or `SALE_DATE`).
2. Target COBOL copybooks (`CPRWID01`, `CPDWID01`) define fixed-length records with explicit `OCCURS N TIMES` tables or named columnar fields:
   ```cobol
   01  WS-WIDE-REGION-RECORD.
       05  WS-WR-REGION           PIC X(20).
       05  WS-WR-TOTAL-REV        PIC S9(11)V99 COMP-3.
       05  WS-WR-TOTAL-DISC       PIC S9(11)V99 COMP-3.
       05  WS-WR-NET-REV          PIC S9(11)V99 COMP-3.
   ```
3. Procedural logic accumulates/assigns values during the control break and writes the single wide record upon boundary transition.

## Consequences
- Avoids dynamic memory allocation.
- Guarantees predictable record layouts for downstream mainframe consumers.
