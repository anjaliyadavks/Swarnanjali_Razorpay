import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function ExceptionsPanel() {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <div className="flex items-center mb-4 text-gray-800">
        <AlertCircle size={20} className="mr-2 text-orange-500" />
        <h2 className="text-lg font-bold">Honest Exceptions & Constraints</h2>
      </div>
      
      <div className="space-y-4 text-sm text-gray-600">
        <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
          <h3 className="font-semibold text-orange-800 mb-1">RISK_BLOCK</h3>
          <p>0% auto-recovery by design. These are compliance-gated events. The system forces a hard stop and routes these directly to the human review queue.</p>
        </div>
        
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-800 mb-1">CARD_EXPIRED & LIMIT_EXCEEDED</h3>
          <p>Cannot be recovered with an automatic blind-retry of the same payment method. The strategy dictates sending a notification/prompt to update the method (simulated logic).</p>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-1">LLM Fallback Ambiguity</h3>
          <p>When the gateway message is too ambiguous (Confidence &lt; 0.7), the system will intentionally abort auto-recovery and escalate to human review to prevent erroneous retries.</p>
        </div>
      </div>
    </div>
  );
}
