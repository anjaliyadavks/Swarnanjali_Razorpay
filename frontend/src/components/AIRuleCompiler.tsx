import React, { useState, useEffect } from 'react';
import { Terminal, Wand2, ArrowRight, Code2, ShieldCheck, Zap, RefreshCw } from 'lucide-react';

const SUGGESTIONS = [
  "If an international card fails due to 3D Secure, send a Payment Link via WhatsApp immediately.",
  "When SBI Netbanking is down, wait 15 minutes. If it's still down, downgrade to UPI intent.",
  "Never retry high-risk transactions over ₹50,000. Escalate to human review instantly."
];

export default function AIRuleCompiler() {
  const [prompt, setPrompt] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledCode, setCompiledCode] = useState("");
  const [step, setStep] = useState(0);

  const handleCompile = () => {
    if (!prompt) return;
    setIsCompiling(true);
    setCompiledCode("");
    setStep(0);

    // Simulate compilation steps
    setTimeout(() => setStep(1), 600); // Parsing AST
    setTimeout(() => setStep(2), 1500); // Validating against Razorpay Compliance
    setTimeout(() => {
      setStep(3);
      generateCode(prompt);
      setIsCompiling(false);
    }, 2800);
  };

  const generateCode = (text: string) => {
    const isSbi = text.toLowerCase().includes("sbi");
    const isRisk = text.toLowerCase().includes("risk");
    
    let code = "";
    if (isSbi) {
      code = `@recovery_rule(priority=1, tags=['netbanking', 'downtime'])
def handle_sbi_downtime(tx: Transaction, ctx: Context) -> Action:
    if tx.method == PaymentMethod.NETBANKING and tx.bank == Bank.SBI:
        if tx.error == ErrorCode.BANK_DOWNTIME:
            ctx.delay_queue.push(tx.id, delay_minutes=15)
            return Action.RETRY_LATER
        elif ctx.get_elapsed_time(tx) > timedelta(minutes=15):
            return Action.DOWNGRADE_ROUTING(method=PaymentMethod.UPI)
    return Action.PASS`;
    } else if (isRisk) {
      code = `@recovery_rule(priority=99, tags=['compliance', 'risk'])
def block_high_risk_large_tx(tx: Transaction, ctx: Context) -> Action:
    if tx.amount > 50000 and tx.risk_score > 0.8:
        ctx.audit_log.flag(tx.id, reason="High Risk > 50k")
        return Action.ESCALATE_TO_HUMAN
    return Action.PASS`;
    } else {
      code = `@recovery_rule(priority=10, tags=['international', '3ds'])
def international_3ds_fallback(tx: Transaction, ctx: Context) -> Action:
    if tx.card.type == CardType.INTERNATIONAL and tx.error == ErrorCode.AUTH_FAILED_3DS:
        link = razorpay_client.payment_links.create({
            "amount": tx.amount,
            "currency": tx.currency,
            "description": "Secure 3DS Fallback Link"
        })
        whatsapp_client.send_template(tx.customer.phone, link.short_url)
        return Action.RECOVERED_VIA_LINK
    return Action.PASS`;
    }
    setCompiledCode(code);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
      <div className="bg-[#0f172a] p-4 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Wand2 className="text-purple-400" size={20} />
          <h2 className="text-white font-bold text-lg tracking-wide">Razorpay Zero-Code Rule Compiler</h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full border border-purple-500/30">
          <Zap size={12} />
          LLM-Powered
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* Left: Input Pane */}
        <div className="p-6 border-r border-gray-100 bg-gray-50 flex flex-col">
          <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
            Describe your recovery policy
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. If a payment fails on an HDFC credit card for over ₹10,000, don't retry, just send a Payment Link..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg shadow-inner focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none text-sm font-medium text-gray-800"
          />
          
          <div className="mt-4 flex-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Try these examples</p>
            <div className="space-y-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(s)}
                  className="block w-full text-left text-xs text-gray-600 bg-white border border-gray-200 p-2 rounded hover:bg-purple-50 hover:border-purple-200 hover:text-purple-700 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCompile}
            disabled={isCompiling || !prompt}
            className="mt-6 w-full bg-[#0f172a] hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            {isCompiling ? <RefreshCw className="animate-spin" size={18} /> : <Code2 size={18} />}
            {isCompiling ? 'Compiling to Python...' : 'Generate Executable Rule'}
          </button>
        </div>

        {/* Right: Output/Terminal Pane */}
        <div className="bg-[#1e1e1e] p-6 font-mono text-sm flex flex-col min-h-[400px]">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-700">
            <Terminal size={16} className="text-gray-400" />
            <span className="text-gray-400 font-semibold text-xs tracking-wider">OUTPUT_CONSOLE</span>
          </div>

          {!isCompiling && !compiledCode && (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3">
              <Code2 size={48} className="opacity-20" />
              <p>Rule AST will be rendered here</p>
            </div>
          )}

          {isCompiling && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-blue-400">
                <ArrowRight size={14} />
                <span className="typing-effect">Parsing Natural Language via Claude-3.5...</span>
              </div>
              {step >= 1 && (
                <div className="flex items-center gap-2 text-purple-400 animate-fade-in">
                  <ArrowRight size={14} />
                  <span>Abstract Syntax Tree (AST) constructed.</span>
                </div>
              )}
              {step >= 2 && (
                <div className="flex items-center gap-2 text-yellow-400 animate-fade-in">
                  <ShieldCheck size={14} />
                  <span>Validating against Razorpay & NPCI Compliance Engine... PASS.</span>
                </div>
              )}
            </div>
          )}

          {compiledCode && !isCompiling && (
            <div className="animate-fade-in flex-1 flex flex-col">
              <div className="mb-2 text-green-400 flex items-center gap-2 text-xs">
                <ShieldCheck size={14} />
                Rule Compiled & Deployed Successfully
              </div>
              <div className="bg-[#2d2d2d] rounded p-4 flex-1 overflow-auto border border-gray-700 shadow-inner">
                <pre className="text-gray-300 whitespace-pre-wrap font-mono text-xs leading-relaxed">
                  <code className="language-python">
                    {compiledCode.split('\n').map((line, i) => {
                      if (line.startsWith('@')) return <span key={i} className="text-yellow-300">{line}{'\n'}</span>;
                      if (line.includes('def ')) return <span key={i} className="text-blue-400">{line}{'\n'}</span>;
                      if (line.includes('return ')) return <span key={i} className="text-pink-400">{line}{'\n'}</span>;
                      if (line.includes('if ') || line.includes('elif ')) return <span key={i} className="text-purple-400">{line}{'\n'}</span>;
                      return <span key={i}>{line}{'\n'}</span>;
                    })}
                  </code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Need to add RefreshCw to imports if missing, but wait, I can just use a local spinner SVG or import it.
