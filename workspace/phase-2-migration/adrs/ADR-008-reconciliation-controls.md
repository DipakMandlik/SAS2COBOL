# ADR-008: Dual-Run Reconciliation Controls & Financial Balancing Metrics

## Status
**ACCEPTED**

## Context
Enterprise migration certification requires automated, mathematical proof of equivalence between legacy SAS execution and target COBOL mainframe execution.

## Decision
We establish a 4-tier automated reconciliation framework in `reconciliation-requirements.json`:
1. **Tier 1 (Record Counts)**: Zero-tolerance (`tolerance = 0`) count checks at all dataset boundaries.
2. **Tier 2 (Financial Metric Sums)**: Exact tolerance (`tolerance = 0.01`) on currency measures (`gross_amount`, `discount_amount`, `net_amount`, `customer_total`).
3. **Tier 3 (Hash Totals)**: SHA-256 or numeric modulo-97 hash sums on identifier keys (`customer_id`, `sale_id`) to detect missing, duplicated, or misordered observations.
4. **Tier 4 (Internal Balance Checks)**: Enforced arithmetic invariants:
   $$\text{gross\_amount} - \text{discount\_amount} == \text{net\_amount}$$
   $$\text{reconciliation\_status} == \text{'MATCH'}$$

## Consequences
- Enables automated automated CI/CD certification in Phase 3.
