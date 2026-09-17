# SAS Program Data Vector (PDV) Lifecycle & Runtime Semantics

## 1. Overview
The Program Data Vector (PDV) is the in-memory logical data buffer that SAS builds during the compile phase and manipulates during the execution phase of a `DATA` step. Understanding its exact lifecycle is critical for correctly translating DATA step behavior to COBOL Working-Storage.

---

## 2. Compile Phase vs Execution Phase

### Compile Phase
1. Reads the DATA step statements sequentially.
2. Identifies all variables and builds the PDV descriptor:
   - Variable name, type (`CHAR` or `NUM`), byte length, format, and informat.
   - Assigns automatic system variables: `_N_` (iteration counter) and `_ERROR_` (data error flag).
3. Establishes the retention flag for each variable:
   - Variables read via `SET`, `MERGE`, `MODIFY`, or `UPDATE` are marked **RETAIN**.
   - Variables explicitly declared in a `RETAIN` statement are marked **RETAIN**.
   - Variables created or computed inside the DATA step without `RETAIN` are marked **RESET**.

### Execution Phase (The Implicit Loop)
For each iteration of the DATA step:
1. **Reset to Missing**:
   - Variables marked **RESET** are initialized to system missing (`.` for numeric, `' '` for character).
   - Variables marked **RETAIN** preserve their values from the previous iteration.
   - `_ERROR_` is reset to 0. `_N_` increments by 1.
2. **Read Input**:
   - `SET` / `MERGE` reads records into the PDV, updating retained values.
3. **Execute Logic**:
   - Executable statements modify variables in the PDV.
4. **Implicit Output and Return**:
   - When control reaches the bottom of the DATA step (or an explicit `OUTPUT` statement), the entire current PDV state (excluding drop/keep variables) is written to the output dataset.
   - Control loops back to the top of the execution phase.

---

## 3. Translation to COBOL Working-Storage

| SAS PDV Concept | COBOL Equivalent Pattern |
| :--- | :--- |
| Retained variables (`RETAIN` / `SET`) | Declared in `WORKING-STORAGE SECTION.`, retaining value across file read loops. |
| Non-retained computed variables | Must be explicitly initialized (e.g. `MOVE SPACES TO WS-VAR`, `MOVE ZEROES TO WS-VAR`) at the start of each record processing iteration. |
| `_N_` automatic variable | Mainframe loop counter: `WS-RECORD-COUNT PIC 9(9) VALUE 0 COMP-3.` |
| `_ERROR_` automatic variable | Mainframe error flag: `WS-ERROR-FLAG PIC 9 VALUE 0.` with 88-levels. |
| Implicit `OUTPUT` | Explicit `WRITE` paragraph at the end of the input processing loop. |
