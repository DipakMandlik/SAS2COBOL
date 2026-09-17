# Enterprise COBOL 6.x Coding Standards

## 1. Column Formatting & Margins (ANSI-85 / Fixed Format)

```
 1    6 7 8   11 12                                                72 73      80
┌──────┬─┬──────┬────────────────────────────────────────────────────┬──────────┐
│ Seq# │I│Area A│ Area B                                             │ Ident    │
└──────┴─┴──────┴────────────────────────────────────────────────────┴──────────┘
```

- **Cols 1–6 (Sequence Area)**: 6 digits (e.g. `000100`) or 6 spaces.
- **Col 7 (Indicator Area)**:
  - Space (` `): Normal executable line.
  - Asterisk (`*`): Full comment line.
  - Slash (`/`): Comment line with page break in listing.
  - Hyphen (`-`): Continuation of literal string from preceding line.
  - `D`: Debugging line (optional).
- **Cols 8–11 (Area A)**:
  - Division headers (`IDENTIFICATION DIVISION.`, `ENVIRONMENT DIVISION.`, etc.).
  - Section headers (`WORKING-STORAGE SECTION.`, etc.).
  - Paragraph names (`0000-MAIN-PROGRAM.`, `1000-INITIALIZE.`).
  - FD (File Description) and SD (Sort Description) indicators.
  - Record description level numbers `01` and `77`.
- **Cols 12–72 (Area B)**:
  - Subordinate data levels (`02` through `49`, `66`, `88`).
  - All statements, sentences, and imperative clauses (`PERFORM`, `MOVE`, `IF`, `COMPUTE`, etc.).
- **Cols 73–80 (Program Identification)**: Optional program identifier or blank. Never place executable code here.

---

## 2. Structural & Data Standards

### Numeric Representation
- Always use `COMP-3` (packed decimal) for numbers involved in arithmetic, money, or totals:
  ```cobol
  05  WS-TOTAL-AMOUNT          PIC S9(9)V99 COMP-3 VALUE ZEROES.
  ```
- Always include an explicit sign indicator (`S`) unless the business rule strictly forbids negative numbers.
- For integer counters and loop subscripts, use `COMP` or `COMP-4` (`PIC S9(8) COMP`).

### Mandatory I/O Status Checks
Every `OPEN`, `READ`, `WRITE`, `REWRITE`, and `CLOSE` must be followed by an explicit status check:
```cobol
       READ INPUT-FILE INTO WS-INPUT-REC
           AT END
               SET WS-INPUT-EOF TO TRUE
           NOT AT END
               IF WS-INPUT-STATUS NOT = '00'
                   DISPLAY 'ERROR READING INPUT-FILE: ' WS-INPUT-STATUS
                   MOVE 12 TO RETURN-CODE
                   PERFORM 9999-ABEND-ROUTINE
               END-IF
       END-READ.
```

### Prohibited Constructs
- **Unstructured `GO TO`**: Strictly prohibited. Use structured `PERFORM ... UNTIL` and `EVALUATE`.
- **Undeclared Literals in Arithmetic**: Use named Working-Storage constants or level-88 condition names.
