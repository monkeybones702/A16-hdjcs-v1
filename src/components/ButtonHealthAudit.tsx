import React, { useState } from 'react';
import { ButtonAuditItem } from '../types/midi';
import { CheckCircle2, AlertCircle, RotateCcw, Download, Sparkles, Filter } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ButtonHealthAuditProps {
  auditItems: ButtonAuditItem[];
  onResetAudit: () => void;
}

export const ButtonHealthAudit: React.FC<ButtonHealthAuditProps> = ({
  auditItems,
  onResetAudit,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const total = auditItems.length;
  const passed = auditItems.filter((i) => i.tested).length;
  const percentage = Math.round((passed / total) * 100);

  // Trigger confetti if 100% reached
  React.useEffect(() => {
    if (passed === total && total > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [passed, total]);

  const filteredItems =
    filterCategory === 'All'
      ? auditItems
      : auditItems.filter((i) => i.category === filterCategory);

  const handleExportReport = () => {
    const report = {
      device: 'Hercules DJControl Starlight',
      timestamp: new Date().toISOString(),
      testedCount: passed,
      totalCount: total,
      healthScore: `${percentage}%`,
      items: auditItems.map((item) => ({
        id: item.id,
        name: item.name,
        deck: item.deck,
        category: item.category,
        tested: item.tested,
        pressCount: item.pressCount,
        lastVelocity: item.lastVelocity ?? null,
        lastLatencyMs: item.lastLatencyMs ?? null,
        lastPressTime: item.lastPressTime ? new Date(item.lastPressTime).toISOString() : null,
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `starlight-diagnostic-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 px-2 sm:px-4 py-4">
      {/* Overview Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Hardware Button Health &amp; Input Audit</h2>
              {percentage === 100 && (
                <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-2 py-0.5 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" /> 100% Complete!
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Press every button, move every fader, and rotate jog wheels on your physical Starlight to test switch continuity and responsiveness.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportReport}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export Report</span>
            </button>

            <button
              onClick={onResetAudit}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center text-xs font-mono mb-1.5">
            <span className="text-slate-400">
              Verified: <strong className="text-white">{passed}</strong> / {total} Controls
            </span>
            <span
              className={`font-bold ${
                percentage === 100 ? 'text-emerald-400' : percentage > 50 ? 'text-cyan-400' : 'text-amber-400'
              }`}
            >
              {percentage}%
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                percentage === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 mt-4 overflow-x-auto scrollbar-none pb-1">
          <Filter className="w-3.5 h-3.5 text-slate-500 mr-1" />
          {['All', 'Transport', 'Pad', 'Fader/Knob', 'Jog', 'Special'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
                filterCategory === cat
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Audit Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className={`p-3.5 rounded-xl border transition-all flex items-start justify-between ${
              item.tested
                ? 'bg-emerald-950/20 border-emerald-700/50 shadow-sm'
                : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                    item.deck === 'A'
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                      : item.deck === 'B'
                      ? 'bg-purple-950 text-purple-400 border border-purple-800/60'
                      : 'bg-amber-950 text-amber-400 border border-amber-800/60'
                  }`}
                >
                  Deck {item.deck}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{item.category}</span>
              </div>

              <h4 className="text-xs font-bold text-white tracking-tight">{item.name}</h4>

              <div className="text-[11px] font-mono text-slate-400 space-x-2">
                <span>
                  Presses: <strong className="text-slate-200">{item.pressCount}</strong>
                </span>
                {item.lastVelocity !== undefined && (
                  <span>
                    Val: <strong className="text-cyan-400">{item.lastVelocity}</strong>
                  </span>
                )}
                {item.lastLatencyMs !== undefined && (
                  <span>
                    Lat: <strong className="text-amber-400">{item.lastLatencyMs}ms</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="mt-1">
              {item.tested ? (
                <div className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5 fill-emerald-950" />
                  <span className="text-[10px] font-bold font-mono">PASSED</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-slate-600">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-[10px] font-mono">UNTESTED</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
