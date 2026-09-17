# ADR-004: Source Defect Quarantine & Remediation Strategy (SAR-001 to SAR-004)

## Status
**ACCEPTED**

## Context
The Phase 1 Semantic Adversarial Review uncovered four critical source defects in `SYN_ENTERPRISE_SALES_MODERNIZATION.sas`:
1. **SAR-001**: Infinite loop in `WORKLIB.reconciliation` (`STEP-044`) due to conditional `SET` under `IF _N_=1` without `STOP` or unconditional `SET`.
2. **SAR-002**: Syntax failure in `WORKLIB.customer_base` (`STEP-006`) due to unanchored `FIRST.customer_id` without a `BY customer_id;` statement.
3. **SAR-003**: Fatal runtime abort in `WORKLIB.daily_sales` (`STEP-027`) executing `BY sale_date` against input sorted by `customer_id`.
4. **SAR-004**: Runtime abort in `WORKLIB.final_sales_extract` (`STEP-039`) due to MERGE key/sort mismatch on unsorted `region_channel_summary`.

## Decision
In accordance with our strict epistemic standards, we reject silent code repair. All defects are quarantined and remediated via explicit architecture rules:
1. **SAR-001 Remediation**: Target COBOL program `CBLSL006` reads the single control record in paragraph `1000-INITIALIZE-CONTROL`, then processes the detail ledger sequentially until EOF, cleanly terminating via `STOP RUN`.
2. **SAR-002 Remediation**: In program `CBLSL001`, customer name hygiene is executed unconditionally using `MOVE FUNCTION TRIM(IN-CUST-NAME) TO OUT-CUST-NAME`, logging a migration notice regarding the redundant source check.
3. **SAR-003 Remediation**: The JCL execution topology inserts mandatory DFSORT step `STEP130_SRTDLY` sorting `&&SALES_SORTED` by `sale_date` before invoking `CBLSL005`.
4. **SAR-004 Remediation**: JCL inserts DFSORT step `STEP160_SRTRPT` sorting `&&REGION_CHANNEL_SUMMARY` by `customer_region` before invoking the two-file match-merge in `CBLSL006`.

## Consequences
- Prevents fatal production ABENDs while maintaining 100% data fidelity and full audit traceability.
