# SAS Date/Time Epochs vs Mainframe COBOL Dates

## 1. Internal Storage Foundations

### SAS Dates
- Stored internally as a floating-point or integer number representing the **number of days since January 1, 1960**.
  - `0` = January 1, 1960.
  - Negative values = dates prior to 1960 (e.g. `-365` = January 1, 1959).
  - Positive values = dates after 1960 (e.g. `23742` = January 1, 2025).

### SAS Times & Datetimes
- **Time**: Stored as seconds since midnight (0 to 86,400).
- **Datetime**: Stored as seconds since midnight, January 1, 1960.

---

## 2. Mainframe COBOL Date Standards

In Enterprise COBOL batch systems, dates are stored in display or packed decimal formats:
1. **Calendar Date**: `PIC 9(8)` representing `YYYYMMDD` (Standard ISO-like representation).
2. **Julian Date**: `PIC 9(7)` representing `YYYYDDD` (Year + day of year).
3. **Lilian Date**: Number of days since October 14, 1582 (used natively by IBM Language Environment callable services like `CEEDAYS` and `CEEDATE`).

---

## 3. Date Conversion Formulas

### Converting SAS Date ($D_{SAS}$) to Mainframe YYYYMMDD
To convert an internal SAS date to COBOL:
1. Add the constant offset between the Lilian epoch and SAS epoch:
   $$\text{Lilian Day} = D_{SAS} + 137788$$
2. Call IBM LE date service `CEEDATE` passing the Lilian integer to obtain `YYYYMMDD`.

### Date Arithmetic
- **SAS**: `DUE_DATE = INVOICE_DATE + 30;` (direct day addition).
- **COBOL**: Must use integer date functions:
  ```cobol
  COMPUTE WS-DUE-INTEGER = FUNCTION INTEGER-OF-DATE(WS-INVOICE-DATE) + 30
  COMPUTE WS-DUE-DATE    = FUNCTION DATE-OF-INTEGER(WS-DUE-INTEGER)
  ```
