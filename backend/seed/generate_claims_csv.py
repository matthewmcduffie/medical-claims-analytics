import csv
import random
import os
from datetime import date, timedelta

random.seed(42)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, "../.."))
OUTPUT_PATH = os.path.join(PROJECT_ROOT, "data", "claims_100k.csv")

TOTAL_CLAIMS = 100_000

PAYER_DISTRIBUTION = [
    ("Medicare", 0.55),
    ("Medicaid", 0.30),
    ("Other", 0.15),
]

PAYER_PLANS = {
    "Medicare": [
        ("Medicare FFS", 0.70),
        ("Medicare Advantage", 0.30),
    ],
    "Medicaid": [
        ("Medicaid Managed Care", 0.65),
        ("Medicaid FFS", 0.35),
    ],
    "Other": [
        ("Commercial PPO", 0.50),
        ("Commercial HMO", 0.30),
        ("Workers Compensation", 0.10),
        ("Auto No-Fault", 0.10),
    ],
}

CPT_CODES = {
    "99213": 125.00,
    "99214": 185.00,
    "93000": 95.00,
    "71046": 145.00,
    "94640": 80.00,
    "94010": 110.00,
    "94760": 35.00,
    "36415": 25.00,
    "80053": 120.00,
    "85025": 85.00,
    "A7030": 210.00,
    "A7037": 55.00,
    "E0601": 880.00,
    "E0470": 1650.00,
    "E1390": 1050.00,
}

CPT_TO_ICD = {
    "99213": ["I10", "E11.9", "Z00.00", "Z79.899", "R06.02", "J44.9", "J45.909"],
    "99214": ["I10", "E11.9", "R06.02", "J44.9", "J45.909"],
    "93000": ["R07.9", "I10", "R06.02"],
    "71046": ["R06.02", "R07.9", "J44.9", "J45.909"],
    "94640": ["J45.909", "J44.9", "R06.02"],
    "94010": ["J44.9", "J45.909", "R06.02"],
    "94760": ["R09.02", "R06.02", "J44.9", "J45.909", "Z99.81"],
    "36415": ["E11.9", "I10", "Z79.899", "Z00.00"],
    "80053": ["E11.9", "I10", "Z79.899"],
    "85025": ["E11.9", "I10", "Z79.899"],
    "A7030": ["G47.33"],
    "A7037": ["G47.33"],
    "E0601": ["G47.33"],
    "E0470": ["J96.10", "J44.9"],
    "E1390": ["Z99.81", "R09.02", "J96.10", "J44.9"],
}

UNDERPAY_CPTS = {"99214", "E0601", "E1390", "A7030"}

FIELDNAMES = [
    "claim_id",
    "patient_id",
    "payer_type",
    "payer_plan",
    "provider_npi",
    "service_date",
    "claim_received_date",
    "claim_processed_date",
    "cpt_hcpcs_code",
    "icd10_code",
    "billed_amount",
    "allowed_amount",
    "paid_amount",
    "claim_status",
    "denial_reason",
    "adjustment_code",
    "appeal_eligible",
]

def weighted_choice(options):
    r = random.random()
    cumulative = 0
    for value, weight in options:
        cumulative += weight
        if r <= cumulative:
            return value
    return options[-1][0]

def random_date(start_days_ago=730):
    return date.today() - timedelta(days=random.randint(0, start_days_ago))

with open(OUTPUT_PATH, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
    writer.writeheader()

    for i in range(1, TOTAL_CLAIMS + 1):
        payer_type = weighted_choice(PAYER_DISTRIBUTION)
        payer_plan = weighted_choice(PAYER_PLANS[payer_type])

        cpt = random.choice(list(CPT_CODES.keys()))
        icd = random.choice(CPT_TO_ICD[cpt])
        billed = CPT_CODES[cpt]

        if payer_type == "Medicare":
            allowed = billed * random.uniform(0.70, 0.78)
        elif payer_type == "Medicaid":
            allowed = billed * random.uniform(0.50, 0.65)
        else:
            allowed = billed * random.uniform(0.75, 0.95)

        status_roll = random.random()

        paid = allowed
        status = "Paid"
        denial_reason = "None"
        adj_code = "None"
        appeal = "No"

        if status_roll < 0.15:
            paid = 0.00
            status = "Denied"
            denial_reason = random.choice([
                "Medical Necessity",
                "Prior Authorization Required",
                "Timely Filing",
                "Documentation Incomplete",
            ])
            adj_code = random.choice(["CO-50", "CO-97"])
            appeal = "Yes" if denial_reason != "Timely Filing" else "No"

        elif status_roll < 0.30:
            paid = allowed * random.uniform(0.50, 0.80)
            status = "Partially Paid"
            denial_reason = "Underpayment"
            adj_code = "CO-45"
            appeal = "Yes"

        elif cpt in UNDERPAY_CPTS and random.random() < 0.20:
            paid = allowed * random.uniform(0.85, 0.90)
            status = "Paid"
            denial_reason = "None"
            adj_code = "CO-45"
            appeal = "Yes"

        service_date = random_date()
        received_date = service_date + timedelta(days=random.randint(1, 7))
        processed_date = received_date + timedelta(days=random.randint(14, 60))

        writer.writerow({
            "claim_id": f"C{i:07d}",
            "patient_id": f"P{random.randint(1, 30000):06d}",
            "payer_type": payer_type,
            "payer_plan": payer_plan,
            "provider_npi": f"{random.randint(1000000000, 1999999999)}",
            "service_date": service_date.isoformat(),
            "claim_received_date": received_date.isoformat(),
            "claim_processed_date": processed_date.isoformat(),
            "cpt_hcpcs_code": cpt,
            "icd10_code": icd,
            "billed_amount": round(billed, 2),
            "allowed_amount": round(allowed, 2),
            "paid_amount": round(paid, 2),
            "claim_status": status,
            "denial_reason": denial_reason,
            "adjustment_code": adj_code,
            "appeal_eligible": appeal,
        })
