# Medical Claims Analytics  
## CPT and ICD Code Sets

**Purpose:**  
This document defines the controlled CPT, HCPCS, and ICD 10 code universe used to generate the claims dataset. The goal is to keep the code set realistic, high-volume, and analyzable, while still allowing repeatable denial and underpayment patterns.

---

## 1. CPT and HCPCS Code Set (15 Total)

The dataset uses a limited set of 15 codes to reflect real operations, where a small number of services drive most volume and revenue.

### Code List

| Code | Type | Plain Description | Default Billed Amount |
|------|------|-------------------|------------------------|
| 99213 | CPT | Office visit, established patient, mid level | 125.00 |
| 99214 | CPT | Office visit, established patient, higher level | 185.00 |
| 93000 | CPT | ECG, routine with interpretation | 95.00 |
| 71046 | CPT | Chest X-ray, 2 views | 145.00 |
| 94640 | CPT | Nebulizer treatment | 80.00 |
| 94010 | CPT | Spirometry, pre bronchodilator | 110.00 |
| 94760 | CPT | Pulse oximetry, single determination | 35.00 |
| 36415 | CPT | Venipuncture | 25.00 |
| 80053 | CPT | Comprehensive metabolic panel | 120.00 |
| 85025 | CPT | CBC with differential | 85.00 |
| A7030 | HCPCS | CPAP full face mask | 210.00 |
| A7037 | HCPCS | CPAP tubing | 55.00 |
| E0601 | HCPCS | CPAP device | 880.00 |
| E0470 | HCPCS | BiPAP device | 1650.00 |
| E1390 | HCPCS | Oxygen concentrator | 1050.00 |

**Notes**
- Billed amounts are fixed by code and will not vary.
- Allowed and paid amounts vary by payer rules.

---

## 2. ICD 10 Code Set (12 Total)

The dataset uses 12 diagnosis codes that plausibly align with the above services, especially respiratory and general outpatient work.

### Code List

| ICD10 Code | Plain Description |
|-----------|-------------------|
| J44.9 | COPD, unspecified |
| J45.909 | Asthma, uncomplicated |
| J96.10 | Chronic respiratory failure, unspecified with hypoxia or hypercapnia |
| R06.02 | Shortness of breath |
| R09.02 | Hypoxemia |
| G47.33 | Obstructive sleep apnea |
| E11.9 | Type 2 diabetes mellitus without complications |
| I10 | Essential hypertension |
| R07.9 | Chest pain, unspecified |
| Z79.899 | Other long term drug therapy |
| Z00.00 | General adult exam without abnormal findings |
| Z99.81 | Dependence on supplemental oxygen |

---

## 3. Valid CPT to ICD Pairings

Each CPT or HCPCS code will be paired with one ICD 10 code chosen from the valid list below.

### 99213, 99214 (Office Visits)
Valid ICDs:
- I10, E11.9, Z00.00, Z79.899, R06.02, J44.9, J45.909

### 93000 (ECG)
Valid ICDs:
- R07.9, I10, R06.02

### 71046 (Chest X-ray)
Valid ICDs:
- R06.02, R07.9, J44.9, J45.909

### 94640 (Nebulizer Treatment)
Valid ICDs:
- J45.909, J44.9, R06.02

### 94010 (Spirometry)
Valid ICDs:
- J44.9, J45.909, R06.02

### 94760 (Pulse Oximetry)
Valid ICDs:
- R09.02, R06.02, J44.9, J45.909, Z99.81

### 36415, 80053, 85025 (Labs and Venipuncture)
Valid ICDs:
- E11.9, I10, Z79.899, Z00.00

### A7030, A7037, E0601 (CPAP Supplies and Device)
Valid ICDs:
- G47.33

### E0470 (BiPAP Device)
Valid ICDs:
- J96.10, J44.9

### E1390 (Oxygen Concentrator)
Valid ICDs:
- Z99.81, R09.02, J96.10, J44.9

---

## 4. High-Risk Medical Necessity Combinations

These combinations intentionally drive elevated Medicare medical necessity denials and appeal opportunities.

### Medicare Medical Necessity High-Risk Pairs
- E0601 with G47.33 is usually valid, but a subset will be denied for documentation, simulated as CO-50.
- E0470 with J44.9 is higher denial risk than with J96.10.
- E1390 with J44.9 has higher denial risk than with Z99.81 or R09.02.

**Implementation intent**
- These are not random denials. They will cluster by payer and code in repeatable patterns.

---

## 5. Underpayment Target Codes

These codes will be used for controlled underpayment leakage patterns. The claim may show Paid status but paid below allowed.

### Underpayment Targets
- 99214 (commercial PPO and Medicare Advantage underpayment cluster)
- E0601 (Medicare Advantage and Medicaid managed underpayment cluster)
- E1390 (Medicaid managed underpayment cluster)
- A7030 (commercial HMO partial pay and bundling behavior cluster)

---

## 6. Volume Weighting (Optional but Recommended)

To simulate realistic volume concentration, these five codes should be high frequency:
- 99213
- 99214
- 94760
- E0601
- A7030

The remaining codes should be moderate to low frequency, with E0470 and E1390 lower volume but higher dollar impact.

---

## 7. Design Intent

This code set is intentionally constrained to:
- Remain believable to healthcare billing audiences
- Support strong payer and code-level analytics
- Create repeatable missing money patterns without messy data
- Allow dashboards and search to stay responsive and meaningful
