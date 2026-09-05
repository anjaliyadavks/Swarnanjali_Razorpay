# RecoveryTree 🌳

An AI Revenue Recovery Agent for failed digital payments, built for the **Razorpay AI Buildathon (Track 3: AI Revenue Recovery)**.

## Overview
RecoveryTree takes a batch of failed payments, classifies each one by root cause, picks a bounded recovery strategy per cause, simulates execution, and reports measured ₹ recovered per cause with a full audit trail and a visual decision tree.

## Architecture

This project implements a robust, safe architecture designed specifically for handling money movement reliably:

### 1. Two-Tier Classifier
- **Tier 1 (Deterministic Rules Engine):** We first attempt to match the error code to known signatures. If a match is found, the LLM is bypassed entirely. This guarantees 100% deterministic behaviour for known failure modes.
- **Tier 2 (LLM Fallback):** For records where the error message is ambiguous free-text, we call an Anthropic LLM (Claude) to classify the message. If confidence is `< 0.7`, the record is instantly routed to a human review queue.

### 2. Strategy Engine & Data Calibration
- **NPCI Calibration:** Cause distribution is deliberately calibrated to NPCI's published Technical Decline / Business Decline split (BD ~7.6%, TD ~1.7% per NPCI data, Aug-Nov 2021; NPCI Vision 2025 targets BD <5%, TD <1%). This brings realism to the synthetic batch rather than using an arbitrary even split.
- **BANK_DOWNTIME Nuance:** Modeled per NPCI rules: when issuer servers don't respond within ~30s, the transaction is declined but the customer might still be debited. RecoveryTree handles this by entering a simulated `PENDING_REVERSAL` state before executing the delayed 15-minute retry.
- **Max Retries Bound:** Each strategy enforces hard stops (e.g., 1 for UPI, 2 for Bank downtime, 0 for Limit exceeded). A payment will never be blindly retried infinitely.

### 3. "Explainable, Bounded, Gated"
This architecture satisfies the requirements for autonomous money actions:
- **Explainable:** Every LLM classification returns a 1-sentence reasoning string. Every action is logged in an immutable audit trail.
- **Bounded:** The Strategy Engine sets explicit hard stops (max 1 retry for most methods). 
- **Gated:** `RISK_BLOCK` failures are hard-coded to 0 retries (a compliance gate). Any low-confidence LLM classification is also gated to a Human Review queue, keeping humans-in-the-loop for risky recoveries.

---

## Setup & Running Locally

### Backend (Python/FastAPI)

1. Navigate to the `backend` directory:
   ```bash
   cd recoverytree/backend
   ```
2. Set up a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Set your API key:
   - Rename `.env.example` to `.env`
   - Add your Anthropic API Key: `ANTHROPIC_API_KEY=sk-ant-...`
4. Run the API server:
   ```bash
   python main.py
   ```
   *The backend runs on http://localhost:8000*

### Frontend (React/Vite/Tailwind)

1. Navigate to the `frontend` directory:
   ```bash
   cd recoverytree/frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *The frontend runs on http://localhost:5173*

## Judging Criteria Checklist Met:
- [x] Metrics computed over whole batch, not cherry-picked demos.
- [x] 8 specific root causes implemented.
- [x] Two-tier classification (Rules + LLM fallback with reasoning).
- [x] Bounded strategy engine.
- [x] Synthetic dataset generator with probabilistic simulation.
- [x] Visual Decision Tree (Mermaid integration).
- [x] ₹ Recovered by cause chart (Recharts).
- [x] Full audit log table.
- [x] Honest exceptions (RISK_BLOCK explicitly gated).

## TODO: Real API Integration
In a production environment (Razorpay test-mode):
1. **backend/orchestrator.py**: Replace `simulate_outcome()` with actual Razorpay Payment Retry API calls or Payment Link creation calls depending on the strategy.
2. **backend/strategy_engine.py**: The "send 'update card' notification" action would trigger a real email/SMS via Razorpay Webhooks or AWS SNS.
