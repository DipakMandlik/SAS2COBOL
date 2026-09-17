# SAS MERGE BY: Two-File Match-Merge Algorithm in COBOL

## 1. SAS MERGE Semantics
```sas
DATA WORK.MATCHED;
    MERGE LIB.MASTER (IN=IN_M)
          LIB.UPDATES (IN=IN_U);
    BY ACCOUNT_ID;
    IF IN_M AND IN_U THEN MATCH_TYPE = 'BOTH';
    ELSE IF IN_M THEN MATCH_TYPE = 'MASTER_ONLY';
    ELSE IF IN_U THEN MATCH_TYPE = 'UPDATE_ONLY';
RUN;
```
- **Prerequisite**: Both files must be pre-sorted in ascending order by the `BY` variables (`ACCOUNT_ID`).
- **`IN=` Variables**: Temporary boolean flags indicating whether the current PDV observation contains data from that source dataset.
- **Many-to-Many Trap**: If duplicate keys exist in both files, SAS performs an ad-hoc overwrite loop rather than a relational cartesian product.

---

## 2. Classic Two-File Match-Merge Algorithm in COBOL

This is the standard, deterministic sequential file merge pattern in mainframe systems:

```cobol
       WORKING-STORAGE SECTION.
       01  WS-FLAGS.
           05  WS-MASTER-EOF-SW         PIC X(1) VALUE 'N'.
               88  WS-MASTER-EOF        VALUE 'Y'.
           05  WS-UPDATE-EOF-SW         PIC X(1) VALUE 'N'.
               88  WS-UPDATE-EOF        VALUE 'Y'.

       01  WS-HIGH-VALUES-KEY           PIC X(10) VALUE HIGH-VALUES.

       PROCEDURE DIVISION.
       2000-PROCESS-MATCH-MERGE.
           PERFORM 2100-READ-MASTER
           PERFORM 2200-READ-UPDATE
           PERFORM 2300-COMPARE-KEYS
               UNTIL WS-MASTER-EOF AND WS-UPDATE-EOF.

       2300-COMPARE-KEYS.
           EVALUATE TRUE
               WHEN MST-ACCT-ID = UPD-ACCT-ID
      *            Matched in both (IN_M AND IN_U)
                   PERFORM 2400-HANDLE-MATCHED
                   PERFORM 2100-READ-MASTER
                   PERFORM 2200-READ-UPDATE

               WHEN MST-ACCT-ID < UPD-ACCT-ID
      *            Master only (IN_M AND NOT IN_U)
                   PERFORM 2500-HANDLE-MASTER-ONLY
                   PERFORM 2100-READ-MASTER

               WHEN MST-ACCT-ID > UPD-ACCT-ID
      *            Update only (NOT IN_M AND IN_U)
                   PERFORM 2600-HANDLE-UPDATE-ONLY
                   PERFORM 2200-READ-UPDATE
           END-EVALUATE.

       2100-READ-MASTER.
           READ MASTER-FILE INTO WS-MASTER-RECORD
               AT END
                   SET WS-MASTER-EOF TO TRUE
                   MOVE WS-HIGH-VALUES-KEY TO MST-ACCT-ID
           END-READ.

       2200-READ-UPDATE.
           READ UPDATE-FILE INTO WS-UPDATE-RECORD
               AT END
                   SET WS-UPDATE-EOF TO TRUE
                   MOVE WS-HIGH-VALUES-KEY TO UPD-ACCT-ID
           END-READ.
```
*Note: Moving `HIGH-VALUES` to the key at EOF ensures that the remaining records in the active file continue processing without additional conditional checks.*
