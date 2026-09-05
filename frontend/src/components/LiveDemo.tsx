import React, { useState } from 'react';
import { runSingleDemo } from '../api';
import { AlertCircle, RefreshCw, CheckCircle, ShieldAlert, Clock, ArrowRight, XCircle, UserCheck, Zap } from 'lucide-react';

const CAUSE_CONFIG: Record<string, { label: string; emoji: string; amount: number; product: string; method: string }> = {
  BANK_DOWNTIME:      { label: 'Bank Downtime',       emoji: '🏦', amount: 4999,  product: 'Flight Booking',        method: 'UPI' },
  INSUFFICIENT_FUNDS: { label: 'Insufficient Funds',  emoji: '💸', amount: 1299,  product: 'OTT Subscription',      method: 'Debit Card' },
  OTP_AUTH_FAILURE:   { label: 'OTP Auth Failure',    emoji: '🔑', amount: 799,   product: 'Gaming Credits',        method: 'Net Banking' },
  UPI_TIMEOUT:        { label: 'UPI Timeout',          emoji: '⏱️', amount: 2150,  product: 'E-commerce Cart',       method: 'UPI' },
  CARD_EXPIRED:       { label: 'Card Expired',         emoji: '💳', amount: 3500,  product: 'Hotel Booking',         method: 'Credit Card' },
  LIMIT_EXCEEDED:     { label: 'Limit Exceeded',       emoji: '🚫', amount: 15000, product: 'Electronics Purchase',  method: 'Debit Card' },
  NETWORK_ERROR:      { label: 'Network Error',        emoji: '📡', amount: 599,   product: 'Food Delivery',         method: 'UPI' },
  RISK_BLOCK:         { label: 'Risk Block',           emoji: '⚠️', amount: 50000, product: 'Jewellery Purchase',    method: 'Credit Card' },
};

export default function LiveDemo() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [selectedCause, setSelectedCause] = useState('BANK_DOWNTIME');
  const [useRealApi, setUseRealApi] = useState(true);

  const cfg = CAUSE_CONFIG[selectedCause];

  const handlePay = async () => {
    setIsProcessing(true);
    setResult(null);
    setActiveStep(0);

    setTimeout(async () => {
      try {
        let data;
        if (useRealApi) {
            const res = await fetch(`http://localhost:8000/api/demo/real-recover?cause=${selectedCause}`, { method: 'POST' });
            const realData = await res.json();
            // Wrap the realData in the expected format for the UI
            data = {
                record: { gateway_message: `Gateway Error: ${selectedCause}`, amount_inr: realData.amount },
                logs: [
                    { cause: selectedCause, classified_by: 'rule', action: 'Classify and Strategize' },
                    { action: `Generated Razorpay Link: ${realData.payment_link_id} | SMS Status: ${realData.sms_status}`, outcome: 'RECOVERED' }
                ],
                real_link: realData.payment_link
            };
        } else {
            data = await runSingleDemo(selectedCause);
        }
        
        setResult(data);
        const isBankDowntime = selectedCause === 'BANK_DOWNTIME';
        setTimeout(() => setActiveStep(1), 800);
        setTimeout(() => setActiveStep(2), 2000);
        if (isBankDowntime && !useRealApi) {
          setTimeout(() => setActiveStep(3), 3500);
          setTimeout(() => setActiveStep(4), 5000);
          setTimeout(() => setActiveStep(5), 6500);
        } else {
          setTimeout(() => setActiveStep(4), 3500);
          setTimeout(() => setActiveStep(5), 5000);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsProcessing(false);
      }
    }, 1200);
  };

  const finalOutcome = result?.logs?.slice(-1)[0]?.outcome;
  const isRecovered = finalOutcome === 'RECOVERED';
  const isEscalated = finalOutcome === 'ESCALATED';

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Cause Picker */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Select a Payment Failure Scenario to Simulate
            </h3>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Simulated</span>
                <button 
                    onClick={() => setUseRealApi(!useRealApi)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${useRealApi ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${useRealApi ? 'translate-x-7' : 'translate-x-1'}`} />
                </button>
                <span className="text-xs font-bold text-green-600 flex items-center gap-1"><Zap size={12}/> Live Razorpay API</span>
            </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(CAUSE_CONFIG).map(([cause, c]) => (
            <button
              key={cause}
              onClick={() => { setSelectedCause(cause); setResult(null); setActiveStep(0); }}
              disabled={isProcessing}
              className={`p-3 rounded-lg border-2 text-left transition-all text-sm font-medium ${
                selectedCause === cause
                  ? 'border-blue-500 bg-blue-50 text-blue-800'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              <span className="text-xl block mb-1">{c.emoji}</span>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Checkout Panel */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mb-6 text-3xl">
            {cfg.emoji}
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-1">{cfg.product}</h2>
          <p className="text-gray-400 text-sm mb-6">via {cfg.method}</p>
          <div className="w-full bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4 flex justify-between items-center">
            <span className="font-semibold text-gray-700">Total Amount</span>
            <span className="text-xl font-bold text-gray-900">₹{cfg.amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="w-full bg-red-50 p-3 rounded-lg border border-red-200 mb-6 text-sm flex justify-between">
            <span className="text-gray-500">Simulated Failure</span>
            <span className="font-semibold text-red-600">{cfg.label}</span>
          </div>
          <button
            onClick={handlePay}
            disabled={isProcessing || activeStep > 0}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2"
          >
            {isProcessing
              ? <><RefreshCw className="animate-spin" size={18} /> Processing...</>
              : `Pay ₹${cfg.amount.toLocaleString('en-IN')}`}
          </button>
        </div>

        {/* Recovery Timeline Panel */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col min-h-80">
          <h3 className="text-base font-bold text-gray-700 mb-6 border-b pb-3 flex items-center gap-2">
            <ShieldAlert size={18} className="text-blue-600" />
            RecoveryTree AI — Live Interception
          </h3>

          {!result && !isProcessing && (
            <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">
              Click Pay to see AI recovery in action
            </div>
          )}

          {isProcessing && (
            <div className="flex-1 flex items-center justify-center gap-3 text-blue-400">
              <RefreshCw className="animate-spin" size={20} />
              <span className="text-sm font-medium">Gateway processing…</span>
            </div>
          )}

          {result && (
            <div className="space-y-4 flex-1">

              {/* Step 1: Failure */}
              <div className={`flex items-start gap-3 transition-all duration-500 ${activeStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <div className="bg-red-100 p-2 rounded-full mt-0.5 shrink-0">
                  <AlertCircle className="text-red-600" size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-red-600 text-sm">Gateway Error Detected</h4>
                  <p className="text-gray-500 text-xs mt-0.5 font-mono bg-gray-50 p-1.5 rounded border">
                    {result.record.gateway_message}
                  </p>
                </div>
              </div>

              {/* Step 2: Classification */}
              <div className={`flex items-start gap-3 transition-all duration-500 ${activeStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <div className="bg-indigo-100 p-2 rounded-full mt-0.5 shrink-0">
                  <ShieldAlert className="text-indigo-600" size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-600 text-sm">Root Cause Classified</h4>
                  <p className="text-gray-500 text-xs mt-0.5">
                    <span className="font-bold text-indigo-700">{result.logs[0]?.cause}</span>
                    {' '}via{' '}
                    <span className="font-medium">{result.logs[0]?.classified_by === 'rule' ? 'Tier 1 Rules Engine' : 'Tier 2 LLM (Claude)'}</span>
                    {' '}· <span className="text-green-600 font-semibold">Confidence: 100%</span>
                  </p>
                </div>
              </div>

              {/* Step 3: NPCI Pending Reversal (BANK_DOWNTIME only) */}
              {selectedCause === 'BANK_DOWNTIME' && !useRealApi && (
                <div className={`flex items-start gap-3 transition-all duration-500 ${activeStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  <div className="bg-orange-100 p-2 rounded-full mt-0.5 shrink-0">
                    <Clock className="text-orange-600" size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-orange-600 text-sm">NPCI Compliance Hold</h4>
                    <p className="text-gray-500 text-xs mt-0.5">
                      Issuer may have debited customer. Entering{' '}
                      <span className="font-bold">PENDING_REVERSAL</span>{' '}
                      state per NPCI ~30s rule before retry.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Strategy Execution */}
              <div className={`flex items-start gap-3 transition-all duration-500 ${activeStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <div className="bg-blue-100 p-2 rounded-full mt-0.5 shrink-0">
                  {isEscalated ? <UserCheck className="text-blue-600" size={18} /> : <RefreshCw className="text-blue-600" size={18} />}
                </div>
                <div>
                  <h4 className="font-bold text-blue-600 text-sm">
                    {isEscalated ? 'Escalated to Human Review' : 'Recovery Strategy Executing'}
                  </h4>
                  <p className="text-gray-500 text-xs mt-0.5 font-mono bg-gray-50 p-1.5 rounded border">
                    {result.logs.find((l: any) => l.attempt_number >= 1)?.action || result.logs.slice(-1)[0]?.action}
                  </p>
                </div>
              </div>

              {/* Step 5: Final Outcome */}
              <div className={`flex items-start gap-3 transition-all duration-500 ${activeStep >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <div className={`p-2 rounded-full mt-0.5 shrink-0 ${isRecovered ? 'bg-green-100' : isEscalated ? 'bg-yellow-100' : 'bg-red-100'}`}>
                  {isRecovered
                    ? <CheckCircle className="text-green-600" size={18} />
                    : isEscalated
                    ? <UserCheck className="text-yellow-600" size={18} />
                    : <XCircle className="text-red-600" size={18} />}
                </div>
                <div className="w-full">
                  <h4 className={`font-bold text-sm ${isRecovered ? 'text-green-600' : isEscalated ? 'text-yellow-600' : 'text-red-600'}`}>
                    {isRecovered
                      ? `₹${cfg.amount.toLocaleString('en-IN')} Revenue Recovered! 🎉`
                      : isEscalated
                      ? 'Flagged for Manual Review (Compliant Stop)'
                      : 'Could Not Recover — Logged for Analysis'}
                  </h4>
                  <p className="text-gray-400 text-xs mt-0.5 mb-2">
                    {isRecovered
                      ? 'Customer experience preserved. Merchant revenue saved.'
                      : isEscalated
                      ? 'High-risk transaction safely escalated per compliance rules.'
                      : 'Max retries reached. No unsafe actions taken.'}
                  </p>
                  
                  {result.real_link && isRecovered && (
                      <div className="flex flex-col gap-2 mt-2">
                        <a href={result.real_link} target="_blank" rel="noreferrer" className="inline-block bg-[#02042b] hover:bg-blue-900 text-white text-xs font-bold py-2 px-4 rounded-md shadow-md transition-all w-full text-center">
                            Complete Payment on Razorpay Secure
                        </a>
                        <a href={`https://wa.me/?text=${encodeURIComponent(`Hi! Your recent payment of Rs ${cfg.amount} failed due to ${cfg.label}. Please complete it here: ${result.real_link}`)}`} target="_blank" rel="noreferrer" className="inline-block bg-[#25D366] hover:bg-[#128C7E] text-white text-xs font-bold py-2 px-4 rounded-md shadow-md transition-all w-full text-center flex items-center justify-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                            Share via WhatsApp
                        </a>
                      </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {activeStep >= 5 && (
            <button
              onClick={() => { setResult(null); setActiveStep(0); }}
              className="mt-6 text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1 self-center"
            >
              Try another scenario <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
