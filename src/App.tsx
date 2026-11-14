import React, { useState, useEffect, useRef, useCallback } from 'react';
import { midiService } from './services/midiService';
import {
  ControllerState,
  LEDState,
  ButtonAuditItem,
  MIDIMessageEvent,
  PadMode,
} from './types/midi';
import { INITIAL_AUDIT_ITEMS } from './utils/starlightMidi';
import { Header } from './components/Header';
import { ControllerVisualizer } from './components/ControllerVisualizer';
import { LEDTester } from './components/LEDTester';
import { ButtonHealthAudit } from './components/ButtonHealthAudit';
import { MIDIMonitorLog } from './components/MIDIMonitorLog';
import { SamsungOTGGuide } from './components/SamsungOTGGuide';
import { APKExportModal } from './components/APKExportModal';
import { Volume2, VolumeX, ShieldCheck, Zap } from 'lucide-react';

const INITIAL_DECK_STATE = {
  play: false,
  cue: false,
  sync: false,
  pfl: false,
  vinyl: true,
  wheelTouch: false,
  wheelAngle: 0,
  wheelSpeed: 0,
  pitch: 64,
  volume: 100,
  filter: 64,
  bass: 64,
  padMode: 'hotcue' as PadMode,
  pads: [false, false, false, false] as [boolean, boolean, boolean, boolean],
  padsVelocity: [0, 0, 0, 0] as [number, number, number, number],
  baseLEDValue: 0,
};

export default function App() {
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<'visualizer' | 'led_tester' | 'audit' | 'midi_log'>('visualizer');
  const [isOTGGuideOpen, setIsOTGGuideOpen] = useState(false);
  const [isAPKModalOpen, setIsAPKModalOpen] = useState(false);
  const [audioFeedback, setAudioFeedback] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [deviceName, setDeviceName] = useState('Checking...');
  const [isVirtualMode, setIsVirtualMode] = useState(false);
  const [availableInputs, setAvailableInputs] = useState<{ id: string; name: string }[]>([]);
  const [availableOutputs, setAvailableOutputs] = useState<{ id: string; name: string }[]>([]);

  // Controller State
  const [controllerState, setControllerState] = useState<ControllerState>({
    shift: false,
    crossfader: 64,
    masterVolume: 100,
    headphoneVolume: 80,
    deckA: { ...INITIAL_DECK_STATE },
    deckB: { ...INITIAL_DECK_STATE },
    baseLEDMode: 0,
  });

  // LED State
  const [leds, setLeds] = useState<LEDState>({ ...midiService.ledState });

  // Audit Checklist
  const [auditItems, setAuditItems] = useState<ButtonAuditItem[]>(INITIAL_AUDIT_ITEMS);

  // MIDI Message Logs (up to 300)
  const [logs, setLogs] = useState<MIDIMessageEvent[]>([]);

  // Simple Web Audio synth for button click sound feedback
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playClickSound = useCallback((freq = 440, type: OscillatorType = 'sine', duration = 0.04) => {
    if (!audioFeedback) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio autoplay policy fallback
    }
  }, [audioFeedback]);

  // Handle incoming MIDI message
  const handleMIDIMessage = useCallback((msg: MIDIMessageEvent) => {
    const receiveTime = performance.now();

    setLogs((prev) => [msg, ...prev.slice(0, 299)]);

    // Update physical controller state & audit based on message
    setControllerState((prev) => {
      const next = { ...prev };
      const status = msg.statusByte;
      const data1 = msg.data1;
      const data2 = msg.data2;
      const isPressed = msg.type === 'noteon' && data2 > 0;

      let targetAuditId: string | null = null;
      let latencyMs = Math.round(performance.now() - receiveTime);

      // Master Shift (0x90 0x03)
      if (status === 0x90 && data1 === 0x03) {
        next.shift = data2 >= 0x40;
        targetAuditId = 'master_shift';
        if (next.shift) playClickSound(600, 'square');
      }

      // Crossfader (0xB0 0x00)
      if (status === 0xb0 && data1 === 0x00) {
        next.crossfader = data2;
        targetAuditId = 'master_crossfader';
      }

      // Deck A Transport
      if (status === 0x91 || status === 0x81) {
        if (data1 === 0x07) {
          next.deckA.play = isPressed;
          targetAuditId = 'deck_a_play';
          if (isPressed) playClickSound(520, 'triangle');
        } else if (data1 === 0x06) {
          next.deckA.cue = isPressed;
          targetAuditId = 'deck_a_cue';
          if (isPressed) playClickSound(440, 'triangle');
        } else if (data1 === 0x05) {
          next.deckA.sync = isPressed;
          targetAuditId = 'deck_a_sync';
          if (isPressed) playClickSound(660, 'triangle');
        } else if (data1 === 0x0c) {
          next.deckA.pfl = isPressed;
          targetAuditId = 'deck_a_pfl';
          if (isPressed) playClickSound(380, 'sine');
        } else if (data1 === 0x03) {
          next.deckA.vinyl = isPressed;
          targetAuditId = 'deck_a_vinyl';
          if (isPressed) playClickSound(300, 'sine');
        } else if (data1 === 0x08) {
          next.deckA.wheelTouch = isPressed;
          targetAuditId = 'deck_a_jog_touch';
          if (isPressed) playClickSound(200, 'sawtooth', 0.02);
        } else if (data1 === 0x23) {
          next.deckA.baseLEDValue = data2;
        }
      }

      // Deck B Transport
      if (status === 0x92 || status === 0x82) {
        if (data1 === 0x07) {
          next.deckB.play = isPressed;
          targetAuditId = 'deck_b_play';
          if (isPressed) playClickSound(520, 'triangle');
        } else if (data1 === 0x06) {
          next.deckB.cue = isPressed;
          targetAuditId = 'deck_b_cue';
          if (isPressed) playClickSound(440, 'triangle');
        } else if (data1 === 0x05) {
          next.deckB.sync = isPressed;
          targetAuditId = 'deck_b_sync';
          if (isPressed) playClickSound(660, 'triangle');
        } else if (data1 === 0x0c) {
          next.deckB.pfl = isPressed;
          targetAuditId = 'deck_b_pfl';
          if (isPressed) playClickSound(380, 'sine');
        } else if (data1 === 0x08) {
          next.deckB.wheelTouch = isPressed;
          targetAuditId = 'deck_b_jog_touch';
          if (isPressed) playClickSound(200, 'sawtooth', 0.02);
        } else if (data1 === 0x23) {
          next.deckB.baseLEDValue = data2;
        }
      }

      // Deck A CC Knobs & Faders
      if (status === 0xb1) {
        if (data1 === 0x00) {
          next.deckA.volume = data2;
          targetAuditId = 'deck_a_volume';
        } else if (data1 === 0x01) {
          next.deckA.filter = data2;
          targetAuditId = 'deck_a_filter';
        } else if (data1 === 0x02) {
          next.deckA.bass = data2;
          targetAuditId = 'deck_a_bass';
        } else if (data1 === 0x08 || data1 === 0x28) {
          next.deckA.pitch = data2;
          targetAuditId = 'deck_a_pitch';
        } else if (data1 === 0x0a) {
          const delta = data2 < 0x40 ? data2 : -(128 - data2);
          next.deckA.wheelAngle = (next.deckA.wheelAngle + delta * 6) % 360;
          targetAuditId = 'deck_a_jog_scratch';
        } else if (data1 === 0x09) {
          const delta = data2 < 0x40 ? data2 : -(128 - data2);
          next.deckA.wheelAngle = (next.deckA.wheelAngle + delta * 3) % 360;
          targetAuditId = 'deck_a_jog_bend';
        }
      }

      // Deck B CC Knobs & Faders
      if (status === 0xb2) {
        if (data1 === 0x00) {
          next.deckB.volume = data2;
          targetAuditId = 'deck_b_volume';
        } else if (data1 === 0x01) {
          next.deckB.filter = data2;
          targetAuditId = 'deck_b_filter';
        } else if (data1 === 0x02) {
          next.deckB.bass = data2;
          targetAuditId = 'deck_b_bass';
        } else if (data1 === 0x08 || data1 === 0x28) {
          next.deckB.pitch = data2;
          targetAuditId = 'deck_b_pitch';
        } else if (data1 === 0x0a) {
          const delta = data2 < 0x40 ? data2 : -(128 - data2);
          next.deckB.wheelAngle = (next.deckB.wheelAngle + delta * 6) % 360;
          targetAuditId = 'deck_b_jog_scratch';
        } else if (data1 === 0x09) {
          const delta = data2 < 0x40 ? data2 : -(128 - data2);
          next.deckB.wheelAngle = (next.deckB.wheelAngle + delta * 3) % 360;
          targetAuditId = 'deck_b_jog_bend';
        }
      }

      // Deck A Pads (0x96)
      if (status === 0x96 || status === 0x86) {
        let padIdx = data1 & 0x03;
        const pads = [...next.deckA.pads] as [boolean, boolean, boolean, boolean];
        pads[padIdx] = isPressed;
        next.deckA.pads = pads;
        targetAuditId = `deck_a_pad_${padIdx + 1}`;
        if (isPressed) playClickSound(300 + padIdx * 70, 'triangle');
      }

      // Deck B Pads (0x97)
      if (status === 0x97 || status === 0x87) {
        let padIdx = data1 & 0x03;
        const pads = [...next.deckB.pads] as [boolean, boolean, boolean, boolean];
        pads[padIdx] = isPressed;
        next.deckB.pads = pads;
        targetAuditId = `deck_b_pad_${padIdx + 1}`;
        if (isPressed) playClickSound(300 + padIdx * 70, 'triangle');
      }

      // Record audit update
      if (targetAuditId) {
        setAuditItems((prevList) =>
          prevList.map((item) => {
            if (item.id === targetAuditId) {
              return {
                ...item,
                tested: true,
                pressCount: item.pressCount + 1,
                lastPressTime: Date.now(),
                lastLatencyMs: Math.max(1, latencyMs),
                lastVelocity: data2,
              };
            }
            return item;
          })
        );
      }

      return next;
    });
  }, [playClickSound]);

  // Initialize MIDI Service
  const refreshPorts = useCallback(() => {
    const ports = midiService.getAvailablePorts();
    setAvailableInputs(ports.inputs);
    setAvailableOutputs(ports.outputs);
  }, []);

  const initMidi = useCallback(async () => {
    const res = await midiService.initMIDI();
    setIsConnected(midiService.isConnected);
    setDeviceName(midiService.deviceName);
    setIsVirtualMode(midiService.isVirtualMode);
    refreshPorts();
    setLeds({ ...midiService.ledState });
  }, [refreshPorts]);

  useEffect(() => {
    // Register PWA service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service worker registration failed:', err);
      });
    }

    // Capture beforeinstallprompt for native Android WebAPK install
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // Subscribe to MIDI Service events
    const unsubMsg = midiService.onMessage(handleMIDIMessage);
    const unsubState = midiService.onStateChange((connected, name) => {
      setIsConnected(connected);
      setDeviceName(name);
      refreshPorts();
    });

    initMidi();

    return () => {
      unsubMsg();
      unsubState();
    };
  }, [handleMIDIMessage, initMidi, refreshPorts]);

  const handleSimulateEvent = (status: number, data1: number, data2: number) => {
    midiService.injectVirtualInput(status, data1, data2);
  };

  const handleToggleVirtualMode = () => {
    midiService.isVirtualMode = !midiService.isVirtualMode;
    setIsVirtualMode(midiService.isVirtualMode);
    if (midiService.isVirtualMode) {
      setIsConnected(false);
      setDeviceName('Virtual Simulator Mode');
    } else {
      initMidi();
    }
  };

  const handleResetAudit = () => {
    setAuditItems(INITIAL_AUDIT_ITEMS.map((item) => ({ ...item, tested: false, pressCount: 0 })));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        isConnected={isConnected}
        deviceName={deviceName}
        isVirtualMode={isVirtualMode}
        onToggleVirtualMode={handleToggleVirtualMode}
        onRescan={initMidi}
        onOpenOTGGuide={() => setIsOTGGuideOpen(true)}
        onOpenAPKModal={() => setIsAPKModalOpen(true)}
        availableInputs={availableInputs}
        availableOutputs={availableOutputs}
        onSelectPort={(inId, outId) => {
          midiService.selectPortById(inId, outId);
          setIsConnected(midiService.isConnected);
          setDeviceName(midiService.deviceName);
        }}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-2 sm:p-4">
        {/* Quick OTG Info Banner for Samsung Galaxy A16 */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              <strong>Samsung Galaxy A16 / Linux OTG Mode:</strong> Plug Hercules Starlight into USB-C OTG port. Web MIDI auto-detects inputs &amp; LED outputs.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Audio click feedback toggle */}
            <button
              onClick={() => setAudioFeedback(!audioFeedback)}
              className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-300 font-mono transition-colors"
              title="Toggle audio click feedback on button press"
            >
              {audioFeedback ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{audioFeedback ? 'Sound ON' : 'Sound Muted'}</span>
            </button>

            <button
              onClick={() => setIsOTGGuideOpen(true)}
              className="text-cyan-400 hover:text-cyan-300 underline font-semibold flex items-center gap-1"
            >
              <span>Setup Guide &amp; Shizuku</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Visualizer */}
        {activeTab === 'visualizer' && (
          <ControllerVisualizer
            state={controllerState}
            leds={leds}
            onSimulateEvent={handleSimulateEvent}
            isVirtualMode={isVirtualMode}
          />
        )}

        {/* Tab 2: LED Tester */}
        {activeTab === 'led_tester' && (
          <LEDTester
            leds={leds}
            onRefreshLEDs={() => setLeds({ ...midiService.ledState })}
          />
        )}

        {/* Tab 3: Button Health Audit */}
        {activeTab === 'audit' && (
          <ButtonHealthAudit
            auditItems={auditItems}
            onResetAudit={handleResetAudit}
          />
        )}

        {/* Tab 4: Live MIDI Monitor Log */}
        {activeTab === 'midi_log' && (
          <MIDIMonitorLog
            logs={logs}
            onClearLogs={() => setLogs([])}
          />
        )}
      </main>

      {/* Samsung A16 & Linux OTG Guide Modal */}
      <SamsungOTGGuide
        isOpen={isOTGGuideOpen}
        onClose={() => setIsOTGGuideOpen(false)}
      />

      {/* APK & Shizuku Download Modal */}
      <APKExportModal
        isOpen={isAPKModalOpen}
        onClose={() => setIsAPKModalOpen(false)}
        deferredPrompt={deferredPrompt}
      />
    </div>
  );
}
