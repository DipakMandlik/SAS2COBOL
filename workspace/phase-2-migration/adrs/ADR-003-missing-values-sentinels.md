# ADR-003: SAS Missing Value Representation & 88-Level Sentinels

## Status
**ACCEPTED**

## Context
In SAS, missing numeric values (`.`, `._`, `.A` through `.Z`) are represented internally as floating-point quantities algebraically smaller than negative infinity. This causes severe evaluation anomalies:
- In SAS, the condition `IF AMOUNT < 0` evaluates to **TRUE** when `AMOUNT` is missing (`.`).
- In Enterprise COBOL packed decimal (`COMP-3`), missing values do not natively exist; uninitialized fields contain invalid packed nibbles causing data exception 0C7 ABENDs, or zeroes.

## Decision
1. **Shared Sentinel Copybook (`CPTRAP88`)**:
   - Numeric fields have associated null indicator flags or standard low-value sentinel ranges.
   - For nullable packed fields, `-999999999.99` or dedicated 1-byte null indicator flags (`NULL-IND PIC X, 88 FIELD-IS-NULL VALUE 'Y'`) are utilized.
2. **Defect-Aware Sentinel Guarding (SAR-009)**:
   - In `STEP-082` (`WORKLIB.sales_quality`), the target COBOL logic evaluates:
     ```cobol
     IF SALE-QTY-IS-NULL OR SALE-PRICE-IS-NULL
         MOVE 'MISSING_VALUE' TO OUT-QUALITY-FLAG
     ELSE IF SALE-QTY < 0 OR SALE-PRICE < 0
         MOVE 'NEGATIVE_VALUE' TO OUT-QUALITY-FLAG
     END-IF
     ```
   - This fixes the SAS defect where missing values were misclassified as negative amounts while providing explicit logging.

## Consequences
- Eliminates 0C7 data exception ABENDs.
- Explicitly documents and normalizes SAS missing value behavior.
