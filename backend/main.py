from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from data_generator import generate_synthetic_batch
from orchestrator import Orchestrator
from audit_logger import audit_logger
from strategy_engine import STRATEGY_MAP

app = FastAPI(title="RecoveryTree API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

current_batch = []
current_metrics = {}

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/batch/generate")
def generate_batch():
    global current_batch
    current_batch = generate_synthetic_batch(80)
    return {"message": f"Generated {len(current_batch)} records", "count": len(current_batch), "data": current_batch}

@app.post("/api/batch/run")
def run_batch():
    global current_metrics
    if not current_batch:
        return {"error": "No batch generated"}
    
    audit_logger.clear()
    orchestrator = Orchestrator()
    orchestrator.process_batch(current_batch)
    
    current_metrics = orchestrator.get_metrics()
    return {"message": "Batch processed successfully"}

@app.post("/api/demo/run-single")
def run_single_demo(cause: str = "BANK_DOWNTIME"):
    from data_generator import generate_indian_identity, load_realistic_traces
    from models import PaymentRecord
    from datetime import datetime
    import random
    
    traces = load_realistic_traces()
    msg = random.choice(traces.get(cause, ["Simulated error trace."]))
    name, _ = generate_indian_identity()
    
    record = PaymentRecord(
        payment_id=f"DEMO_{random.randint(1000, 9999)}",
        amount_inr=1500.0,
        timestamp=datetime.now().isoformat(),
        payment_method="upi",
        error_code="GATEWAY_ERROR",
        gateway_message=msg,
        customer_id=name,
        retry_count_so_far=0
    )
    
    # Temporarily isolate the audit logger for this single run
    audit_logger.clear()
    orchestrator = Orchestrator()
    orchestrator.process_payment(record)
    
    logs = audit_logger.get_logs()
    return {"record": record.model_dump(), "logs": logs}

@app.post("/api/demo/real-recover")
def run_real_recover(cause: str = "CARD_EXPIRED"):
    import os
    import json
    import base64
    import urllib.request
    from urllib.error import URLError
    from datetime import datetime, timedelta
    
    # 1. Generate Razorpay Payment Link
    rzp_key = os.environ.get("RAZORPAY_KEY_ID", "rzp_test_TY1I6YUqrEZXxY")
    rzp_secret = os.environ.get("RAZORPAY_KEY_SECRET", "5CDYgiIlUXUskOZ3qJp2fWLu")
    
    amount_inr = 3500 if cause == "CARD_EXPIRED" else 1299
    
    auth_str = f"{rzp_key}:{rzp_secret}"
    b64_auth = base64.b64encode(auth_str.encode('ascii')).decode('ascii')
    
    payload = {
        "amount": int(amount_inr * 100), # in paise
        "currency": "INR",
        "accept_partial": False,
        "expire_by": int((datetime.now() + timedelta(minutes=60)).timestamp()),
        "reference_id": f"REC_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "description": "Payment Recovery - Premium Subscription",
        "customer": {
            "name": "Live Demo User",
            "email": "demo@example.com",
            "contact": os.environ.get("TARGET_PHONE_NUMBER", "+919999999999")
        },
        "notify": {
            "sms": False,
            "email": False
        },
        "reminder_enable": False,
        "notes": {
            "cause": cause
        }
    }
    
    req = urllib.request.Request(
        "https://api.razorpay.com/v1/payment_links",
        data=json.dumps(payload).encode('utf-8'),
        headers={
            "Authorization": f"Basic {b64_auth}",
            "Content-Type": "application/json"
        },
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            rzp_resp = json.loads(response.read().decode('utf-8'))
            payment_link = rzp_resp.get("short_url", "")
            payment_link_id = rzp_resp.get("id", "")
    except urllib.error.HTTPError as e:
        payment_link = f"https://rzp.io/i/mock{int(datetime.now().timestamp())}"
        payment_link_id = "mock_id"
        print(f"Razorpay API HTTP Error: {e.code} - {e.read().decode('utf-8')}")
    except Exception as e:
        payment_link = f"https://rzp.io/i/mock{int(datetime.now().timestamp())}"
        payment_link_id = "mock_id"
        print(f"Razorpay API Error: {e}")
        
    # 2. Send Twilio SMS (if configured)
    twilio_sid = os.environ.get("TWILIO_ACCOUNT_SID")
    twilio_token = os.environ.get("TWILIO_AUTH_TOKEN")
    twilio_from = os.environ.get("TWILIO_PHONE_NUMBER")
    twilio_to = os.environ.get("TARGET_PHONE_NUMBER")
    
    sms_status = "Skipped (No Twilio Config)"
    
    if twilio_sid and twilio_token and twilio_from and twilio_to:
        import urllib.parse
        t_auth = base64.b64encode(f"{twilio_sid}:{twilio_token}".encode('ascii')).decode('ascii')
        
        msg_body = f"Hi! Your recent payment of Rs {amount_inr} failed due to {cause}. Please complete it here: {payment_link}"
        t_data = urllib.parse.urlencode({
            "To": twilio_to,
            "From": twilio_from,
            "Body": msg_body
        }).encode('utf-8')
        
        t_req = urllib.request.Request(
            f"https://api.twilio.com/2010-04-01/Accounts/{twilio_sid}/Messages.json",
            data=t_data,
            headers={"Authorization": f"Basic {t_auth}"},
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(t_req) as response:
                t_resp = json.loads(response.read().decode('utf-8'))
                sms_status = f"Sent (SID: {t_resp.get('sid')})"
        except Exception as e:
            sms_status = f"Error: {e}"
            print(f"Twilio API Error: {e}")

    return {
        "payment_link": payment_link,
        "payment_link_id": payment_link_id,
        "amount": amount_inr,
        "cause": cause,
        "sms_status": sms_status
    }

@app.get("/api/results/summary")
def get_summary():
    return current_metrics

@app.get("/api/results/audit-log")
def get_audit_log():
    return {"logs": audit_logger.get_logs()}

@app.get("/api/results/decision-tree")
def get_decision_tree():
    mermaid = ["graph TD", "    Start[Failed Payment] --> Classifier{Classifier}"]
    
    mermaid.append("    Classifier -- Rules --> Tier1[Tier 1: Rules Engine]")
    mermaid.append("    Classifier -- LLM --> Tier2[Tier 2: LLM Fallback]")
    
    # Pre-define outcome nodes to prevent duplicate node definition errors
    mermaid.append("    HR_Queue[Human Review Queue]")
    mermaid.append("    Recovered[RECOVERED]")
    mermaid.append("    Failed[STILL_FAILED]")
    
    for cause, st in STRATEGY_MAP.items():
        mermaid.append(f"    Tier1 --> {cause}[{cause}]")
        mermaid.append(f"    Tier2 --> {cause}")
        
        if cause == "RISK_BLOCK":
            mermaid.append(f"    {cause} -->|Escalate| HR_Queue")
        else:
            action_clean = st['action'].replace('"', "").replace("'", "").replace("(", "").replace(")", "").replace("+", "and")
            mermaid.append(f"    {cause} -->|{action_clean}| Action_{cause}[Execute]")
            mermaid.append(f"    Action_{cause} -->|Success| Recovered")
            mermaid.append(f"    Action_{cause} -->|Max Retries Reached| Failed")
            
    return {"mermaid": "\n".join(mermaid)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
