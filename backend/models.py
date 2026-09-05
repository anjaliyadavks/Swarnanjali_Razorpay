from pydantic import BaseModel
from typing import List, Optional, Literal
from datetime import datetime

class PaymentRecord(BaseModel):
    payment_id: str
    amount_inr: float
    timestamp: str
    payment_method: str
    error_code: str
    gateway_message: str
    customer_id: str
    retry_count_so_far: int

class ClassificationResult(BaseModel):
    cause: str
    confidence: float
    reasoning: str
    classified_by: Literal["rule", "llm"]
    needs_human_review: bool

class AuditLogEntry(BaseModel):
    payment_id: str
    cause: str
    action: str
    attempt_number: int
    timestamp: str
    outcome: Literal["RECOVERED", "STILL_FAILED", "ESCALATED"]
    reasoning: Optional[str] = None
    classified_by: str

class MetricsSummary(BaseModel):
    total_at_risk: float
    total_recovered: float
    overall_recovery_rate: float
    rule_classified_count: int
    llm_classified_count: int
    human_review_routed_count: int
    llm_api_cost_inr: float
    baseline_recovered: float
    ai_lift_percentage: float
