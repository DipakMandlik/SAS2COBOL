# FIRST. and LAST. BY-Group Processing in COBOL

## 1. SAS Syntax & Runtime Semantics
```sas
DATA WORK.CUSTOMER_ROLLUP;
    SET LIB.TRANSACTIONS;
    BY CUSTOMER_ID TRANSACTION_DATE;

    IF FIRST.CUSTOMER_ID THEN DO;
        CUST_TOTAL = 0;
        TRAN_COUNT = 0;
    END;

    CUST_TOTAL + AMOUNT;
    TRAN_COUNT + 1;

    IF LAST.CUSTOMER_ID THEN DO;
        OUTPUT;
    END;
RUN;
```
- **Prerequisite**: Data must be physically sorted by `CUSTOMER_ID` and `TRANSACTION_DATE`.
- **`FIRST.variable`**: Evaluates to `1` (true) on the first record of that BY-group value; otherwise `0`.
- **`LAST.variable`**: Evaluates to `1` (true) on the final record of that BY-group value; otherwise `0`.
- **Hierarchical Inheritance**: If a higher-level BY variable changes (e.g. `CUSTOMER_ID`), all lower-level `FIRST.` variables (e.g. `FIRST.TRANSACTION_DATE`) are automatically set to `1`.

---

## 2. COBOL Target Control-Break Pattern

In COBOL, you maintain a "current record" and a "look-ahead" record, or compare the current record with a "previous-key save area" to emulate `FIRST.` and `LAST.`.

```cobol
       WORKING-STORAGE SECTION.
       01  WS-PREVIOUS-KEYS.
           05  WS-PREV-CUST-ID          PIC X(10) VALUE SPACES.
           05  WS-FIRST-CYCLE-SW        PIC X(1)  VALUE 'Y'.
               88  IS-FIRST-RECORD      VALUE 'Y'.
               88  NOT-FIRST-RECORD     VALUE 'N'.

       01  WS-ACCUMULATORS.
           05  WS-CUST-TOTAL            PIC S9(11)V99 COMP-3 VALUE 0.
           05  WS-TRAN-COUNT            PIC S9(7)     COMP-3 VALUE 0.

       PROCEDURE DIVISION.
       2000-PROCESS-FILE.
           PERFORM 2100-READ-INPUT
           PERFORM 2200-PROCESS-RECORD
               UNTIL WS-INPUT-EOF.
           PERFORM 2400-SIMULATE-LAST.

       2200-PROCESS-RECORD.
           IF IS-FIRST-RECORD
               PERFORM 2300-SIMULATE-FIRST
               SET NOT-FIRST-RECORD TO TRUE
           ELSE
               IF IN-CUST-ID NOT = WS-PREV-CUST-ID
                   PERFORM 2400-SIMULATE-LAST
                   PERFORM 2300-SIMULATE-FIRST
               END-IF
           END-IF.

           ADD IN-AMOUNT TO WS-CUST-TOTAL
           ADD 1         TO WS-TRAN-COUNT

           PERFORM 2100-READ-INPUT.

       2300-SIMULATE-FIRST.
      *    Emulates IF FIRST.CUSTOMER_ID
           MOVE IN-CUST-ID TO WS-PREV-CUST-ID
           MOVE ZEROES     TO WS-CUST-TOTAL
           MOVE ZEROES     TO WS-TRAN-COUNT.

       2400-SIMULATE-LAST.
      *    Emulates IF LAST.CUSTOMER_ID
           MOVE WS-PREV-CUST-ID TO OUT-CUST-ID
           MOVE WS-CUST-TOTAL   TO OUT-TOTAL-AMOUNT
           MOVE WS-TRAN-COUNT   TO OUT-COUNT
           WRITE OUTPUT-RECORD.
```
