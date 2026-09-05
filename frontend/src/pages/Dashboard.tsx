import React, { useState, useEffect } from 'react';
import { generateBatch, runBatch, getSummary, getAuditLog, getDecisionTree } from '../api';
import type { MetricsSummary, AuditLogEntry, PaymentRecord } from '../types';
import SummaryKPIs from '../components/SummaryKPIs';
import DecisionTree from '../components/DecisionTree';
import RecoveredChart from '../components/RecoveredChart';
import RateTable from '../components/RateTable';
import AuditLog from '../components/AuditLog';
import ROIProjector from '../components/ROIProjector';
import FailureTimelineChart from '../components/FailureTimelineChart';
import AIRuleCompiler from '../components/AIRuleCompiler';
import { RefreshCw, Play, ShieldAlert, Zap, TrendingUp, BarChart2 } from 'lucide-react';

export default function Dashboard() {
  const [step, setStep] = useState<'idle' | 'generated' | 'running' | 'done'>('idle');
  const [batch, setBatch] = useState<PaymentRecord[]>([]);
  const [metrics, setMetrics] = useState<MetricsSummary | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [treeDef, setTreeDef] = useState<string>('');
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    setStep('running');
    setMetrics(null);
    setLogs([]);
    try {
      const res = await generateBatch();
      setBatch(res.data);
      setStep('generated');
    } catch (e) {
      console.error(e);
      setStep('idle');
    }
  };

  const handleRun = async () => {
    setStep('running');
    setProgress(0);
    // Animate progress bar
    const interval = setInterval(() => setProgress(p => Math.min(p + 8, 90)), 200);
    try {
      await runBatch();
      const [sumRes, logRes, treeRes] = await Promise.all([
        getSummary(), getAuditLog(), getDecisionTree()
      ]);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setMetrics(sumRes);
        setLogs(logRes.logs);
        setTreeDef(treeRes.mermaid);
        setStep('done');
      }, 400);
    } catch (e) {
      clearInterval(interval);
      console.error(e);
      setStep('generated');
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Razorpay-style top header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-gray-900 leading-none">RecoveryTree</h1>
              <p className="text-xs text-gray-400 mt-0.5">AI Revenue Recovery · Razorpay Buildathon 2025</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-200 font-medium">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              System Live
            </div>
            <button
              onClick={handleGenerate}
              disabled={step === 'running'}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={14} className={step === 'running' ? 'animate-spin' : ''} />
              New Batch
            </button>
            <button
              onClick={handleRun}
              disabled={step !== 'generated'}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Play size={14} />
              Run AI Pipeline
            </button>
          </div>
        </div>
        {/* Progress Bar */}
        {step === 'running' && (
          <div className="h-0.5 bg-gray-100 w-full">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 rounded-xl mb-8 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <ShieldAlert size={20} className="text-blue-200 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Simulated on a synthetic batch of 80 failed payments</p>
              <p className="text-blue-200 text-xs mt-0.5">Calibrated to NPCI BD/TD ratio · Razorpay test-mode API ready</p>
            </div>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-xs text-blue-200">Track 3 — AI Revenue Recovery</p>
            <p className="text-xs text-blue-300 font-semibold mt-0.5">Razorpay AI Buildathon 2025</p>
          </div>
        </div>

        {/* NLP Rule Compiler (The Wow Factor) */}
        {step === 'idle' && (
          <AIRuleCompiler />
        )}

        {/* Idle state */}
        {step === 'idle' && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <BarChart2 size={32} className="text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to Recover Revenue</h2>
            <p className="text-gray-500 max-w-sm mb-6">Generate a realistic batch of failed payments, then let the AI pipeline classify, strategize, and recover.</p>
            <button onClick={handleGenerate} className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2">
              <RefreshCw size={16} />
              Generate Batch & Start
            </button>
          </div>
        )}

        {/* Generated, not run */}
        {step === 'generated' && (
          <div className="bg-white border border-blue-200 rounded-xl p-6 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{batch.length} failed payment records generated</p>
                <p className="text-sm text-gray-500">NPCI-calibrated distribution · Indian identities · Log-normal amounts</p>
              </div>
            </div>
            <button onClick={handleRun} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center gap-2">
              <Play size={16} />
              Run AI Pipeline
            </button>
          </div>
        )}

        {/* Running state */}
        {step === 'running' && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative mb-6">
              <div className="w-16 h-16 border-4 border-blue-100 rounded-full" />
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">AI Pipeline Running…</h3>
            <p className="text-gray-500 text-sm">Classifying failures · Applying strategies · Computing recovery</p>
            <div className="mt-6 w-64 bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">{progress}% complete</p>
          </div>
        )}

        {/* Results */}
        {step === 'done' && metrics && (
          <div className="space-y-8">
            <SummaryKPIs metrics={metrics} />
            <ROIProjector metrics={metrics} />
            <FailureTimelineChart batch={batch} />
            <DecisionTree chartDefinition={treeDef} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <RecoveredChart logs={logs} batch={batch} />
              <RateTable logs={logs} batch={batch} />
            </div>
            <AuditLog logs={logs} />
          </div>
        )}
      </div>
    </div>
  );
}
