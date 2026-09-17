# End-to-End Exemplar: SAS Retained Cumulative Balance to COBOL

## 1. Source SAS Code
```sas
/* SAS SOURCE: Calculate cumulative customer balance and filter high rollers */
DATA WORK.CUST_ACCUM (DROP=PREV_BAL);
    SET LIB.TRANSACTIONS;
    BY CUSTOMER_ID;
    RETAIN RUNNING_BALANCE 0;

    IF FIRST.CUSTOMER_ID THEN DO;
        RUNNING_BALANCE = 0;
    END;

    RUNNING_BALANCE = RUNNING_BALANCE + TRAN_AMOUNT;

    IF LAST.CUSTOMER_ID AND RUNNING_BALANCE >= 10000.00 THEN DO;
        IS_HIGH_VALUE = 'Y';
        OUTPUT;
    END;
RUN;
```

---

## 2. Phase 1 Reconstruction (Semantic Model)
- **Operation**: `CONTROL_BREAK_ACCUMULATION_AND_FILTER`
- **Input Dataset**: `LIB.TRANSACTIONS` (Sorted by `CUSTOMER_ID`)
- **Output Dataset**: `WORK.CUST_ACCUM`
- **Grouping Key**: `CUSTOMER_ID`
- **Accumulator**: `RUNNING_BALANCE` (retained across rows within group, initialized to 0 at group boundary)
- **Filter**: `LAST.CUSTOMER_ID AND RUNNING_BALANCE >= 10000.00`

---

## 3. Phase 2 PU Contract Specification (`PU-CBL-001`)
- **Target Program**: `CBLACT01` (Enterprise COBOL 6.x Batch Main)
- **Input File**: `TRANIN` (Sequential, FB, LRECL=80)
- **Output File**: `CUSTOUT` (Sequential, FB, LRECL=80)
- **Key Variables**:
  - `CUSTOMER-ID`: `PIC X(10)`
  - `TRAN-AMOUNT`: `PIC S9(7)V99 COMP-3`
  - `RUNNING-BALANCE`: `PIC S9(9)V99 COMP-3`
  - `IS-HIGH-VALUE`: `PIC X(1)`

---

## 4. Phase 3 Generated COBOL Artifact (`CBLACT01.cbl`)
```cobol
       IDENTIFICATION DIVISION.
       PROGRAM-ID.    CBLACT01.
       AUTHOR.        MIGRATION-ENGINE.
      ******************************************************************
      * SAS SOURCE TRACE: WORK.CUST_ACCUM DATA STEP
      * PU CONTRACT: PU-CBL-001
      ******************************************************************
       ENVIRONMENT DIVISION.
       CONFIGURATION SECTION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT TRAN-FILE   ASSIGN TO TRANIN
                  FILE STATUS IS WS-TRAN-STATUS.
           SELECT CUST-FILE   ASSIGN TO CUSTOUT
                  FILE STATUS IS WS-CUST-STATUS.

       DATA DIVISION.
       FILE SECTION.
       FD  TRAN-FILE
           RECORDING MODE IS F
           BLOCK CONTAINS 0 RECORDS.
       01  TRAN-RECORD                 PIC X(80).

       FD  CUST-FILE
           RECORDING MODE IS F
           BLOCK CONTAINS 0 RECORDS.
       01  CUST-RECORD                 PIC X(80).

       WORKING-STORAGE SECTION.
       01  WS-FILE-STATUSES.
           05  WS-TRAN-STATUS          PIC X(2) VALUE SPACES.
               88  TRAN-OK             VALUE '00'.
               88  TRAN-EOF            VALUE '10'.
           05  WS-CUST-STATUS          PIC X(2) VALUE SPACES.
               88  CUST-OK             VALUE '00'.

       01  WS-CONTROL-KEYS.
           05  WS-PREV-CUST-ID         PIC X(10) VALUE SPACES.
           05  WS-FIRST-RECORD-SW      PIC X(1)  VALUE 'Y'.
               88  FIRST-RECORD        VALUE 'Y'.
               88  NOT-FIRST-RECORD    VALUE 'N'.

       01  WS-INPUT-LAYOUT.
           05  IN-CUSTOMER-ID          PIC X(10).
           05  IN-TRAN-AMOUNT          PIC S9(7)V99 COMP-3.
           05  FILLER                  PIC X(65).

       01  WS-OUTPUT-LAYOUT.
           05  OUT-CUSTOMER-ID         PIC X(10).
           05  OUT-FINAL-BALANCE       PIC S9(9)V99 COMP-3.
           05  OUT-HIGH-VALUE          PIC X(1).
           05  FILLER                  PIC X(63).

       01  WS-ACCUMULATORS.
           05  WS-RUNNING-BALANCE      PIC S9(9)V99 COMP-3 VALUE ZEROES.

       PROCEDURE DIVISION.
       0000-MAIN.
           PERFORM 1000-INITIALIZE
           PERFORM 2000-PROCESS-RECORDS
               UNTIL TRAN-EOF
           PERFORM 2400-EVALUATE-LAST-GROUP
           PERFORM 3000-TERMINATE
           STOP RUN.

       1000-INITIALIZE.
           OPEN INPUT  TRAN-FILE
           IF NOT TRAN-OK
               DISPLAY 'FATAL ERROR OPENING TRANIN: ' WS-TRAN-STATUS
               MOVE 12 TO RETURN-CODE
               STOP RUN
           END-IF

           OPEN OUTPUT CUST-FILE
           IF NOT CUST-OK
               DISPLAY 'FATAL ERROR OPENING CUSTOUT: ' WS-CUST-STATUS
               MOVE 12 TO RETURN-CODE
               STOP RUN
           END-IF

           PERFORM 2100-READ-TRAN.

       2000-PROCESS-RECORDS.
           IF FIRST-RECORD
               MOVE IN-CUSTOMER-ID TO WS-PREV-CUST-ID
               MOVE ZEROES         TO WS-RUNNING-BALANCE
               SET NOT-FIRST-RECORD TO TRUE
           ELSE
               IF IN-CUSTOMER-ID NOT = WS-PREV-CUST-ID
                   PERFORM 2400-EVALUATE-LAST-GROUP
                   MOVE IN-CUSTOMER-ID TO WS-PREV-CUST-ID
                   MOVE ZEROES         TO WS-RUNNING-BALANCE
               END-IF
           END-IF

           ADD IN-TRAN-AMOUNT TO WS-RUNNING-BALANCE
           PERFORM 2100-READ-TRAN.

       2100-READ-TRAN.
           READ TRAN-FILE INTO WS-INPUT-LAYOUT
               AT END
                   SET TRAN-EOF TO TRUE
               NOT AT END
                   IF NOT TRAN-OK
                       DISPLAY 'ERROR READING TRANIN: ' WS-TRAN-STATUS
                       MOVE 12 TO RETURN-CODE
                       STOP RUN
                   END-IF
           END-READ.

       2400-EVALUATE-LAST-GROUP.
      *    SAS: IF LAST.CUSTOMER_ID AND RUNNING_BALANCE >= 10000.00
           IF NOT-FIRST-RECORD AND WS-RUNNING-BALANCE >= 10000.00
               INITIALIZE WS-OUTPUT-LAYOUT
               MOVE WS-PREV-CUST-ID    TO OUT-CUSTOMER-ID
               MOVE WS-RUNNING-BALANCE TO OUT-FINAL-BALANCE
               MOVE 'Y'                TO OUT-HIGH-VALUE
               WRITE CUST-RECORD FROM WS-OUTPUT-LAYOUT
               IF NOT CUST-OK
                   DISPLAY 'ERROR WRITING CUSTOUT: ' WS-CUST-STATUS
                   MOVE 12 TO RETURN-CODE
                   STOP RUN
               END-IF
           END-IF.

       3000-TERMINATE.
           CLOSE TRAN-FILE
                 CUST-FILE.
```
