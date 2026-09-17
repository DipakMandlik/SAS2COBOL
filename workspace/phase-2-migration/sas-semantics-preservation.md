# SAS Semantics Preservation Plan (Phase 2 Target Design)

## 1. Executive Summary
This document formalizes the target COBOL engineering techniques for preserving legacy SAS Program Data Vector (PDV) runtime semantics, control break boundaries, stateful accumulators, and defect remediation.

---

## 2. Program Data Vector (PDV) Lifecycle Preservation
| SAS Semantic Feature | Legacy SAS Behavior | Target COBOL v6.x Implementation |
| :--- | :--- | :--- |
| **Descriptor vs Execution** | Compile-time variable table; automatic loop per input observation. | Explicit `FILE SECTION` record descriptions; procedural `PERFORM UNTIL WS-EOF` loop. |
| **Non-Retained Fields** | Reset to system missing (`.` or blank) at start of each observation. | Explicit `INITIALIZE WS-DETAIL-RECORD` paragraph executed at the top of record processing loop. |
| **RETAIN Statement** | Preserves variable values across DATA step iterations without reset. | Declared in `WORKING-STORAGE SECTION` with explicit `VALUE` clauses; excluded from `INITIALIZE`. |
| **SUM Statement (`var + expr;`)** | Implicit `RETAIN`, initialized to 0, treats missing values as 0. | Declared in `WORKING-STORAGE` with `PIC S9(...)V99 COMP-3 VALUE ZERO`; uses `ADD ... TO ...`. |
| **Automatic `_N_`** | Tracks DATA step loop iteration count. | Explicit accumulator: `ADD 1 TO WS-ITERATION-COUNTER`. |
| **Automatic `_ERROR_`** | Binary flag set to 1 upon mathematical or conversion faults. | Condition evaluations with `ON SIZE ERROR` handling setting `WS-ERROR-SW`. |
| **Explicit vs Implicit OUTPUT** | Default emission at bottom of loop unless explicit `OUTPUT` statement is present. | Procedural `WRITE OUTPUT-RECORD` executed strictly inside conditional logic paths matching source SAS. |

---

## 3. Control-Break & BY-Group Semantics
- **FIRST.byvar & LAST.byvar**:
  - Mainframe programs track `WS-PREV-KEY` in `WORKING-STORAGE`.
  - `FIRST.byvar` is true when `WS-FIRST-RECORD-SW = 'Y'` or `CURRENT-KEY NOT = WS-PREV-KEY`.
  - `LAST.byvar` is true when next read shows key difference or `AT END`.
  - Group finalization and accumulator resets occur deterministically on boundaries.

---

## 4. Match-Merge Overwrite Semantics (SAR-006)
- When two datasets merged by key share common variables, SAS rightmost dataset values overwrite preceding values in the PDV.
- In COBOL program `CBLSL002`, input record copybooks preserve distinct names (`CUST-REGION` and `SALE-REGION`).
- The procedural assignment explicitly performs:
  `MOVE SALE-REGION TO OUT-REGION`
  guaranteeing byte-exact equivalence with SAS output.

---

## 5. Defect-Aware Remediation Mapping
| Defect ID | Source Step | Defect Description | Target COBOL / JCL Remediation |
| :--- | :--- | :--- | :--- |
| **SAR-001** | `STEP-044` | Infinite loop in conditional `SET` without `STOP` | Read control totals once in `1000-INITIALIZE`; terminate processing upon detail file EOF. |
| **SAR-002** | `STEP-006` | Unanchored `FIRST.customer_id` without `BY` | Execute unconditional string trimming via `MOVE FUNCTION TRIM(CUST-NAME) TO OUT-CUST-NAME`. |
| **SAR-003** | `STEP-027` | Incompatible sort sequence (`BY sale_date`) | Insert mandatory JCL DFSORT step `STEP130_SRTDLY` sorting input by `sale_date`. |
| **SAR-004** | `STEP-039` | MERGE key/sorting mismatch | Insert mandatory JCL DFSORT step `STEP160_SRTRPT` sorting summary by `customer_region`. |
| **SAR-009** | `STEP-082` | Missing value inequality anomaly (`. < 0` is true) | Implement 88-level null/missing sentinels; evaluate missingness explicitly before testing `< 0`. |
| **SAR-010** | `STEP-047` | Non-deterministic `monotonic()` function | Replace with sequential line counter (`ADD 1 TO WS-ROW-COUNTER`) after explicit sort. |
| **SAR-012** | `STEP-081` | `PROC SORT NODUPKEY DUPOUT=` exception routing | Execute DFSORT with `SUM FIELDS=NONE` routing unique to `SORTOUT` and duplicates to `XSUM` DD. |
