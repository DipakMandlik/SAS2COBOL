# PROC SQL: Relational vs Procedural COBOL Mapping

## 1. SAS Syntax & Spectrum of Usage
```sas
PROC SQL;
    CREATE TABLE WORK.ACTIVE_CUST_TOTALS AS
    SELECT 
        C.REGION,
        C.CUSTOMER_TYPE,
        SUM(T.AMOUNT) AS TOTAL_SPEND,
        COUNT(T.TRAN_ID) AS TRAN_COUNT
    FROM LIB.CUSTOMERS C
    INNER JOIN LIB.TRANSACTIONS T
        ON C.CUSTOMER_ID = T.CUSTOMER_ID
    WHERE C.STATUS = 'ACTIVE'
      AND T.TRAN_DATE >= '01JAN2025'd
    GROUP BY C.REGION, C.CUSTOMER_TYPE
    HAVING SUM(T.AMOUNT) > 50000
    ORDER BY C.REGION, TOTAL_SPEND DESC;
QUIT;
```

---

## 2. Target Strategy Decision Matrix

| Query Characteristics | Target Pattern | Justification |
| :--- | :--- | :--- |
| Sources are DB2 tables on the mainframe | **Direct Embedded SQL (`EXEC SQL ... END-EXEC`)** | Leverages native mainframe relational engine and optimizer. |
| Sources are sequential flat files or VSAM datasets | **Decomposed Match-Merge / Sort-Filter COBOL** | Sequential files cannot execute arbitrary relational SQL without an engine. |
| Complex multi-table joins on sequential files | **DFSORT JoinKeys (JCL)** | DFSORT JoinKeys performs outer, inner, and semi-joins at high throughput without custom COBOL code. |

---

## 3. Sequential File COBOL Decomposition Pattern

When `PROC SQL` executes on sequential files, decompose into 3 operational stages:
1. **Stage 1 (Filter & Sort)**:
   - Filter `CUSTOMERS` on `STATUS = 'ACTIVE'`, sort by `CUSTOMER_ID`.
   - Filter `TRANSACTIONS` on date, sort by `CUSTOMER_ID`.
2. **Stage 2 (Two-File Match-Merge & Aggregation)**:
   - Perform sequential match on `CUSTOMER_ID`.
   - Aggregate measures (`TOTAL_SPEND`, `TRAN_COUNT`) by `REGION` and `CUSTOMER_TYPE`.
3. **Stage 3 (Post-Filter & Sort)**:
   - Filter having `TOTAL_SPEND > 50000`.
   - Sort by `REGION ASCENDING`, `TOTAL_SPEND DESCENDING`.
