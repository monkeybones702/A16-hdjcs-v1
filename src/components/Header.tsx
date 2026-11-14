import React from 'react';
import { Disc3, Usb, Smartphone, Download, HelpCircle, RefreshCw, Terminal, Sliders } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
  deviceName: string;
  isVirtualMode: boolean;
  onToggleVirtualMode: () => void;
  onRescan: () => void;
  onOpenOTGGuide: () => void;
  onOpenAPKModal: () => void;
  availableInputs: { id: string; name: string }[];
  availableOutputs: { id: string; name: string }[];
  onSelectPort: (inputId?: string, outputId?: string) => void;
  activeTab: 'visualizer' | 'led_tester' | 'audit' | 'midi_log';
  setActiveTab: (tab: 'visualizer' | 'led_tester' | 'audit' | 'midi_log') => void;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  deviceName,
  isVirtualMode,
  onToggleVirtualMode,
  onRescan,
  onOpenOTGGuide,
  onOpenAPKModal,
  availableInputs,
  onSelectPort,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Branding & Device Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-600 to-purple-600 shadow-lg shadow-cyan-500/20">
              <Disc3 className="w-6 h-6 text-white animate-spin [animation-duration:8s]" />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-2">
                  Starlight DJ Tool
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                    DJControl Starlight
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span>Linux &amp; Samsung A16 (OTG USB)</span>
                <span className="inline-block w-1 h-1 rounded-full bg-slate-600"></span>
                <a
                  href="https://github.com/monkeybones702/Samsung-starlight-djtool/tree/main"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 underline font-mono text-[11px]"
                >
                  GitHub repo
                </a>
              </p>
            </div>
          </div>

          {/* Quick mobile action */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenAPKModal}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white flex items-center gap-1.5 shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>APK</span>
            </button>
          </div>
        </div>

        {/* Center: Navigation Tabs */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 self-stretch sm:self-auto overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('visualizer')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'visualizer'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Hardware View</span>
          </button>
          <button
            onClick={() => setActiveTab('led_tester')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'led_tester'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Disc3 className="w-3.5 h-3.5" />
            <span>LED Light Shows</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Button Health Audit</span>
          </button>
          <button
            onClick={() => setActiveTab('midi_log')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'midi_log'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>MIDI Event Log</span>
          </button>
        </div>

        {/* Right: Connection & Tools */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Connection status badge */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
              isConnected
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300'
                : isVirtualMode
                ? 'bg-amber-950/60 border-amber-700/60 text-amber-300'
                : 'bg-rose-950/60 border-rose-800/60 text-rose-300'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-emerald-400 animate-pulse'
                  : isVirtualMode
                  ? 'bg-amber-400'
                  : 'bg-rose-400'
              }`}
            />
            <span className="truncate max-w-[140px] sm:max-w-[180px]">
              {isConnected ? deviceName : isVirtualMode ? 'Virtual Simulator' : 'No MIDI Device'}
            </span>
          </div>

          {/* Port dropdown if multiple */}
          {availableInputs.length > 1 && (
            <select
              aria-label="Select MIDI Input Port"
              onChange={(e) => onSelectPort(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              {availableInputs.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name}
                </option>
              ))}
            </select>
          )}

          {/* Re-scan button */}
          <button
            onClick={onRescan}
            title="Scan for USB-OTG MIDI devices"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Virtual mode toggle */}
          <button
            onClick={onToggleVirtualMode}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isVirtualMode
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {isVirtualMode ? 'Virtual Mode ON' : 'Simulate'}
          </button>

          {/* Samsung A16 OTG Guide */}
          <button
            onClick={onOpenOTGGuide}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Usb className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Samsung A16 OTG</span>
          </button>

          {/* APK & Shizuku Modal */}
          <button
            onClick={onOpenAPKModal}
            className="hidden md:flex px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white items-center gap-1.5 shadow-md shadow-cyan-900/30 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>APK &amp; Shizuku</span>
          </button>
        </div>
      </div>
    </header>
  );
};
