import random

STRATEGY_MAP = {
    "BANK_DOWNTIME": {
        "action": "API-Retry after 15m delay",
        "max_retries": 2,
        "success_prob": 0.60
    },
    "UPI_TIMEOUT": {
        "action": "Immediate API-Retry (Same VPA)",
        "max_retries": 1,
        "success_prob": 0.70
    },
    "CARD_EXPIRED": {
        "action": "Email/SMS: Send 'Update Card' Payment Link",
        "max_retries": 0,
        "success_prob": 0.65
    },
    "INSUFFICIENT_FUNDS": {
        "action": "Schedule 3-day Delay + WhatsApp Reminder Link",
        "max_retries": 1,
        "success_prob": 0.35
    },
    "RISK_BLOCK": {
        "action": "Escalate to Human Review Queue",
        "max_retries": 0,
        "success_prob": 0.00
    },
    "OTP_AUTH_FAILURE": {
        "action": "In-App Re-prompt + SMS Fallback",
        "max_retries": 1,
        "success_prob": 0.55
    },
    "LIMIT_EXCEEDED": {
        "action": "Suggest Alternate Method via WhatsApp",
        "max_retries": 0,
        "success_prob": 0.40
    },
    "NETWORK_ERROR": {
        "action": "Immediate API-Retry",
        "max_retries": 1,
        "success_prob": 0.80
    }
}

def get_strategy(cause: str):
    return STRATEGY_MAP.get(cause, {
        "action": "Escalate to Human Review",
        "max_retries": 0,
        "success_prob": 0.0
    })

def simulate_outcome(cause: str) -> bool:
    """Returns True if simulated recovered, False otherwise."""
    prob = get_strategy(cause)["success_prob"]
    return random.random() < prob
