from models import PaymentRecord, ClassificationResult, AuditLogEntry
from classifier import classify_payment
from strategy_engine import get_strategy, simulate_outcome
from audit_logger import audit_logger
from datetime import datetime
import random

class Orchestrator:
    def __init__(self):
        self.metrics = {
            "total_at_risk": 0.0,
            "total_recovered": 0.0,
            "rule_classified": 0,
            "llm_classified": 0,
            "human_review": 0,
            "llm_cost": 0.0,
            "baseline_recovered": 0.0
        }
        
    def process_batch(self, batch: list):
        for record_dict in batch:
            record = PaymentRecord(**record_dict)
            self.metrics["total_at_risk"] += record.amount_inr
            self.process_payment(record)
            
    def process_payment(self, record: PaymentRecord):
        # 1. Classify
        classification = classify_payment(record)
        
        if classification.classified_by == "rule":
            self.metrics["rule_classified"] += 1
        else:
            self.metrics["llm_classified"] += 1
            # Assuming Sonnet 3.5 cost per classification ~0.003$ per 1000 tokens ~ ₹0.10 per call
            self.metrics["llm_cost"] += 0.10
            
        # --- Baseline Simulation ---
        # A "dumb" system blindly retries everything EXCEPT blocked/expired cards. Success rate flat 20%.
        if classification.cause not in ["RISK_BLOCK", "CARD_EXPIRED"]:
            if random.random() < 0.20:
                self.metrics["baseline_recovered"] += record.amount_inr
                
        # 2. Check for human review
        if classification.needs_human_review or classification.cause == "RISK_BLOCK":
            self.metrics["human_review"] += 1
            audit_logger.log(AuditLogEntry(
                payment_id=record.payment_id,
                cause=classification.cause,
                action="escalate to manual review queue",
                attempt_number=0,
                timestamp=datetime.now().isoformat(),
                outcome="ESCALATED",
                reasoning=classification.reasoning,
                classified_by=classification.classified_by
            ))
            return
            
        # 3. Get strategy
        strategy = get_strategy(classification.cause)
        max_retries = strategy["max_retries"]
        action = strategy["action"]
        
        # 4. Action Loop
        attempts_to_make = max(1, max_retries)
        
        # --- BANK DOWNTIME NUANCE (NPCI rules) ---
        if classification.cause == "BANK_DOWNTIME":
            # Per NPCI, issuer bank servers must respond within ~30s; when they don't, 
            # it's declined but the customer's account may be debited, triggering auto-reversal.
            audit_logger.log(AuditLogEntry(
                payment_id=record.payment_id,
                cause=classification.cause,
                action="Enter PENDING_REVERSAL state",
                attempt_number=0,
                timestamp=datetime.now().isoformat(),
                outcome="STILL_FAILED",
                reasoning="Waiting for issuer auto-reversal before safe retry.",
                classified_by=classification.classified_by
            ))
        
        recovered = False
        for attempt in range(1, attempts_to_make + 1):
            # TODO (Razorpay Test-Mode Integration): 
            # Replace `simulate_outcome` below with actual Razorpay API calls based on strategy.
            # Example for UPI_TIMEOUT: 
            #   client.payment.create({'amount': record.amount, 'method': 'upi', ...})
            # Example for CARD_EXPIRED:
            #   client.payment_link.create({'amount': record.amount, 'description': 'Update Card', ...})
            
            success = simulate_outcome(classification.cause)
            
            outcome = "RECOVERED" if success else "STILL_FAILED"
            
            audit_logger.log(AuditLogEntry(
                payment_id=record.payment_id,
                cause=classification.cause,
                action=action,
                attempt_number=attempt,
                timestamp=datetime.now().isoformat(),
                outcome=outcome,
                reasoning=classification.reasoning,
                classified_by=classification.classified_by
            ))
            
            if success:
                recovered = True
                self.metrics["total_recovered"] += record.amount_inr
                break

    def get_metrics(self):
        total = self.metrics["total_at_risk"]
        rec = self.metrics["total_recovered"]
        base_rec = self.metrics["baseline_recovered"]
        
        rate = (rec / total * 100) if total > 0 else 0.0
        
        ai_lift = 0.0
        if base_rec > 0:
            ai_lift = ((rec - base_rec) / base_rec) * 100
        elif rec > 0:
            ai_lift = 100.0 # 100% lift if baseline recovered 0
            
        return {
            "total_at_risk": total,
            "total_recovered": rec,
            "overall_recovery_rate": rate,
            "rule_classified_count": self.metrics["rule_classified"],
            "llm_classified_count": self.metrics["llm_classified"],
            "human_review_routed_count": self.metrics["human_review"],
            "llm_api_cost_inr": self.metrics["llm_cost"],
            "baseline_recovered": base_rec,
            "ai_lift_percentage": ai_lift
        }
