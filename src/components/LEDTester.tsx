import React, { useState } from 'react';
import { midiService } from '../services/midiService';
import { LEDState, PadMode } from '../types/midi';
import { Sparkles, Zap, Sun, Moon, Play, Square, RefreshCcw, Send, Check } from 'lucide-react';

interface LEDTesterProps {
  leds: LEDState;
  onRefreshLEDs: () => void;
}

export const LEDTester: React.FC<LEDTesterProps> = ({ leds, onRefreshLEDs }) => {
  const [activeShow, setActiveShow] = useState<string | null>(null);
  const [linkUnderglow, setLinkUnderglow] = useState(true);

  // Custom Hex Sender state
  const [hexStatus, setHexStatus] = useState('91');
  const [hexData1, setHexData1] = useState('07');
  const [hexData2, setHexData2] = useState('7F');
  const [hexSentSuccess, setHexSentSuccess] = useState(false);

  const triggerShow = (name: string, fn: () => void) => {
    setActiveShow(name);
    fn();
    onRefreshLEDs();
  };

  const stopShows = () => {
    setActiveShow(null);
    midiService.stopActiveLightShow();
    onRefreshLEDs();
  };

  const handleUnderglowChange = (deck: 'A' | 'B', val: number) => {
    midiService.setBaseUnderglow(deck, val);
    if (linkUnderglow) {
      midiService.setBaseUnderglow(deck === 'A' ? 'B' : 'A', val);
    }
    onRefreshLEDs();
  };

  const handleSendCustomHex = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const s = parseInt(hexStatus, 16);
    const d1 = parseInt(hexData1, 16);
    const d2 = parseInt(hexData2, 16);
    if (isNaN(s) || isNaN(d1) || isNaN(d2)) return;

    midiService.sendShortMsg(s, d1, d2);
    setHexSentSuccess(true);
    setTimeout(() => setHexSentSuccess(false), 1500);
    onRefreshLEDs();
  };

  const applyPreset = (s: string, d1: string, d2: string) => {
    setHexStatus(s);
    setHexData1(d1);
    setHexData2(d2);
    const st = parseInt(s, 16);
    const b1 = parseInt(d1, 16);
    const b2 = parseInt(d2, 16);
    midiService.sendShortMsg(st, b1, b2);
    setHexSentSuccess(true);
    setTimeout(() => setHexSentSuccess(false), 1500);
    onRefreshLEDs();
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 px-2 sm:px-4 py-4">
      {/* Intro & Quick Light Shows Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-cyan-950/60 border border-purple-800/40 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              Hercules Starlight LED Light &amp; Underglow Testing
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Send real-time MIDI lighting signals to the physical LEDs and underglow acrylic base of your Starlight controller.
            </p>
          </div>

          {activeShow && (
            <div className="flex items-center gap-2 bg-purple-900/50 border border-purple-600/60 px-3 py-1.5 rounded-xl self-start sm:self-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-ping" />
              <span className="text-xs font-mono font-bold text-purple-200">
                Playing: {activeShow}
              </span>
              <button
                onClick={stopShows}
                className="ml-2 px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-[10px] text-white font-bold"
              >
                STOP
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <button
            onClick={() => triggerShow('All LEDs ON', () => midiService.testAllLEDs(true))}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all shadow-sm"
          >
            <Sun className="w-4 h-4" />
            <span>ALL ON</span>
          </button>

          <button
            onClick={() => triggerShow('All LEDs OFF', () => midiService.testAllLEDs(false))}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all"
          >
            <Moon className="w-4 h-4" />
            <span>ALL OFF</span>
          </button>

          <button
            onClick={() => triggerShow('Knight Rider Chaser', () => midiService.startKnightRiderShow())}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              activeShow === 'Knight Rider Chaser'
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/40'
                : 'bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 border-purple-700/50'
            }`}
          >
            <Zap className="w-4 h-4 text-purple-400" />
            <span>CHASER</span>
          </button>

          <button
            onClick={() => triggerShow('Audio VU Wave', () => midiService.startVUWaveShow())}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              activeShow === 'Audio VU Wave'
                ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/40'
                : 'bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-300 border-indigo-700/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>VU WAVE</span>
          </button>

          <button
            onClick={() => triggerShow('Strobe Test', () => midiService.startStrobeShow())}
            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all ${
              activeShow === 'Strobe Test'
                ? 'bg-amber-600 text-white border-amber-400 shadow-lg shadow-amber-600/40'
                : 'bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 border-amber-700/50'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>STROBE</span>
          </button>

          <button
            onClick={stopShows}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-rose-400 border border-rose-900/60 text-xs font-bold transition-all"
          >
            <Square className="w-4 h-4" />
            <span>STOP</span>
          </button>
        </div>
      </div>

      {/* 2 Grid Columns: Direct LED Switches & Base Underglow Control */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Direct LED Click Toggles (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-5">
          <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
            <span>Direct Hardware LED Toggles</span>
            <span className="text-xs font-mono text-slate-400 font-normal">Click to toggle physical light</span>
          </h3>

          {/* Deck A LEDs */}
          <div>
            <span className="text-xs font-bold text-cyan-400 font-mono block mb-2">
              DECK A (CHANNEL 1 / 0x91)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => {
                  const next = !leds.deckAPlay;
                  midiService.setButtonLED('A', 'play', next);
                  onRefreshLEDs();
                }}
                className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all ${
                  leds.deckAPlay
                    ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 shadow-md shadow-emerald-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>PLAY LED</span>
                <span className="text-[10px] text-slate-400">0x91 0x07</span>
              </button>

              <button
                onClick={() => {
                  const next = !leds.deckACue;
                  midiService.setButtonLED('A', 'cue', next);
                  onRefreshLEDs();
                }}
                className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all ${
                  leds.deckACue
                    ? 'bg-amber-500/30 text-amber-300 border-amber-400 shadow-md shadow-amber-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>CUE LED</span>
                <span className="text-[10px] text-slate-400">0x91 0x06</span>
              </button>

              <button
                onClick={() => {
                  const next = !leds.deckASync;
                  midiService.setButtonLED('A', 'sync', next);
                  onRefreshLEDs();
                }}
                className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all ${
                  leds.deckASync
                    ? 'bg-blue-500/30 text-blue-300 border-blue-400 shadow-md shadow-blue-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>SYNC LED</span>
                <span className="text-[10px] text-slate-400">0x91 0x05</span>
              </button>

              <button
                onClick={() => {
                  const next = !leds.deckAPfl;
                  midiService.setButtonLED('A', 'pfl', next);
                  onRefreshLEDs();
                }}
                className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all ${
                  leds.deckAPfl
                    ? 'bg-cyan-500/30 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>PFL (CUE)</span>
                <span className="text-[10px] text-slate-400">0x91 0x0C</span>
              </button>
            </div>

            {/* Deck A Pads LEDs */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const next = !leds.deckAPads[idx];
                    midiService.setPadLED('A', 'hotcue', idx, next);
                    onRefreshLEDs();
                  }}
                  className={`py-2 rounded-lg border text-[11px] font-mono font-bold transition-all ${
                    leds.deckAPads[idx]
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-md shadow-cyan-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  PAD {idx + 1} LED
                </button>
              ))}
            </div>
          </div>

          {/* Deck B LEDs */}
          <div className="pt-3 border-t border-slate-800">
            <span className="text-xs font-bold text-purple-400 font-mono block mb-2">
              DECK B (CHANNEL 2 / 0x92)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                onClick={() => {
                  const next = !leds.deckBPlay;
                  midiService.setButtonLED('B', 'play', next);
                  onRefreshLEDs();
                }}
                className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all ${
                  leds.deckBPlay
                    ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400 shadow-md shadow-emerald-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>PLAY LED</span>
                <span className="text-[10px] text-slate-400">0x92 0x07</span>
              </button>

              <button
                onClick={() => {
                  const next = !leds.deckBCue;
                  midiService.setButtonLED('B', 'cue', next);
                  onRefreshLEDs();
                }}
                className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all ${
                  leds.deckBCue
                    ? 'bg-amber-500/30 text-amber-300 border-amber-400 shadow-md shadow-amber-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>CUE LED</span>
                <span className="text-[10px] text-slate-400">0x92 0x06</span>
              </button>

              <button
                onClick={() => {
                  const next = !leds.deckBSync;
                  midiService.setButtonLED('B', 'sync', next);
                  onRefreshLEDs();
                }}
                className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all ${
                  leds.deckBSync
                    ? 'bg-blue-500/30 text-blue-300 border-blue-400 shadow-md shadow-blue-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>SYNC LED</span>
                <span className="text-[10px] text-slate-400">0x92 0x05</span>
              </button>

              <button
                onClick={() => {
                  const next = !leds.deckBPfl;
                  midiService.setButtonLED('B', 'pfl', next);
                  onRefreshLEDs();
                }}
                className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex flex-col items-center gap-1 transition-all ${
                  leds.deckBPfl
                    ? 'bg-purple-500/30 text-purple-300 border-purple-400 shadow-md shadow-purple-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>PFL (CUE)</span>
                <span className="text-[10px] text-slate-400">0x92 0x0C</span>
              </button>
            </div>

            {/* Deck B Pads LEDs */}
            <div className="grid grid-cols-4 gap-2 mt-2">
              {[0, 1, 2, 3].map((idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const next = !leds.deckBPads[idx];
                    midiService.setPadLED('B', 'hotcue', idx, next);
                    onRefreshLEDs();
                  }}
                  className={`py-2 rounded-lg border text-[11px] font-mono font-bold transition-all ${
                    leds.deckBPads[idx]
                      ? 'bg-purple-500 text-slate-950 border-purple-300 shadow-md shadow-purple-500/40'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  PAD {idx + 1} LED
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Base Acrylic Underglow & Custom Hex Sender (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Base Acrylic Underglow */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                Base Underglow Acrylic Strip
              </h3>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkUnderglow}
                  onChange={(e) => setLinkUnderglow(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Link L/R</span>
              </label>
            </div>

            {/* Left Level Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-cyan-400">Left Underglow Level (0x91 0x23)</span>
                <span className="font-bold text-white">{leds.baseLeftLevel} / 127</span>
              </div>
              <input
                type="range"
                min="0"
                max="127"
                value={leds.baseLeftLevel}
                onChange={(e) => handleUnderglowChange('A', Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Right Level Slider */}
            <div>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-purple-400">Right Underglow Level (0x92 0x23)</span>
                <span className="font-bold text-white">{leds.baseRightLevel} / 127</span>
              </div>
              <input
                type="range"
                min="0"
                max="127"
                value={leds.baseRightLevel}
                onChange={(e) => handleUnderglowChange('B', Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Firmware Mode Switch */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-300 block">Firmware Auto Light Show</span>
                <span className="text-[10px] text-slate-500 font-mono">0x90 0x24 (0=Manual / 127=Auto)</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    midiService.setBaseAutoMode(false);
                    onRefreshLEDs();
                  }}
                  className="px-2.5 py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Manual Mode
                </button>
                <button
                  onClick={() => {
                    midiService.setBaseAutoMode(true);
                    onRefreshLEDs();
                  }}
                  className="px-2.5 py-1 text-xs rounded bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/40 font-medium"
                >
                  Serato Auto
                </button>
              </div>
            </div>
          </div>

          {/* Custom Hex MIDI Packet Sender */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-2">
              <span>Raw Hex Packet Injector</span>
              {hexSentSuccess && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-pulse">
                  <Check className="w-3.5 h-3.5" /> Sent!
                </span>
              )}
            </h3>

            {/* Input Bytes */}
            <form onSubmit={handleSendCustomHex} className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Status (Hex)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={hexStatus}
                  onChange={(e) => setHexStatus(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center font-mono text-xs text-cyan-400 font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex-1">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Data 1 (Hex)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={hexData1}
                  onChange={(e) => setHexData1(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center font-mono text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex-1">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Data 2 (Hex)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={hexData2}
                  onChange={(e) => setHexData2(e.target.value.toUpperCase())}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-center font-mono text-xs text-purple-400 font-bold focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </form>

            {/* Quick Presets */}
            <div>
              <span className="text-[11px] font-mono text-slate-400 block mb-1.5">
                Quick Hercules Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset('91', '07', '7F')}
                  className="text-[10px] font-mono px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
                >
                  91 07 7F (Play A)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('91', '06', '7F')}
                  className="text-[10px] font-mono px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
                >
                  91 06 7F (Cue A)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('91', '23', '7F')}
                  className="text-[10px] font-mono px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
                >
                  91 23 7F (Base A Max)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('90', '24', '00')}
                  className="text-[10px] font-mono px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
                >
                  90 24 00 (Disable Auto)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('B0', '7F', '7F')}
                  className="text-[10px] font-mono px-2 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded border border-slate-800"
                >
                  B0 7F 7F (Query Knobs)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
