# PROC SORT: Mainframe Translation Patterns

## 1. SAS Syntax & Semantics
```sas
PROC SORT DATA=LIB.INPUT OUT=LIB.OUTPUT NODUPKEY;
    BY REGION DESCENDING REVENUE CUSTOMER_ID;
RUN;
```
- **Inputs**: `DATA=` dataset (defaults to most recently created).
- **Outputs**: `OUT=` dataset (if omitted, overwrites input in-place).
- **Options**:
  - `NODUPKEY`: Keeps only the first observation for each unique combination of `BY` variables.
  - `NODUPREC` / `NODUP`: Compares entire records across all variables.
- **BY Statement**:
  - Sets sort keys and ordering (`ASCENDING` by default, `DESCENDING` explicit).

---

## 2. Mainframe Target Implementation Strategies

### Pattern A: Dedicated JCL DFSORT / SyncSort Step (Preferred)
In batch mainframe architecture, file sorting is typically offloaded from procedural COBOL to the high-performance system sort utility (DFSORT or SyncSort).

```jcl
//STEP0010 EXEC PGM=SORT
//SYSOUT   DD SYSOUT=*
//SORTIN   DD DSN=HLQ.INPUT.DATA,DISP=SHR
//SORTOUT  DD DSN=HLQ.OUTPUT.DATA,
//            DISP=(NEW,CATLG,DELETE),
//            SPACE=(CYL,(50,10),RLSE),
//            DCB=(RECFM=FB,LRECL=120,BLKSIZE=0)
//SYSIN    DD *
  SORT FIELDS=(1,10,CH,A,25,8,PD,D,11,14,CH,A)
  SUM FIELDS=NONE
/*
```
*Note: `SUM FIELDS=NONE` emulates `NODUPKEY` by discarding duplicate key records.*

### Pattern B: COBOL Internal Sort (`SORT ... USING ... GIVING`)
When sorting is tightly embedded within a procedural COBOL pipeline or requires inline filtering (`INPUT PROCEDURE` / `OUTPUT PROCEDURE`).

```cobol
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT SORT-WORK-FILE ASSIGN TO SORTWK01.

       DATA DIVISION.
       SD  SORT-WORK-FILE.
       01  SORT-RECORD.
           05  SRT-REGION           PIC X(10).
           05  SRT-REVENUE          PIC S9(7)V99 COMP-3.
           05  SRT-CUSTOMER-ID      PIC X(14).

       PROCEDURE DIVISION.
           SORT SORT-WORK-FILE
               ON ASCENDING KEY SRT-REGION
               ON DESCENDING KEY SRT-REVENUE
               ON ASCENDING KEY SRT-CUSTOMER-ID
               USING INPUT-FILE
               GIVING OUTPUT-FILE.
```
