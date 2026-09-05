import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import LiveDemo from './components/LiveDemo';
import { Zap, PlayCircle, BarChart2 } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'batch' | 'demo'>('batch');

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Top-level Brand Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-md flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">RecoveryTree</span>
            <span className="text-gray-300 text-sm">·</span>
            <span className="text-xs text-gray-400">Razorpay AI Buildathon 2025</span>
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'batch'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BarChart2 size={15} />
              Batch Analytics
            </button>
            <button
              onClick={() => setActiveTab('demo')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'demo'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <PlayCircle size={15} />
              Live Demo
              <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">NEW</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Page Content */}
      {activeTab === 'batch'
        ? <Dashboard />
        : (
          <div className="max-w-7xl mx-auto px-6 py-8">
            {/* Demo page header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Interactive Payment Recovery Demo</h2>
              <p className="text-sm text-gray-500 mt-1">
                Select any failure scenario. Watch the AI classify, comply, and recover revenue in real time.
              </p>
            </div>
            <LiveDemo />
          </div>
        )}
    </div>
  );
}

export default App;
