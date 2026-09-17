# ADR-006: Match-Merge Variable Collision & High-Values Sentinel Alignment

## Status
**ACCEPTED**

## Context
In SAS `MERGE` operations, when two merging datasets share a variable name:
- The rightmost dataset silently overwrites the value from the earlier dataset in the Program Data Vector (PDV) without warning.
- In `STEP-012` (`WORKLIB.customer_sales`), both `customer_sorted` and `sales_sorted` contain a `region` variable (SAR-006).

## Decision
1. **Explicit Lineage & Overwrite Preservation**:
   - In target copybooks, source variables are preserved under distinct prefixes (`CUST-REGION` and `SALE-REGION`).
   - In target program `CBLSL002`, the assignment explicitly executes:
     `MOVE SALE-REGION TO OUT-REGION`
   - This ensures 100% semantic equivalence with SAS PDV behavior while providing full auditability.
2. **Two-File Match-Merge Algorithm**:
   - Standard balanced-line algorithm using `HIGH-VALUES` sentinels upon EOF of either file, ensuring all records from both streams are fully evaluated according to the specified `IN=` selection criteria.

## Consequences
- Guaranteed bit-level matching of output datasets against legacy SAS outputs.
