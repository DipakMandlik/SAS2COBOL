# SAS Implicit Loop Mechanics & Execution Flow

## 1. The Implicit Record Loop
A SAS `DATA` step without explicit `DO WHILE` or `DO UNTIL` constructs executes an automatic, implicit outer loop over its input data source.

```sas
DATA WORK.TARGET;
    SET WORK.SOURCE;
    NEW_VAR = OLD_VAR * 1.10;
RUN;
```

### Execution Flow Sequence:
1. Initialize iteration: reset non-retained variables to missing.
2. Read one observation from `WORK.SOURCE` into the PDV.
3. If End-Of-File (EOF) is reached on input, terminate the DATA step immediately.
4. Execute statements (`NEW_VAR = OLD_VAR * 1.10;`).
5. Execute implicit `OUTPUT`: write current PDV observation to `WORK.TARGET`.
6. Execute implicit `RETURN`: jump back to Step 1.

---

## 2. Explicit `OUTPUT` Overrides
If an explicit `OUTPUT` statement exists anywhere in the DATA step, SAS **disables the automatic implicit output at the bottom**.

```sas
DATA WORK.HIGH WORK.LOW;
    SET WORK.SOURCE;
    IF SCORE >= 700 THEN OUTPUT WORK.HIGH;
    ELSE OUTPUT WORK.LOW;
RUN;
```
If a path has no `OUTPUT` statement executed, the record is dropped.

---

## 3. COBOL Target Implementation Pattern

In COBOL, this implicit behavior must be rendered as an explicit `PERFORM ... UNTIL` loop driving an input read and output dispatch paragraph.

```cobol
       2000-PROCESS-RECORDS.
           PERFORM 2100-READ-INPUT
           PERFORM 2200-PROCESS-SINGLE-RECORD
               UNTIL WS-INPUT-EOF.

       2100-READ-INPUT.
           READ INPUT-FILE INTO WS-INPUT-RECORD
               AT END
                   SET WS-INPUT-EOF TO TRUE
               NOT AT END
                   ADD 1 TO WS-RECORDS-READ
           END-READ.

       2200-PROCESS-SINGLE-RECORD.
           PERFORM 2210-RESET-COMPUTED-FIELDS
           PERFORM 2220-APPLY-BUSINESS-LOGIC
           PERFORM 2230-WRITE-OUTPUT
           PERFORM 2100-READ-INPUT.
```
