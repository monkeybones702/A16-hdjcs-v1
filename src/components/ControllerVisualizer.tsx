import React, { useRef, useState, useEffect } from 'react';
import { ControllerState, PadMode, LEDState } from '../types/midi';
import { Disc, Volume2, Headphones, Activity, Zap, Play, Pause, RotateCcw } from 'lucide-react';

interface VisualizerProps {
  state: ControllerState;
  leds: LEDState;
  onSimulateEvent: (status: number, data1: number, data2: number) => void;
  isVirtualMode: boolean;
}

export const ControllerVisualizer: React.FC<VisualizerProps> = ({
  state,
  leds,
  onSimulateEvent,
}) => {
  // Pad mode selections
  const [deckAPadMode, setDeckAPadMode] = useState<PadMode>('hotcue');
  const [deckBPadMode, setDeckBPadMode] = useState<PadMode>('hotcue');

  // Jog wheel rotation visual state
  const [deckARotation, setDeckARotation] = useState(0);
  const [deckBRotation, setDeckBRotation] = useState(0);

  // Sync state changes with visual rotation
  useEffect(() => {
    setDeckARotation(state.deckA.wheelAngle);
  }, [state.deckA.wheelAngle]);

  useEffect(() => {
    setDeckBRotation(state.deckB.wheelAngle);
  }, [state.deckB.wheelAngle]);

  // Jog wheel interactive drag handler
  const handleJogSpin = (deck: 'A' | 'B', delta: number) => {
    if (deck === 'A') {
      setDeckARotation((prev) => (prev + delta * 5) % 360);
      const ccVal = delta > 0 ? 0x01 : 0x7f;
      onSimulateEvent(0xb1, 0x0a, ccVal);
    } else {
      setDeckBRotation((prev) => (prev + delta * 5) % 360);
      const ccVal = delta > 0 ? 0x01 : 0x7f;
      onSimulateEvent(0xb2, 0x0a, ccVal);
    }
  };

  const getPadLabels = (mode: PadMode) => {
    switch (mode) {
      case 'hotcue':
        return ['CUE 1', 'CUE 2', 'CUE 3', 'CUE 4'];
      case 'loop':
        return ['1 BEAT', '2 BEATS', '4 BEATS', '8 BEATS'];
      case 'fx':
        return ['FX 1', 'FX 2', 'FX 3', 'ON/OFF'];
      case 'sampler':
        return ['SMPL 1', 'SMPL 2', 'SMPL 3', 'SMPL 4'];
    }
  };

  const handlePadPress = (deck: 'A' | 'B', mode: PadMode, index: number, down: boolean) => {
    const status = deck === 'A' ? 0x96 : 0x97;
    let offset = 0x00;
    if (mode === 'loop') offset = 0x10;
    else if (mode === 'fx') offset = 0x20;
    else if (mode === 'sampler') offset = 0x30;

    const midino = offset + index;
    const velocity = down ? 0x7f : 0x00;
    onSimulateEvent(status, midino, velocity);
  };

  return (
    <div className="w-full flex flex-col items-center select-none py-2 px-1 sm:px-4">
      {/* Outer DJ Controller Chassis */}
      <div className="w-full max-w-6xl relative rounded-2xl bg-gradient-to-b from-slate-900 via-slate-950 to-neutral-950 border-2 border-slate-700/80 shadow-2xl shadow-cyan-950/40 p-3 sm:p-5 overflow-hidden">
        {/* Hercules Top Logo Strip */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-4 px-2">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm tracking-widest text-slate-300 uppercase font-mono">
              HERCULES
            </span>
            <span className="text-[11px] font-semibold text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded">
              DJCONTROL STARLIGHT
            </span>
          </div>

          {/* Underglow VU Status */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>VU L:</span>
              <span className="text-cyan-400 font-bold">{leds.baseLeftLevel}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <span>VU R:</span>
              <span className="text-purple-400 font-bold">{leds.baseRightLevel}</span>
            </div>
            <div className="text-[11px] text-slate-500 hidden sm:block">
              {state.shift ? (
                <span className="text-amber-400 font-bold bg-amber-950/50 px-2 py-0.5 rounded border border-amber-700/50">
                  SHIFT ACTIVE (ALT MAPPINGS)
                </span>
              ) : (
                'HOLD SHIFT FOR 2ND LAYER'
              )}
            </div>
          </div>
        </div>

        {/* 3 Main Hardware Columns: Deck A | Mixer | Deck B */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* DECK A (COLUMNS 1 to 5) */}
          <div className="lg:col-span-5 bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex flex-col justify-between relative shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500" />
                DECK 1 (A)
              </span>

              {/* Vinyl Mode Button */}
              <button
                onMouseDown={() => onSimulateEvent(0x91, 0x03, 0x7f)}
                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded border transition-all ${
                  leds.deckAVinyl || state.deckA.vinyl
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-md shadow-amber-500/30 ring-1 ring-amber-400/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Vinyl Mode (Status: 0x91 Note: 0x03)"
              >
                VINYL
              </button>
            </div>

            {/* Jog Wheel & Pitch Section */}
            <div className="flex items-center justify-around gap-2 my-2">
              {/* Jog Wheel Platter */}
              <div className="flex flex-col items-center">
                <div
                  onMouseDown={() => onSimulateEvent(0x91, 0x08, 0x7f)}
                  onMouseUp={() => onSimulateEvent(0x91, 0x08, 0x00)}
                  onTouchStart={() => onSimulateEvent(0x91, 0x08, 0x7f)}
                  onTouchEnd={() => onSimulateEvent(0x91, 0x08, 0x00)}
                  className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full relative cursor-grab active:cursor-grabbing flex items-center justify-center border-4 transition-shadow ${
                    state.deckA.wheelTouch
                      ? 'border-cyan-400 shadow-xl shadow-cyan-500/40 ring-4 ring-cyan-500/20'
                      : 'border-slate-700 hover:border-slate-500 shadow-lg'
                  } bg-gradient-to-br from-slate-800 via-neutral-900 to-slate-950`}
                  style={{
                    transform: `rotate(${deckARotation}deg)`,
                    transition: 'transform 0.05s linear',
                  }}
                  title="Touch Jog Wheel (Top = Scratch, Rim = Pitch Bend)"
                >
                  {/* Outer Rim Grooves */}
                  <div className="absolute inset-2 rounded-full border-2 border-dashed border-slate-600/70" />
                  <div className="absolute inset-6 rounded-full border border-slate-700" />

                  {/* Center Metal Platter Cap */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-900 via-slate-800 to-slate-950 border-2 border-cyan-500/50 flex flex-col items-center justify-center shadow-inner">
                    <Disc className="w-6 h-6 text-cyan-400" />
                    <span className="text-[9px] font-mono text-cyan-300 font-bold mt-0.5">
                      {state.deckA.wheelTouch ? 'TOUCH' : 'DECK A'}
                    </span>
                  </div>

                  {/* Scratch Marker Stripe */}
                  <div className="absolute top-1 w-2.5 h-4 bg-cyan-400 rounded-sm shadow-md shadow-cyan-400" />
                </div>

                {/* Jog wheel nudging controls for touch screens / mouse */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleJogSpin('A', -2)}
                    className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700 border border-slate-700"
                    title="Nudge Counter-Clockwise"
                  >
                    ◀ Nudge
                  </button>
                  <span className="text-[10px] font-mono text-slate-400">
                    {Math.round(deckARotation)}°
                  </span>
                  <button
                    onClick={() => handleJogSpin('A', 2)}
                    className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700 border border-slate-700"
                    title="Nudge Clockwise"
                  >
                    Nudge ▶
                  </button>
                </div>
              </div>

              {/* Pitch Fader Slider Deck A */}
              <div className="flex flex-col items-center justify-center h-44 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-400 font-bold mb-1">TEMPO</span>
                <div className="relative h-28 flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="127"
                    value={state.deckA.pitch}
                    onChange={(e) => onSimulateEvent(0xb1, 0x08, Number(e.target.value))}
                    className="h-28 w-6 appearance-none bg-slate-800 rounded-lg cursor-pointer orient-vertical"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                  />
                  {/* Center detent marker */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-cyan-500/60 pointer-events-none" />
                </div>
                <span className="text-[9px] font-mono text-cyan-400 mt-1">
                  {((state.deckA.pitch - 64) * 0.15).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Performance Pads Section Deck A */}
            <div className="mt-2 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
              {/* Pad Mode Tabs */}
              <div className="grid grid-cols-4 gap-1 mb-2">
                {(['hotcue', 'loop', 'fx', 'sampler'] as PadMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDeckAPadMode(mode)}
                    className={`text-[9px] font-bold uppercase py-1 rounded text-center transition-all ${
                      deckAPadMode === mode
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* 4 Rubber Pads */}
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((idx) => {
                  const isPressed = state.deckA.pads[idx];
                  const isLit = leds.deckAPads[idx] || isPressed;
                  const label = getPadLabels(deckAPadMode)[idx];
                  return (
                    <button
                      key={idx}
                      onMouseDown={() => handlePadPress('A', deckAPadMode, idx, true)}
                      onMouseUp={() => handlePadPress('A', deckAPadMode, idx, false)}
                      onTouchStart={() => handlePadPress('A', deckAPadMode, idx, true)}
                      onTouchEnd={() => handlePadPress('A', deckAPadMode, idx, false)}
                      className={`h-14 rounded-lg flex flex-col items-center justify-center p-1 font-mono transition-all transform active:scale-95 border ${
                        isLit
                          ? 'bg-gradient-to-b from-cyan-400 to-blue-600 text-white border-cyan-300 shadow-lg shadow-cyan-500/50 ring-2 ring-cyan-400/40'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                      }`}
                    >
                      <span className="text-[11px] font-black">{idx + 1}</span>
                      <span className="text-[8px] truncate max-w-full font-semibold opacity-90">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transport Buttons: SYNC, CUE, PLAY, PFL */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {/* SYNC */}
              <button
                onMouseDown={() => onSimulateEvent(state.shift ? 0x94 : 0x91, 0x05, 0x7f)}
                onMouseUp={() => onSimulateEvent(state.shift ? 0x94 : 0x91, 0x05, 0x00)}
                className={`h-11 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  leds.deckASync || state.deckA.sync
                    ? 'bg-blue-600/30 text-blue-300 border-blue-400 shadow-md shadow-blue-500/40 ring-1 ring-blue-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
                title="SYNC (0x91 Note: 0x05)"
              >
                <span>SYNC</span>
                {state.shift && <span className="text-[7px] text-amber-300">MASTER</span>}
              </button>

              {/* CUE */}
              <button
                onMouseDown={() => onSimulateEvent(state.shift ? 0x94 : 0x91, 0x06, 0x7f)}
                onMouseUp={() => onSimulateEvent(state.shift ? 0x94 : 0x91, 0x06, 0x00)}
                className={`h-11 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  leds.deckACue || state.deckA.cue
                    ? 'bg-amber-600/30 text-amber-300 border-amber-400 shadow-md shadow-amber-500/40 ring-1 ring-amber-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
                title="CUE (0x91 Note: 0x06)"
              >
                <span>CUE</span>
                {state.shift && <span className="text-[7px] text-amber-300">REWIND</span>}
              </button>

              {/* PLAY / PAUSE */}
              <button
                onMouseDown={() => onSimulateEvent(state.shift ? 0x94 : 0x91, 0x07, 0x7f)}
                onMouseUp={() => onSimulateEvent(state.shift ? 0x94 : 0x91, 0x07, 0x00)}
                className={`h-11 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  leds.deckAPlay || state.deckA.play
                    ? 'bg-emerald-600/40 text-emerald-300 border-emerald-400 shadow-lg shadow-emerald-500/40 ring-1 ring-emerald-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
                title="PLAY / PAUSE (0x91 Note: 0x07)"
              >
                <div className="flex items-center gap-1">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY</span>
                </div>
                {state.shift && <span className="text-[7px] text-amber-300">STUTTER</span>}
              </button>

              {/* PFL / HEADPHONE CUE */}
              <button
                onMouseDown={() => onSimulateEvent(state.shift ? 0x94 : 0x91, 0x0c, 0x7f)}
                onMouseUp={() => onSimulateEvent(state.shift ? 0x94 : 0x91, 0x0c, 0x00)}
                className={`h-11 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  leds.deckAPfl || state.deckA.pfl
                    ? 'bg-cyan-600/30 text-cyan-300 border-cyan-400 shadow-md shadow-cyan-500/40 ring-1 ring-cyan-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
                title="Headphone Cue PFL (0x91 Note: 0x0C)"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span className="text-[9px]">PFL</span>
              </button>
            </div>
          </div>

          {/* CENTER MIXER (COLUMNS 6 to 7) */}
          <div className="lg:col-span-2 bg-slate-950/90 rounded-xl p-3 border border-slate-800 flex flex-col justify-between shadow-inner">
            <div className="text-center pb-2 border-b border-slate-800">
              <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase font-mono">
                MIXER
              </span>
            </div>

            {/* EQ & Filter Knobs Grid */}
            <div className="grid grid-cols-2 gap-3 my-2">
              {/* Bass EQ Deck A */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-slate-400 font-bold mb-1">BASS A</span>
                <input
                  type="range"
                  min="0"
                  max="127"
                  value={state.deckA.bass}
                  onChange={(e) => onSimulateEvent(0xb1, 0x02, Number(e.target.value))}
                  className="w-14 accent-cyan-500 cursor-pointer"
                />
                <span className="text-[9px] font-mono text-cyan-400 mt-0.5">
                  {state.deckA.bass}
                </span>
              </div>

              {/* Bass EQ Deck B */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-slate-400 font-bold mb-1">BASS B</span>
                <input
                  type="range"
                  min="0"
                  max="127"
                  value={state.deckB.bass}
                  onChange={(e) => onSimulateEvent(0xb2, 0x02, Number(e.target.value))}
                  className="w-14 accent-purple-500 cursor-pointer"
                />
                <span className="text-[9px] font-mono text-purple-400 mt-0.5">
                  {state.deckB.bass}
                </span>
              </div>

              {/* Filter Deck A */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-slate-400 font-bold mb-1">FILTER A</span>
                <input
                  type="range"
                  min="0"
                  max="127"
                  value={state.deckA.filter}
                  onChange={(e) => onSimulateEvent(0xb1, 0x01, Number(e.target.value))}
                  className="w-14 accent-cyan-500 cursor-pointer"
                />
                <span className="text-[9px] font-mono text-cyan-400 mt-0.5">
                  {state.deckA.filter}
                </span>
              </div>

              {/* Filter Deck B */}
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-slate-400 font-bold mb-1">FILTER B</span>
                <input
                  type="range"
                  min="0"
                  max="127"
                  value={state.deckB.filter}
                  onChange={(e) => onSimulateEvent(0xb2, 0x01, Number(e.target.value))}
                  className="w-14 accent-purple-500 cursor-pointer"
                />
                <span className="text-[9px] font-mono text-purple-400 mt-0.5">
                  {state.deckB.filter}
                </span>
              </div>
            </div>

            {/* Channel Volume Faders */}
            <div className="grid grid-cols-2 gap-3 py-2 bg-slate-900/40 rounded-lg border border-slate-800/80 px-2 my-1">
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-cyan-400 font-bold mb-1">VOL A</span>
                <input
                  type="range"
                  min="0"
                  max="127"
                  value={state.deckA.volume}
                  onChange={(e) => onSimulateEvent(0xb1, 0x00, Number(e.target.value))}
                  className="h-20 w-4 accent-cyan-500 cursor-pointer"
                  style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                />
                <span className="text-[8px] font-mono text-slate-400 mt-1">{state.deckA.volume}</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="text-[9px] font-mono text-purple-400 font-bold mb-1">VOL B</span>
                <input
                  type="range"
                  min="0"
                  max="127"
                  value={state.deckB.volume}
                  onChange={(e) => onSimulateEvent(0xb2, 0x00, Number(e.target.value))}
                  className="h-20 w-4 accent-purple-500 cursor-pointer"
                  style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                />
                <span className="text-[8px] font-mono text-slate-400 mt-1">{state.deckB.volume}</span>
              </div>
            </div>

            {/* Shift Button in Center */}
            <div className="flex justify-center my-1.5">
              <button
                onMouseDown={() => onSimulateEvent(0x90, 0x03, 0x7f)}
                onMouseUp={() => onSimulateEvent(0x90, 0x03, 0x00)}
                onTouchStart={() => onSimulateEvent(0x90, 0x03, 0x7f)}
                onTouchEnd={() => onSimulateEvent(0x90, 0x03, 0x00)}
                className={`w-full py-2 rounded-lg font-bold text-xs uppercase tracking-wider border transition-all ${
                  state.shift
                    ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-lg shadow-amber-500/50 ring-2 ring-amber-400'
                    : 'bg-slate-800 text-amber-400 border-amber-700/50 hover:bg-slate-700'
                }`}
                title="Shift Button (0x90 Note: 0x03)"
              >
                SHIFT {state.shift ? '✓' : ''}
              </button>
            </div>

            {/* Crossfader */}
            <div className="mt-2 pt-2 border-t border-slate-800">
              <div className="flex justify-between text-[9px] font-mono text-slate-400 font-bold mb-1">
                <span className="text-cyan-400">A</span>
                <span>CROSSFADER</span>
                <span className="text-purple-400">B</span>
              </div>
              <input
                type="range"
                min="0"
                max="127"
                value={state.crossfader}
                onChange={(e) => onSimulateEvent(0xb0, 0x00, Number(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-mono text-slate-500 mt-0.5">
                <span>0</span>
                <span>64</span>
                <span>127</span>
              </div>
            </div>
          </div>

          {/* DECK B (COLUMNS 8 to 12) */}
          <div className="lg:col-span-5 bg-slate-900/60 rounded-xl p-3 border border-slate-800 flex flex-col justify-between relative shadow-inner">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold tracking-wider text-purple-400 font-mono flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500" />
                DECK 2 (B)
              </span>

              <span className="text-[10px] font-mono text-slate-500">Channel 2 / Ch 8 Pads</span>
            </div>

            {/* Jog Wheel & Pitch Section */}
            <div className="flex items-center justify-around gap-2 my-2">
              {/* Pitch Fader Slider Deck B */}
              <div className="flex flex-col items-center justify-center h-44 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span className="text-[10px] font-mono text-slate-400 font-bold mb-1">TEMPO</span>
                <div className="relative h-28 flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="127"
                    value={state.deckB.pitch}
                    onChange={(e) => onSimulateEvent(0xb2, 0x08, Number(e.target.value))}
                    className="h-28 w-6 appearance-none bg-slate-800 rounded-lg cursor-pointer orient-vertical"
                    style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                  />
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-purple-500/60 pointer-events-none" />
                </div>
                <span className="text-[9px] font-mono text-purple-400 mt-1">
                  {((state.deckB.pitch - 64) * 0.15).toFixed(1)}%
                </span>
              </div>

              {/* Jog Wheel Platter Deck B */}
              <div className="flex flex-col items-center">
                <div
                  onMouseDown={() => onSimulateEvent(0x92, 0x08, 0x7f)}
                  onMouseUp={() => onSimulateEvent(0x92, 0x08, 0x00)}
                  onTouchStart={() => onSimulateEvent(0x92, 0x08, 0x7f)}
                  onTouchEnd={() => onSimulateEvent(0x92, 0x08, 0x00)}
                  className={`w-36 h-36 sm:w-44 sm:h-44 rounded-full relative cursor-grab active:cursor-grabbing flex items-center justify-center border-4 transition-shadow ${
                    state.deckB.wheelTouch
                      ? 'border-purple-400 shadow-xl shadow-purple-500/40 ring-4 ring-purple-500/20'
                      : 'border-slate-700 hover:border-slate-500 shadow-lg'
                  } bg-gradient-to-br from-slate-800 via-neutral-900 to-slate-950`}
                  style={{
                    transform: `rotate(${deckBRotation}deg)`,
                    transition: 'transform 0.05s linear',
                  }}
                  title="Touch Jog Wheel Deck B"
                >
                  <div className="absolute inset-2 rounded-full border-2 border-dashed border-slate-600/70" />
                  <div className="absolute inset-6 rounded-full border border-slate-700" />

                  {/* Center Metal Platter Cap */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-900 via-slate-800 to-slate-950 border-2 border-purple-500/50 flex flex-col items-center justify-center shadow-inner">
                    <Disc className="w-6 h-6 text-purple-400" />
                    <span className="text-[9px] font-mono text-purple-300 font-bold mt-0.5">
                      {state.deckB.wheelTouch ? 'TOUCH' : 'DECK B'}
                    </span>
                  </div>

                  {/* Scratch Marker Stripe */}
                  <div className="absolute top-1 w-2.5 h-4 bg-purple-400 rounded-sm shadow-md shadow-purple-400" />
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleJogSpin('B', -2)}
                    className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700 border border-slate-700"
                  >
                    ◀ Nudge
                  </button>
                  <span className="text-[10px] font-mono text-slate-400">
                    {Math.round(deckBRotation)}°
                  </span>
                  <button
                    onClick={() => handleJogSpin('B', 2)}
                    className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 hover:bg-slate-700 border border-slate-700"
                  >
                    Nudge ▶
                  </button>
                </div>
              </div>
            </div>

            {/* Performance Pads Section Deck B */}
            <div className="mt-2 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
              <div className="grid grid-cols-4 gap-1 mb-2">
                {(['hotcue', 'loop', 'fx', 'sampler'] as PadMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDeckBPadMode(mode)}
                    className={`text-[9px] font-bold uppercase py-1 rounded text-center transition-all ${
                      deckBPadMode === mode
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/60 shadow-sm'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* 4 Rubber Pads Deck B */}
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((idx) => {
                  const isPressed = state.deckB.pads[idx];
                  const isLit = leds.deckBPads[idx] || isPressed;
                  const label = getPadLabels(deckBPadMode)[idx];
                  return (
                    <button
                      key={idx}
                      onMouseDown={() => handlePadPress('B', deckBPadMode, idx, true)}
                      onMouseUp={() => handlePadPress('B', deckBPadMode, idx, false)}
                      onTouchStart={() => handlePadPress('B', deckBPadMode, idx, true)}
                      onTouchEnd={() => handlePadPress('B', deckBPadMode, idx, false)}
                      className={`h-14 rounded-lg flex flex-col items-center justify-center p-1 font-mono transition-all transform active:scale-95 border ${
                        isLit
                          ? 'bg-gradient-to-b from-purple-500 to-indigo-600 text-white border-purple-300 shadow-lg shadow-purple-500/50 ring-2 ring-purple-400/40'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700/80'
                      }`}
                    >
                      <span className="text-[11px] font-black">{idx + 1}</span>
                      <span className="text-[8px] truncate max-w-full font-semibold opacity-90">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Transport Buttons: SYNC, CUE, PLAY, PFL */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {/* SYNC */}
              <button
                onMouseDown={() => onSimulateEvent(state.shift ? 0x95 : 0x92, 0x05, 0x7f)}
                onMouseUp={() => onSimulateEvent(state.shift ? 0x95 : 0x92, 0x05, 0x00)}
                className={`h-11 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  leds.deckBSync || state.deckB.sync
                    ? 'bg-blue-600/30 text-blue-300 border-blue-400 shadow-md shadow-blue-500/40 ring-1 ring-blue-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
                title="SYNC (0x92 Note: 0x05)"
              >
                <span>SYNC</span>
                {state.shift && <span className="text-[7px] text-amber-300">MASTER</span>}
              </button>

              {/* CUE */}
              <button
                onMouseDown={() => onSimulateEvent(state.shift ? 0x95 : 0x92, 0x06, 0x7f)}
                onMouseUp={() => onSimulateEvent(state.shift ? 0x95 : 0x92, 0x06, 0x00)}
                className={`h-11 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  leds.deckBCue || state.deckB.cue
                    ? 'bg-amber-600/30 text-amber-300 border-amber-400 shadow-md shadow-amber-500/40 ring-1 ring-amber-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
                title="CUE (0x92 Note: 0x06)"
              >
                <span>CUE</span>
                {state.shift && <span className="text-[7px] text-amber-300">REWIND</span>}
              </button>

              {/* PLAY / PAUSE */}
              <button
                onMouseDown={() => onSimulateEvent(state.shift ? 0x95 : 0x92, 0x07, 0x7f)}
                onMouseUp={() => onSimulateEvent(state.shift ? 0x95 : 0x92, 0x07, 0x00)}
                className={`h-11 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  leds.deckBPlay || state.deckB.play
                    ? 'bg-emerald-600/40 text-emerald-300 border-emerald-400 shadow-lg shadow-emerald-500/40 ring-1 ring-emerald-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
                title="PLAY / PAUSE (0x92 Note: 0x07)"
              >
                <div className="flex items-center gap-1">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>PLAY</span>
                </div>
                {state.shift && <span className="text-[7px] text-amber-300">STUTTER</span>}
              </button>

              {/* PFL / HEADPHONE CUE */}
              <button
                onMouseDown={() => onSimulateEvent(state.shift ? 0x95 : 0x92, 0x0c, 0x7f)}
                onMouseUp={() => onSimulateEvent(state.shift ? 0x95 : 0x92, 0x0c, 0x00)}
                className={`h-11 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                  leds.deckBPfl || state.deckB.pfl
                    ? 'bg-purple-600/30 text-purple-300 border-purple-400 shadow-md shadow-purple-500/40 ring-1 ring-purple-400'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
                title="Headphone Cue PFL (0x92 Note: 0x0C)"
              >
                <Headphones className="w-3.5 h-3.5" />
                <span className="text-[9px]">PFL</span>
              </button>
            </div>
          </div>
        </div>

        {/* Acrylic Base Underglow LED Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-1.5 px-2">
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>STARLIGHT ACRYLIC BASE UNDERGLOW (RGB LED STRIP)</span>
            </span>
            <span className="text-[11px] text-slate-500">MIDI 0x91 0x23 (L) / 0x92 0x23 (R)</span>
          </div>

          <div className="relative h-6 rounded-full overflow-hidden border border-slate-700/60 bg-slate-950 p-1 flex items-center justify-between shadow-2xl">
            {/* Left Deck Acrylic Glow */}
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: '48%',
                backgroundColor: '#06b6d4',
                opacity: Math.max(0.08, leds.baseLeftLevel / 127),
                boxShadow:
                  leds.baseLeftLevel > 5
                    ? `0 0 ${12 + (leds.baseLeftLevel / 127) * 24}px rgba(6, 182, 212, ${0.4 + (leds.baseLeftLevel / 127) * 0.6})`
                    : 'none',
              }}
            />

            {/* Center Separation */}
            <div className="w-2 h-2 rounded-full bg-slate-700" />

            {/* Right Deck Acrylic Glow */}
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: '48%',
                backgroundColor: '#a855f7',
                opacity: Math.max(0.08, leds.baseRightLevel / 127),
                boxShadow:
                  leds.baseRightLevel > 5
                    ? `0 0 ${12 + (leds.baseRightLevel / 127) * 24}px rgba(168, 85, 247, ${0.4 + (leds.baseRightLevel / 127) * 0.6})`
                    : 'none',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
