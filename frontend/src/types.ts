export interface PaymentRecord {
  payment_id: string;
  amount_inr: number;
  timestamp: string;
  payment_method: string;
  error_code: string;
  gateway_message: string;
  customer_id: string;
  retry_count_so_far: number;
}

export interface AuditLogEntry {
  payment_id: string;
  cause: string;
  action: string;
  attempt_number: number;
  timestamp: string;
  outcome: 'RECOVERED' | 'STILL_FAILED' | 'ESCALATED';
  reasoning?: string;
  classified_by: string;
}

export interface MetricsSummary {
  total_at_risk: number;
  total_recovered: number;
  overall_recovery_rate: number;
  rule_classified_count: number;
  llm_classified_count: number;
  human_review_routed_count: number;
  llm_api_cost_inr: number;
  baseline_recovered: number;
  ai_lift_percentage: number;
}
