# SAS Missing Values vs COBOL Data Representation

## 1. The SAS Missing Value Trap
In SAS, missing values have unique algebraic and relational semantics that differ fundamentally from SQL `NULL` and COBOL default initialization.

### Numeric Missing Values
- Represented by a period (`.`) or special missing letters (`._`, `.A` through `.Z`).
- **Relational Behavior**: In any comparison, numeric missing values evaluate as **smaller than all real numbers**, including large negative numbers:
  ```sas
  /* In SAS, this condition evaluates to TRUE! */
  IF BALANCE < -9999999 THEN RISK = 'EXTREME';
  /* If BALANCE is missing (.), the condition fires! */
  ```
- **Arithmetic Behavior**: Any arithmetic operation involving a missing value propagates to missing:
  $$\text{VALUE} + . \longrightarrow .$$
  $$\text{VALUE} \times . \longrightarrow .$$
  *(Exception: SAS aggregation functions like `SUM(A, B)` ignore missing values and treat them as zero, unlike `A + B`).*

### Character Missing Values
- Represented by a string containing only blank spaces (`' '`).

---

## 2. COBOL Target Implementation Rules

COBOL has no native concept of numeric `NULL` or missing values. A numeric variable declared as `PIC S9(7)V99 COMP-3` must contain packed decimal digits and a sign nybble. If uninitialized or set to spaces, it causes a `SOC7` data exception abend.

### Migration Strategies for Missing Values

#### Pattern 1: Null Indicator (88-Level Conditions)
Define an accompanying flag or use an 88-level sentinel:
```cobol
       01  WS-BALANCE-AREA.
           05  WS-BALANCE-STATUS        PIC X(1).
               88  WS-BALANCE-IS-MISSING VALUE 'M'.
               88  WS-BALANCE-IS-VALID   VALUE 'V'.
           05  WS-BALANCE               PIC S9(9)V99 COMP-3.
```

#### Pattern 2: Guarded Relational Logic
Where SAS code tests `IF VAR < VALUE`, the COBOL generator must inject a missing-value guard:
```cobol
      * Preserving SAS missing comparison semantics
           IF WS-BALANCE-IS-VALID
               AND WS-BALANCE < -9999999.00
               MOVE 'EXTREME' TO WS-RISK
           END-IF.
```

#### Pattern 3: Aggregation (`SUM` vs `+`)
- SAS `X = A + B;`: If either is missing, result is missing.
- SAS `X = SUM(A, B);`: If `A` is missing and `B` is 100, `X` is 100.
- In COBOL, map `SUM(A, B)` to explicit accumulator checks:
  ```cobol
           MOVE ZEROES TO WS-X.
           IF A-IS-VALID
               ADD WS-A TO WS-X
           END-IF.
           IF B-IS-VALID
               ADD WS-B TO WS-X
           END-IF.
  ```
