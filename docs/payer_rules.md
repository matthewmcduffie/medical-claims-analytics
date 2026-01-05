# Medical Claims Analytics  
## Payer Rules and Reimbursement Logic

**Purpose:**  
This document defines deterministic reimbursement, denial, underpayment, and appeal eligibility rules for all payers represented in the claims dataset. These rules govern how billed, allowed, and paid amounts behave and intentionally introduce realistic revenue leakage patterns for analysis.

---

## 1. Payer Categories

The dataset includes three payer categories:

- Medicare  
- Medicaid  
- Other  

All payers share the same data schema. Differences are entirely behavioral.

---

## 2. Payer Mix (100,000 Claims)

### High-level distribution
- Medicare: 55%  
- Medicaid: 30%  
- Other: 15%  

---

## 3. Medicare Rules

### 3.1 Medicare Plans
- Medicare Fee For Service (FFS): 70% of Medicare  
- Medicare Advantage: 30% of Medicare  

---

### 3.2 Allowed Amount Logic
Allowed amount is calculated as a percentage of billed amount.

- Medicare FFS: 72–78% of billed  
- Medicare Advantage: 65–75% of billed  

Percentages are CPT-dependent but consistent.

---

### 3.3 Payment Behavior
- Majority of claims are paid correctly  
- Medical necessity denials cluster around specific CPT–ICD combinations  
- Underpayments occur without explicit denial flags  

---

### 3.4 Common Denial Reasons
- Medical Necessity  
- Prior Authorization Required  
- Timely Filing  

---

### 3.5 Adjustment Code Behavior
- CO-50: Medical necessity denial  
- CO-97: Non-covered or bundled service  
- CO-45: Contractual adjustment  

Silent denials may show:
- Claim Status = Paid  
- Paid Amount = 0  
- Adjustment Code present  

---

### 3.6 Appeal Eligibility
Appeal eligible:
- Medical necessity denials  
- Prior authorization issues  
- Underpayments below allowed amount  

Not appeal eligible:
- Timely filing denials  

---

## 4. Medicaid Rules

### 4.1 Medicaid Plans
- Managed Care: 65% of Medicaid  
- Fee For Service (FFS): 35% of Medicaid  

---

### 4.2 Allowed Amount Logic
- Medicaid FFS: 55–65% of billed  
- Medicaid Managed Care: 50–60% of billed  

---

### 4.3 Payment Behavior
- Higher denial rates than Medicare  
- Frequent administrative denials  
- Inconsistent partial payments  
- Longer processing times  

---

### 4.4 Common Denial Reasons
- Prior Authorization Required  
- Coverage Terminated  
- Timely Filing  
- Documentation Incomplete  

---

### 4.5 Adjustment Code Behavior
- CO-97: Non-covered service  
- CO-45: Contractual adjustment  
- PR-1: Patient responsibility  

Medicaid managed care frequently underpays without clear explanation.

---

### 4.6 Appeal Eligibility
Appeal eligible:
- Authorization-related denials  
- Documentation issues  
- Underpayments  

Not appeal eligible:
- Coverage terminated  
- Timely filing exceeded  

---

## 5. Other Payers Rules

### 5.1 Other Payer Types
Within the “Other” category:

- Commercial PPO: 50%  
- Commercial HMO: 30%  
- Workers Compensation: 10%  
- Auto / No-Fault: 10%  

---

### 5.2 Allowed Amount Logic
- Commercial PPO: 75–85% of billed  
- Commercial HMO: 65–75% of billed  
- Workers Compensation: 80–95% of billed  
- Auto / No-Fault: 90–100% of billed  

---

### 5.3 Payment Behavior
- Commercial PPO: Contract misapplication and partial payments  
- Commercial HMO: Authorization-heavy denials  
- Workers Compensation: Slow payments and documentation disputes  
- Auto / No-Fault: Variable timing, occasional overpayments  

---

### 5.4 Common Denial Reasons
- Documentation Incomplete  
- Coordination of Benefits  
- Injury Related  
- Authorization Lapsed  

---

### 5.5 Adjustment Code Behavior
- CO-45: Contractual adjustment  
- CO-97: Non-covered or bundled  
- PR-1: Patient responsibility  

---

### 5.6 Appeal Eligibility
Appeal eligible:
- Underpayments  
- Documentation issues  
- Authorization issues  
- Coordination of benefits  

Not appeal eligible:
- Explicit contractual exclusions  
- Confirmed patient liability  

---

## 6. Claim Status Logic (All Payers)

Approximate distribution:
- Paid: 70%  
- Partially Paid: 15%  
- Denied: 15%  

Claim status may conflict with payment reality and must not be relied upon alone.

---

## 7. Intentional Revenue Leakage Patterns

The dataset includes controlled, repeatable leakage:

### Pattern 1: CPT-based underpayments
- Certain CPTs consistently underpaid by 10–15%  
- Status remains “Paid”  
- Appeal eligible  

---

### Pattern 2: Silent denials
- Paid Amount = 0  
- Claim Status = Paid  
- Adjustment Code present  

---

### Pattern 3: Medicaid managed care erosion
- Allowed amount correct  
- Paid amount inconsistently reduced  
- Appeal eligible  

---

### Pattern 4: True write-offs
- Timely filing exceeded  
- Coverage terminated  
- Appeal not eligible  

---

## 8. Date and Processing Rules

- Claim Received Date: 1–7 days after service  
- Claim Processed Date ranges:
  - Medicare FFS: 14–30 days  
  - Medicare Advantage: 21–45 days  
  - Medicaid Managed: 30–60 days  
  - Medicaid FFS: 45–75 days  
  - Other Payers: 20–60 days  

Late payments cluster by payer type.

---

## 9. Design Intent

These rules intentionally:
- Mirror real-world payer behavior  
- Create analyzable revenue loss  
- Avoid random noise  
- Support reproducible analysis  

The goal is to demonstrate the ability to detect, quantify, and prioritize recoverable revenue, not to simulate billing errors randomly.
