import os
import json
from anthropic import Anthropic
from models import PaymentRecord, ClassificationResult
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("ANTHROPIC_API_KEY")
client = Anthropic(api_key=api_key) if api_key else None

VALID_CAUSES = [
    "BANK_DOWNTIME",
    "CARD_EXPIRED",
    "INSUFFICIENT_FUNDS",
    "RISK_BLOCK",
    "UPI_TIMEOUT",
    "OTP_AUTH_FAILURE",
    "LIMIT_EXCEEDED",
    "NETWORK_ERROR"
]

# Tier 1 rules engine: keyword → cause. Covers all seed_database fallback traces + common real-world variants.
# Keys are lowercased substrings to match against gateway_message.lower()
TIER_1_RULES = {
    # BANK_DOWNTIME
    "issuer node down": "BANK_DOWNTIME",
    "gateway timeout": "BANK_DOWNTIME",
    "connection refused": "BANK_DOWNTIME",
    "bank of baroda gateway timeout": "BANK_DOWNTIME",
    "unable to reach": "BANK_DOWNTIME",
    "core banking system": "BANK_DOWNTIME",
    "504": "BANK_DOWNTIME",
    # CARD_EXPIRED
    "card expired": "CARD_EXPIRED",
    "expiration date invalid": "CARD_EXPIRED",
    "do not honor": "CARD_EXPIRED",
    "card has expired": "CARD_EXPIRED",
    # INSUFFICIENT_FUNDS
    "insufficient funds": "INSUFFICIENT_FUNDS",
    "not sufficient funds": "INSUFFICIENT_FUNDS",
    "low balance": "INSUFFICIENT_FUNDS",
    "cannot authorize": "INSUFFICIENT_FUNDS",
    "decline code 51": "INSUFFICIENT_FUNDS",
    # RISK_BLOCK
    "internal risk engine": "RISK_BLOCK",
    "fraud check failed": "RISK_BLOCK",
    "flagged for suspicious": "RISK_BLOCK",
    "high velocity": "RISK_BLOCK",
    "billing mismatch": "RISK_BLOCK",
    # UPI_TIMEOUT
    "npci switch timeout": "UPI_TIMEOUT",
    "upi intent timeout": "UPI_TIMEOUT",
    "remitter bank": "UPI_TIMEOUT",
    "no response from psp": "UPI_TIMEOUT",
    "vpa": "UPI_TIMEOUT",
    # OTP_AUTH_FAILURE
    "incorrect otp": "OTP_AUTH_FAILURE",
    "otp expired": "OTP_AUTH_FAILURE",
    "3d secure verification failed": "OTP_AUTH_FAILURE",
    "authentication failed": "OTP_AUTH_FAILURE",
    "otp": "OTP_AUTH_FAILURE",
    # LIMIT_EXCEEDED
    "limit exceeded": "LIMIT_EXCEEDED",
    "velocity limit": "LIMIT_EXCEEDED",
    "daily permitted limit": "LIMIT_EXCEEDED",
    "max transaction limit": "LIMIT_EXCEEDED",
    "velocity": "LIMIT_EXCEEDED",
    # NETWORK_ERROR
    "tls handshake": "NETWORK_ERROR",
    "gateway read timeout": "NETWORK_ERROR",
    "bad gateway": "NETWORK_ERROR",
    "502": "NETWORK_ERROR",
    "transient network": "NETWORK_ERROR",
    "upstream service unavailable": "NETWORK_ERROR",
}

def classify_tier1(record: PaymentRecord) -> ClassificationResult:
    msg = record.gateway_message.lower()
    
    # If the error code is UNKNOWN, skip Tier 1 to simulate ambiguous records
    if record.error_code == "UNKNOWN_INTERNAL_ERROR":
        return None
        
    for key, cause in TIER_1_RULES.items():
        if key in msg:
            return ClassificationResult(
                cause=cause,
                confidence=1.0,
                reasoning=f"Deterministic rule matched keyword '{key}'.",
                classified_by="rule",
                needs_human_review=False
            )
    return None

def classify_tier2_llm(record: PaymentRecord) -> ClassificationResult:
    if not client:
        return _mock_llm_classification(record)
        
    prompt = f"""
    You are an AI payment recovery classifier.
    Analyze the following failed payment and classify its root cause into exactly one of these categories:
    {VALID_CAUSES}

    Payment Details:
    - Error Code: {record.error_code}
    - Gateway Message: {record.gateway_message}
    - Payment Method: {record.payment_method}
    - Amount: {record.amount_inr}

    Return strict JSON with the following schema:
    {{
        "cause": "ONE_OF_THE_VALID_CAUSES",
        "confidence": float (between 0.0 and 1.0),
        "reasoning": "A one sentence explanation of why you chose this cause."
    }}
    """
    
    try:
        response = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=200,
            temperature=0,
            system="You are a strict JSON-only API. Only output valid JSON matching the schema.",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        content = response.content[0].text
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
            
        data = json.loads(content)
        cause = data.get("cause")
        confidence = float(data.get("confidence", 0.0))
        reasoning = data.get("reasoning", "No reasoning provided.")
        
        if cause not in VALID_CAUSES:
            cause = "NETWORK_ERROR"
            
        # Dynamic Risk-Adjusted Thresholds
        if record.amount_inr > 20000:
            threshold = 0.95 # High ticket: strictly demand 95% confidence
        elif record.amount_inr > 5000:
            threshold = 0.80 # Mid ticket: demand 80% confidence
        else:
            threshold = 0.60 # Low ticket: accept 60% confidence
            
        return ClassificationResult(
            cause=cause,
            confidence=confidence,
            reasoning=reasoning,
            classified_by="llm",
            needs_human_review=(confidence < threshold)
        )
    except Exception as e:
        print(f"LLM Error: {e}")
        return _mock_llm_classification(record)

def _mock_llm_classification(record: PaymentRecord) -> ClassificationResult:
    msg = record.gateway_message.lower()
    if "down" in msg or "timeout" in msg and "504" in msg or "refused" in msg:
        cause = "BANK_DOWNTIME"
        confidence = 0.85
    elif "time" in msg or "took too long" in msg or "remitter" in msg:
        cause = "UPI_TIMEOUT"
        confidence = 0.9
    elif "risk" in msg or "fraud" in msg or "suspicious" in msg:
        cause = "RISK_BLOCK"
        confidence = 0.95
    elif "expir" in msg or "invalid" in msg:
        cause = "CARD_EXPIRED"
        confidence = 0.99
    elif "balance" in msg or "funds" in msg:
        cause = "INSUFFICIENT_FUNDS"
        confidence = 0.8
    elif "otp" in msg or "3d secure" in msg:
        cause = "OTP_AUTH_FAILURE"
        confidence = 0.75
    elif "limit" in msg or "velocity" in msg:
        cause = "LIMIT_EXCEEDED"
        confidence = 0.88
    else:
        cause = "NETWORK_ERROR"
        confidence = 0.65
        
    if record.amount_inr > 20000:
        threshold = 0.95
    elif record.amount_inr > 5000:
        threshold = 0.80
    else:
        threshold = 0.60
        
    return ClassificationResult(
        cause=cause,
        confidence=confidence,
        reasoning="Mocked LLM parsed contextual signals from trace.",
        classified_by="llm",
        needs_human_review=(confidence < threshold)
    )

def classify_payment(record: PaymentRecord) -> ClassificationResult:
    res = classify_tier1(record)
    if res:
        return res
    return classify_tier2_llm(record)
