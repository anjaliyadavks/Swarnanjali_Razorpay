import os
import json
import random
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

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

FALLBACK_TRACES = {
    "BANK_DOWNTIME": [
        "Issuer node down. Unable to reach HDFC switch.",
        "Bank of Baroda gateway timeout (504).",
        "Connection refused by ICICI core banking system."
    ],
    "CARD_EXPIRED": [
        "Card expired. Do not honor.",
        "Expiration date invalid or passed.",
        "Issuer decline: Card expired."
    ],
    "INSUFFICIENT_FUNDS": [
        "Declined: Insufficient funds in account.",
        "Low balance. Cannot authorize transaction.",
        "Issuer decline (51): Not sufficient funds."
    ],
    "RISK_BLOCK": [
        "Blocked by internal risk engine: High velocity.",
        "Fraud check failed. IP and billing mismatch.",
        "Card flagged for suspicious activity by issuer."
    ],
    "UPI_TIMEOUT": [
        "NPCI switch timeout: No response received from PSP (SBI) for VPA.",
        "UPI intent timeout. User took too long to approve.",
        "No response from remitter bank."
    ],
    "OTP_AUTH_FAILURE": [
        "Authentication failed. Customer provided incorrect OTP.",
        "3D Secure verification failed.",
        "OTP expired before entry."
    ],
    "LIMIT_EXCEEDED": [
        "Transaction amount exceeds daily permitted limit for this account.",
        "Velocity limit exceeded (Code: 61).",
        "Max transaction limit reached."
    ],
    "NETWORK_ERROR": [
        "Transient network disruption during TLS handshake.",
        "Gateway read timeout.",
        "Upstream service unavailable (502 Bad Gateway)."
    ]
}

def generate_offline_pool():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    pool = {cause: [] for cause in CAUSES}
    
    if api_key:
        print("Anthropic key found. Generating traces via LLM (this may take a minute)...")
        client = Anthropic(api_key=api_key)
        for cause in CAUSES:
            prompt = f"Generate 10 highly realistic, varied, technical payment gateway error messages (1 sentence each) for the root cause: {cause}. Use Indian bank names (SBI, HDFC, ICICI, Axis) and standard HTTP/network jargon where appropriate. Return ONLY a JSON array of strings."
            try:
                res = client.messages.create(
                    model="claude-3-5-sonnet-20240620",
                    max_tokens=500,
                    temperature=0.7,
                    messages=[{"role": "user", "content": prompt}]
                )
                content = res.content[0].text
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].strip()
                traces = json.loads(content)
                pool[cause].extend(traces)
                print(f"Generated {len(traces)} traces for {cause}.")
            except Exception as e:
                print(f"Failed to generate for {cause}: {e}")
                pool[cause].extend(FALLBACK_TRACES[cause])
    else:
        print("No Anthropic API key found. Using rich fallback traces.")
        pool = FALLBACK_TRACES
        
    with open("realistic_traces.json", "w") as f:
        json.dump(pool, f, indent=2)
    print("Seed complete. Saved to realistic_traces.json.")

if __name__ == "__main__":
    generate_offline_pool()
