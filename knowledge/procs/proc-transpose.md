# PROC TRANSPOSE: Data Reshaping & Pivoting Strategies

## 1. SAS Syntax & Semantics
```sas
PROC TRANSPOSE DATA=LIB.MONTHLY_SALES OUT=LIB.PIVOTED PREFIX=MONTH_;
    BY CUSTOMER_ID;
    ID MONTH_NUM;
    VAR AMOUNT;
RUN;
```
- **`BY`**: Grouping dimensions. Transposition occurs within each unique BY group.
- **`ID`**: Column naming dimension. Values of this variable become names for the new transposed columns (e.g. `MONTH_1`, `MONTH_2`, ..., `MONTH_12`).
- **`VAR`**: The numerical or character measure being pivoted.
- **Resulting Shape Change**: Multiple input rows for a single `CUSTOMER_ID` are collapsed into a single, wider output row with dynamic column attributes.

---

## 2. COBOL Target Implementation Strategies

Mainframe flat files and COBOL records have **fixed record layouts**. Dynamic column names must be mapped into predefined arrays (`OCCURS`) or explicit, fixed field names.

### Pattern A: COBOL Table / OCCURS Array
When the transposed dimension has a known, bounded cardinality (e.g. 12 months, 4 quarters, 50 states).

```cobol
       01  WS-TRANSPOSED-RECORD.
           05  WS-TR-CUSTOMER-ID       PIC X(12).
           05  WS-MONTH-TABLE OCCURS 12 TIMES
                              INDEXED BY MONTH-IDX.
               10  WS-MONTH-AMOUNT     PIC S9(9)V99 COMP-3.
```

### Procedure Division Transposition Loop:
```cobol
       2000-PROCESS-CUSTOMER-TRANSPOSE.
           PERFORM 2100-INITIALIZE-TABLE
           PERFORM 2200-LOAD-ROW
               UNTIL WS-EOF OR CUST-BREAK.
           PERFORM 2300-WRITE-PIVOTED-RECORD.

       2200-LOAD-ROW.
           SET MONTH-IDX TO IN-MONTH-NUM
           MOVE IN-AMOUNT TO WS-MONTH-AMOUNT(MONTH-IDX)
           PERFORM 2100-READ-INPUT.
```

### Pattern B: Explicit Column Mapping
Where business downstream demands distinct sequential field names:
```cobol
       01  WS-PIVOT-RECORD.
           05  WS-CUST-ID              PIC X(12).
           05  WS-MONTH-01             PIC S9(9)V99 COMP-3.
           05  WS-MONTH-02             PIC S9(9)V99 COMP-3.
           05  WS-MONTH-03             PIC S9(9)V99 COMP-3.
           ...
           05  WS-MONTH-12             PIC S9(9)V99 COMP-3.
```
