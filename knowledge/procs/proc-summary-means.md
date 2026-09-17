# PROC SUMMARY / PROC MEANS: Decomposition & Control-Break Mapping

## 1. SAS Syntax & Semantics
```sas
PROC SUMMARY DATA=LIB.SALES NWAY MISSING;
    CLASS REGION DIVISION;
    VAR REVENUE UNITS;
    OUTPUT OUT=LIB.REG_SUMMARY (DROP=_TYPE_ _FREQ_)
        SUM(REVENUE)=TOTAL_REV
        MEAN(UNITS)=AVG_UNITS
        N=SALES_COUNT;
RUN;
```
- **`CLASS` vs `BY`**:
  - `BY`: Requires pre-sorted input; outputs observations in BY-group order.
  - `CLASS`: Does not require pre-sorted input (SAS builds internal hash/tree tables).
  - `NWAY`: Restricts output to only the highest hierarchy combination of `CLASS` variables (excludes partial sub-totals and grand totals).
- **`OUTPUT OUT=`**: Directs computed statistics to a dataset. Automatic variables `_TYPE_` and `_FREQ_` are generated.

---

## 2. Target Decomposition Blueprint

Decomposing `PROC SUMMARY` requires a 5-stage sequential architecture:
1. **Stage 1 (Pre-Sort)**: Ensure input file is ordered by grouping keys (`REGION`, `DIVISION`).
2. **Stage 2 (Control-Break Detection)**: Track group keys and identify group boundaries.
3. **Stage 3 (Group Initialization)**: Reset accumulators (`WS-SUM-REV = 0`, `WS-COUNT = 0`).
4. **Stage 4 (Record Accumulation)**: Add measures to accumulators.
5. **Stage 5 (Group Finalization & Output)**: Compute derived metrics (e.g. `MEAN = SUM / COUNT`) and write the aggregated record.

---

## 3. COBOL Control-Break Implementation Pattern

```cobol
       WORKING-STORAGE SECTION.
       01  WS-CONTROL-KEYS.
           05  WS-PREV-REGION       PIC X(10) VALUE SPACES.
           05  WS-PREV-DIVISION     PIC X(10) VALUE SPACES.
           05  WS-FIRST-RECORD-SW   PIC X(1)  VALUE 'Y'.
               88  FIRST-RECORD     VALUE 'Y'.
               88  NOT-FIRST-RECORD VALUE 'N'.

       01  WS-ACCUMULATORS.
           05  WS-TOTAL-REVENUE     PIC S9(11)V99 COMP-3 VALUE 0.
           05  WS-SUM-UNITS         PIC S9(9)     COMP-3 VALUE 0.
           05  WS-SALES-COUNT       PIC S9(9)     COMP-3 VALUE 0.

       PROCEDURE DIVISION.
       2000-PROCESS-RECORDS.
           PERFORM 2100-READ-INPUT
           PERFORM 2200-EVALUATE-RECORD
               UNTIL WS-INPUT-EOF.
           PERFORM 2400-FINALIZE-GROUP.

       2200-EVALUATE-RECORD.
           IF FIRST-RECORD
               MOVE IN-REGION   TO WS-PREV-REGION
               MOVE IN-DIVISION TO WS-PREV-DIVISION
               SET NOT-FIRST-RECORD TO TRUE
           END-IF.

           IF IN-REGION NOT = WS-PREV-REGION
               OR IN-DIVISION NOT = WS-PREV-DIVISION
               PERFORM 2400-FINALIZE-GROUP
               PERFORM 2300-INITIALIZE-GROUP
               MOVE IN-REGION   TO WS-PREV-REGION
               MOVE IN-DIVISION TO WS-PREV-DIVISION
           END-IF.

           PERFORM 2500-ACCUMULATE-METRICS
           PERFORM 2100-READ-INPUT.

       2300-INITIALIZE-GROUP.
           MOVE ZEROES TO WS-TOTAL-REVENUE
                          WS-SUM-UNITS
                          WS-SALES-COUNT.

       2500-ACCUMULATE-METRICS.
           ADD IN-REVENUE TO WS-TOTAL-REVENUE
           ADD IN-UNITS   TO WS-SUM-UNITS
           ADD 1          TO WS-SALES-COUNT.

       2400-FINALIZE-GROUP.
           MOVE WS-PREV-REGION   TO OUT-REGION
           MOVE WS-PREV-DIVISION TO OUT-DIVISION
           MOVE WS-TOTAL-REVENUE TO OUT-TOTAL-REV
           IF WS-SALES-COUNT > 0
               COMPUTE OUT-AVG-UNITS = WS-SUM-UNITS / WS-SALES-COUNT
           ELSE
               MOVE ZEROES TO OUT-AVG-UNITS
           END-IF
           WRITE OUTPUT-RECORD.
```
