import React, { useState } from 'react';
import type { MetricsSummary } from '../types';
import { DollarSign, Activity, TrendingUp, Bot, Users, Zap } from 'lucide-react';

interface Props {
  metrics: MetricsSummary;
}

const formatINR = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function SummaryKPIs({ metrics }: Props) {
  const recoveryPct = metrics.overall_recovery_rate.toFixed(1);
  const aiLift = metrics.ai_lift_percentage;
  const roiMultiple = metrics.llm_api_cost_inr > 0
    ? (metrics.total_recovered / metrics.llm_api_cost_inr).toFixed(0)
    : '∞';

  return (
    <div className="space-y-4">
      {/* Primary KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Revenue At Risk</span>
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <DollarSign size={16} className="text-red-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-gray-900">{formatINR(metrics.total_at_risk)}</p>
          <p className="text-xs text-gray-400 mt-1">{Math.round(metrics.total_at_risk / 80).toLocaleString()} avg per payment</p>
        </div>

        <div className="bg-white rounded-xl border border-green-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-green-600 uppercase tracking-wider">AI Recovered</span>
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={16} className="text-green-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-green-700">{formatINR(metrics.total_recovered)}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${recoveryPct}%` }} />
            </div>
            <span className="text-xs font-semibold text-green-600">{recoveryPct}%</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-indigo-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">AI vs Baseline Lift</span>
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-indigo-500" />
            </div>
          </div>
          <p className="text-3xl font-bold text-indigo-700">+{aiLift.toFixed(0)}%</p>
          <p className="text-xs text-gray-400 mt-1">vs {formatINR(metrics.baseline_recovered)} dumb retry baseline</p>
        </div>
      </div>

      {/* Secondary KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Rules (Tier 1)</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{metrics.rule_classified_count}</p>
          <p className="text-xs text-gray-400">payments classified</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Bot size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">LLM (Tier 2)</span>
          </div>
          <p className="text-2xl font-bold text-gray-800">{metrics.llm_classified_count}</p>
          <p className="text-xs text-gray-400">ambiguous texts</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-gray-400" />
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Human Review</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{metrics.human_review_routed_count}</p>
          <p className="text-xs text-gray-400">safely escalated</p>
        </div>

        <div className="bg-white rounded-xl border border-yellow-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Zap size={14} className="text-yellow-500" />
            <span className="text-xs font-medium text-yellow-600 uppercase tracking-wider">ROI Multiple</span>
          </div>
          <p className="text-2xl font-bold text-yellow-700">{roiMultiple}x</p>
          <p className="text-xs text-gray-400">{formatINR(metrics.llm_api_cost_inr)} AI cost</p>
        </div>
      </div>
    </div>
  );
}
