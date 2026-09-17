# PROC FREQ & PROC APPEND: Mainframe Translation

## 1. PROC FREQ: Frequency & Categorical Counting

```sas
PROC FREQ DATA=LIB.CLAIMS NOPRINT;
    TABLES CLAIM_STATUS * CLAIM_TYPE / OUT=LIB.STATUS_FREQ OUTPCT;
RUN;
```
- Counts occurrences of discrete categorical combinations.
- Computes cell counts, row/column percentages, and cumulative totals.

### Target COBOL Pattern:
- **Direct Multi-Dimensional Array (OCCURS)**:
  ```cobol
         01  WS-FREQ-TABLE.
             05  WS-STATUS OCCURS 5 TIMES INDEXED BY ST-IDX.
                 10  WS-TYPE OCCURS 10 TIMES INDEXED BY TY-IDX.
                     15  WS-CELL-COUNT     PIC 9(9) COMP-3 VALUE 0.
  ```
- Iterate records, increment corresponding table element `ADD 1 TO WS-CELL-COUNT(ST-IDX, TY-IDX)`.
- At end-of-file, loop over the table, compute percentages, and write output records.

---

## 2. PROC APPEND: Sequential Concatenation

```sas
PROC APPEND BASE=LIB.MASTER DATA=LIB.DAILY_INCREMENT FORCE;
RUN;
```
- Appends observations from `DATA=` dataset directly to the end of `BASE=`.

### Target Mainframe Patterns:
1. **JCL DISP=MOD (Preferred)**:
   ```jcl
   //STEP0020 EXEC PGM=IEBGENER
   //SYSUT1   DD DSN=HLQ.DAILY.INCREMENT,DISP=SHR
   //SYSUT2   DD DSN=HLQ.MASTER.FILE,DISP=(MOD,KEEP,KEEP)
   //SYSPRINT DD SYSOUT=*
   //SYSIN    DD DUMMY
   ```
2. **COBOL Sequential Write (OPEN EXTEND)**:
   ```cobol
           OPEN EXTEND MASTER-FILE.
           PERFORM 2000-COPY-RECORDS UNTIL WS-INCREMENT-EOF.
           CLOSE MASTER-FILE.
   ```
