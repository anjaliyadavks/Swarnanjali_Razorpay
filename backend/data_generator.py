import json
import random
from datetime import datetime, timedelta
from typing import List

# Standard library fallback for names to avoid Faker dependency crashes
FIRST_NAMES = ["Aarav", "Vihaan", "Vivaan", "Ananya", "Diya", "Advik", "Kabir", "Anika", "Navya", "Oviya", "Dhruv", "Ishan", "Rudra", "Saanvi", "Aadhya", "Aryan", "Kavya", "Priya", "Rahul", "Neha", "Amit", "Pooja", "Vikram", "Sneha", "Karan", "Riya", "Aditya", "Shruti", "Rohan", "Megha"]
LAST_NAMES = ["Sharma", "Verma", "Gupta", "Malhotra", "Singh", "Patel", "Reddy", "Rao", "Jain", "Desai", "Joshi", "Bhat", "Mehta", "Bose", "Das", "Mukherjee", "Banerjee", "Chatterjee", "Nair", "Menon", "Pillai", "Iyer", "Kumar", "Mishra", "Pandey"]
DOMAINS = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "company.in"]

def generate_indian_identity():
    first = random.choice(FIRST_NAMES)
    last = random.choice(LAST_NAMES)
    name = f"{first} {last}"
    email = f"{first.lower()}.{last.lower()}{random.randint(1,99)}@{random.choice(DOMAINS)}"
    return name, email

def generate_lognormal_amount():
    # lognormvariate(mu, sigma). For INR: mu=6.5, sigma=1.0 gives a nice spread (median ~600, mean ~1000, max ~50k)
    amt = random.lognormvariate(6.5, 1.0)
    # Bound it between 100 and 100000
    amt = max(100.0, min(100000.0, amt))
    return round(amt, 2)

CAUSES = [
    "BANK_DOWNTIME",
    "CARD_EXPIRED",
    "INSUFFICIENT_FUNDS",
    "RISK_BLOCK",
    "UPI_TIMEOUT",
    "OTP_AUTH_FAILURE",
    "LIMIT_EXCEEDED",
    "NETWORK_ERROR"
]

def load_realistic_traces():
    try:
        with open("realistic_traces.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        import seed_database
        seed_database.generate_offline_pool()
        with open("realistic_traces.json", "r") as f:
            return json.load(f)

def generate_synthetic_batch(size: int = 80) -> List[dict]:
    traces = load_realistic_traces()
    records = []
    
    num_ambiguous = 15
    num_standard = size - num_ambiguous
    
    now = datetime.now()
    
    CAUSE_DISTRIBUTION = [
        ("INSUFFICIENT_FUNDS", 0.35),
        ("OTP_AUTH_FAILURE", 0.20),
        ("RISK_BLOCK", 0.15),
        ("LIMIT_EXCEEDED", 0.10),
        ("UPI_TIMEOUT", 0.08),
        ("BANK_DOWNTIME", 0.06),
        ("NETWORK_ERROR", 0.04),
        ("CARD_EXPIRED", 0.02)
    ]
    
    # Generate standard deterministic records
    for i in range(num_standard):
        rand = random.random()
        cumulative = 0
        cause = "INSUFFICIENT_FUNDS"
        for c, w in CAUSE_DISTRIBUTION:
            cumulative += w
            if rand <= cumulative:
                cause = c
                break
        
        # Make the error code more realistic than just ERR_CAUSE
        error_code = f"BAD_REQUEST_ERROR" if cause in ["CARD_EXPIRED", "INSUFFICIENT_FUNDS", "LIMIT_EXCEEDED", "OTP_AUTH_FAILURE"] else "GATEWAY_ERROR"
        if cause == "RISK_BLOCK": error_code = "RISK_ERROR"
        
        # Pick a realistic trace
        message = random.choice(traces[cause])
        
        method = "card"
        if "UPI" in cause or "UPI" in message.upper(): method = "upi"
        elif "bank" in message.lower() or "netbanking" in message.lower(): method = "netbanking"
        else: method = random.choice(["card", "upi", "netbanking"])
        
        name, email = generate_indian_identity()
        
        # Cluster timestamps around peak hours (10 AM and 7 PM)
        peak_hour = random.choice([10, 19])
        noise_minutes = random.randint(-120, 120)
        timestamp = now.replace(hour=peak_hour, minute=0, second=0, microsecond=0) + timedelta(minutes=noise_minutes)
        if timestamp > now: timestamp -= timedelta(days=1)
            
        record = {
            "payment_id": f"PAY_{i+1:03d}",
            "amount_inr": generate_lognormal_amount(),
            "timestamp": timestamp.isoformat(),
            "payment_method": method,
            "error_code": error_code,
            "gateway_message": message,
            "customer_id": name,
            "retry_count_so_far": 0
        }
        records.append(record)
        
    # Generate ambiguous records for the LLM Tier
    for i in range(num_ambiguous):
        rand = random.random()
        cumulative = 0
        cause = "INSUFFICIENT_FUNDS"
        for c, w in CAUSE_DISTRIBUTION:
            cumulative += w
            if rand <= cumulative:
                cause = c
                break
        message = random.choice(traces[cause])
        name, email = generate_indian_identity()
        
        peak_hour = random.choice([10, 19])
        noise_minutes = random.randint(-120, 120)
        timestamp = now.replace(hour=peak_hour, minute=0, second=0, microsecond=0) + timedelta(minutes=noise_minutes)
        if timestamp > now: timestamp -= timedelta(days=1)
        
        record = {
            "payment_id": f"PAY_AMB_{i+1:03d}",
            "amount_inr": generate_lognormal_amount(),
            "timestamp": timestamp.isoformat(),
            "payment_method": random.choice(["card", "upi", "netbanking"]),
            "error_code": "UNKNOWN_INTERNAL_ERROR",
            "gateway_message": f"Raw Trace: {message} | Unable to parse upstream response.",
            "customer_id": name,
            "retry_count_so_far": 0
        }
        records.append(record)
        
    random.shuffle(records)
    return records

if __name__ == "__main__":
    batch = generate_synthetic_batch(80)
    print(f"Generated {len(batch)} records.")
