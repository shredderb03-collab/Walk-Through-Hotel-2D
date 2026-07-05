/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Power, Settings, Wrench, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { sound } from '../utils/audio';

interface SwitchPuzzleProps {
  onSolve: () => void;
  onClose: () => void;
}

type PuzzleStep = 'REMOVE_WIRES' | 'REMOVE_SWITCH' | 'PLACE_NEW' | 'CONNECT_WIRES' | 'FLIP_SWITCH' | 'COMPLETE';

export default function SwitchPuzzle({ onSolve, onClose }: SwitchPuzzleProps) {
  const [step, setStep] = useState<PuzzleStep>('REMOVE_WIRES');
  const [removedWires, setRemovedWires] = useState<{ red: boolean; blue: boolean; green: boolean }>({
    red: false,
    blue: false,
    green: false,
  });
  const [isBrokenSwitchRemoved, setIsBrokenSwitchRemoved] = useState(false);
  const [isNewSwitchPlaced, setIsNewSwitchPlaced] = useState(false);
  const [connectedNewWires, setConnectedNewWires] = useState<{ red: boolean; blue: boolean; green: boolean }>({
    red: false,
    blue: false,
    green: false,
  });
  const [switchFlipped, setSwitchFlipped] = useState(false);

  const handleWireDisconnect = (color: 'red' | 'blue' | 'green') => {
    if (step !== 'REMOVE_WIRES') return;
    sound.playClick();
    const updated = { ...removedWires, [color]: true };
    setRemovedWires(updated);
    if (updated.red && updated.blue && updated.green) {
      sound.playUnlock();
      setStep('REMOVE_SWITCH');
    }
  };

  const handleRemoveBrokenSwitch = () => {
    if (step !== 'REMOVE_SWITCH') return;
    sound.playDeath(); // scary clank
    setIsBrokenSwitchRemoved(true);
    setStep('PLACE_NEW');
  };

  const handlePlaceNewSwitch = () => {
    if (step !== 'PLACE_NEW') return;
    sound.playKey(); // nice clean mount ding
    setIsNewSwitchPlaced(true);
    setStep('CONNECT_WIRES');
  };

  const handleConnectWire = (color: 'red' | 'blue' | 'green') => {
    if (step !== 'CONNECT_WIRES') return;
    sound.playClick();
    const updated = { ...connectedNewWires, [color]: true };
    setConnectedNewWires(updated);
    if (updated.red && updated.blue && updated.green) {
      sound.playUnlock();
      setStep('FLIP_SWITCH');
    }
  };

  const handleFlipSwitch = () => {
    if (step !== 'FLIP_SWITCH') return;
    sound.playVictory();
    setSwitchFlipped(true);
    setStep('COMPLETE');
    setTimeout(() => {
      onSolve();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-lg bg-zinc-900 border-4 border-amber-600 rounded-xl shadow-2xl p-6 flex flex-col justify-between overflow-hidden"
      >
        {/* Warning Stripes */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-500 via-zinc-800 to-amber-500 bg-[length:40px_100%] opacity-80" />
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-amber-500 via-zinc-800 to-amber-500 bg-[length:40px_100%] opacity-80" />

        {/* Screws */}
        <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-zinc-600 border border-zinc-500 shadow-inner flex items-center justify-center"><div className="w-3 h-0.5 bg-zinc-800 rotate-45" /></div>
        <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-zinc-600 border border-zinc-500 shadow-inner flex items-center justify-center"><div className="w-3 h-0.5 bg-zinc-800 -rotate-12" /></div>

        {/* Header */}
        <div className="flex justify-between items-center z-10 mb-4">
          <div className="flex items-center gap-3">
            <Wrench className="text-amber-500 animate-pulse" size={24} />
            <div>
              <h2 className="text-amber-500 font-mono text-lg font-bold tracking-wider">
                ELEVATOR POWER JUNCTION
              </h2>
              <p className="text-zinc-400 font-mono text-xs">
                DOOR 100 • REPAIR SUB-SYSTEM
              </p>
            </div>
          </div>
          {step !== 'COMPLETE' && (
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Instruction Banner */}
        <div className="bg-zinc-950 p-3 rounded border border-zinc-800 text-center font-mono text-xs mb-6">
          <span className="text-amber-400 uppercase tracking-widest font-bold">
            {step === 'REMOVE_WIRES' && 'STEP 1: Tap the three broken wires to disconnect them.'}
            {step === 'REMOVE_SWITCH' && 'STEP 2: Tap the burnt-out broken switch to remove it.'}
            {step === 'PLACE_NEW' && 'STEP 3: Tap the empty housing to insert the New Switch.'}
            {step === 'CONNECT_WIRES' && 'STEP 4: Tap the dangling colored wires to rewire the new switch.'}
            {step === 'FLIP_SWITCH' && 'STEP 5: FLIP THE POWER LEVER TO START THE ELEVATOR!'}
            {step === 'COMPLETE' && 'SYSTEM REPAIR INJECTED. POWER GOING ONLINE...'}
          </span>
        </div>

        {/* Puzzle Board Workspace */}
        <div className="relative flex-1 bg-zinc-950 rounded-lg border-2 border-zinc-800 p-6 flex flex-col items-center justify-center min-h-[220px] shadow-inner">
          
          {/* Main Power Box Housing */}
          <div className="relative w-48 h-48 bg-zinc-800 rounded-xl border-4 border-zinc-700 shadow-2xl flex flex-col items-center justify-center overflow-hidden">
            {/* Background Circuit Boards */}
            <div className="absolute inset-2 border border-zinc-700 rounded-md opacity-25 flex flex-col justify-between p-2 pointer-events-none">
              <div className="text-[8px] font-mono text-zinc-400">BUS-A 100V</div>
              <div className="text-[8px] font-mono text-zinc-400 text-right">GND SHIELD</div>
            </div>

            {/* Render Switch Housing */}
            {!isNewSwitchPlaced ? (
              // Broken switch or empty slot
              !isBrokenSwitchRemoved ? (
                // Broken Switch Active
                <motion.button
                  whileHover={{ scale: step === 'REMOVE_SWITCH' ? 1.05 : 1 }}
                  onClick={handleRemoveBrokenSwitch}
                  disabled={step !== 'REMOVE_SWITCH'}
                  className={`w-20 h-28 bg-zinc-900 border-4 border-zinc-950 rounded-lg flex flex-col items-center justify-between p-2 cursor-pointer transition-shadow shadow-lg ${
                    step === 'REMOVE_SWITCH' ? 'ring-4 ring-amber-500 animate-pulse' : ''
                  }`}
                >
                  <div className="w-12 h-6 bg-red-950 border border-red-800 rounded flex items-center justify-center text-[9px] text-red-500 font-mono font-bold animate-pulse">
                    BURNT
                  </div>
                  {/* Broken switch lever */}
                  <div className="w-4 h-12 bg-zinc-600 rounded-b-md shadow relative flex items-center justify-center">
                    <div className="w-2 h-10 bg-zinc-500 rounded-b border-b-2 border-red-700 absolute top-2 rotate-12" />
                  </div>
                  <div className="text-[8px] text-red-500 font-mono uppercase font-bold tracking-widest animate-pulse">
                    BROKEN
                  </div>
                </motion.button>
              ) : (
                // Empty housing slot
                <motion.button
                  whileHover={{ scale: step === 'PLACE_NEW' ? 1.05 : 1 }}
                  onClick={handlePlaceNewSwitch}
                  disabled={step !== 'PLACE_NEW'}
                  className={`w-20 h-28 bg-zinc-950 border-4 border-dashed border-zinc-700 rounded-lg flex flex-col items-center justify-center p-2 transition-all ${
                    step === 'PLACE_NEW' ? 'border-amber-500 bg-amber-950/10 ring-2 ring-amber-500' : ''
                  }`}
                >
                  <Settings className="text-zinc-600 animate-spin" size={24} />
                  <span className="text-[8px] font-mono text-zinc-500 text-center uppercase font-bold mt-2">
                    PLACE NEW
                  </span>
                </motion.button>
              )
            ) : (
              // New Switch Placed!
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-32 bg-zinc-900 border-4 border-zinc-950 rounded-lg flex flex-col items-center justify-between p-2 shadow-2xl"
              >
                <div className="w-16 h-6 bg-emerald-950 border border-emerald-800 rounded flex items-center justify-center text-[9px] text-emerald-400 font-mono font-bold">
                  ACTIVE
                </div>
                
                {/* Clean beautiful power switch lever */}
                <button
                  disabled={step !== 'FLIP_SWITCH'}
                  onClick={handleFlipSwitch}
                  className={`w-8 h-16 bg-zinc-800 border border-zinc-700 rounded-md shadow relative flex flex-col justify-between items-center py-1 cursor-pointer transition-all ${
                    step === 'FLIP_SWITCH' ? 'ring-4 ring-green-500 animate-bounce' : ''
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full border border-zinc-600 flex items-center justify-center ${switchFlipped ? 'bg-green-600 shadow-lg shadow-green-500/50' : 'bg-zinc-900'}`}>
                    <Power className={`w-3.5 h-3.5 ${switchFlipped ? 'text-white' : 'text-zinc-500'}`} />
                  </div>
                  <div className={`w-2 h-8 rounded-full bg-zinc-600 transition-all duration-300 transform ${switchFlipped ? 'translate-y-1' : '-translate-y-1'}`} />
                </button>

                <div className="text-[8px] text-emerald-400 font-mono uppercase font-bold tracking-widest">
                  {switchFlipped ? 'ON' : 'READY'}
                </div>
              </motion.div>
            )}

            {/* Wires (Disconnected/Connected states) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {/* Wire 1: Red */}
              {step === 'REMOVE_WIRES' && !removedWires.red && (
                <path d="M 20 50 C 40 40, 50 60, 74 75" fill="none" stroke="#ef4444" strokeWidth="3" className="cursor-pointer pointer-events-auto" onClick={() => handleWireDisconnect('red')} />
              )}
              {step === 'REMOVE_WIRES' && removedWires.red && (
                <path d="M 20 50 C 25 60, 15 80, 10 90" fill="none" stroke="#ef4444" strokeWidth="3" />
              )}
              {isNewSwitchPlaced && (
                <path d="M 20 50 C 40 40, 50 60, 74 75" fill="none" stroke={connectedNewWires.red ? '#ef4444' : '#ef444444'} strokeWidth="3" strokeDasharray={connectedNewWires.red ? 'none' : '4 4'} />
              )}

              {/* Wire 2: Blue */}
              {step === 'REMOVE_WIRES' && !removedWires.blue && (
                <path d="M 20 120 C 40 100, 60 110, 74 115" fill="none" stroke="#3b82f6" strokeWidth="3" className="cursor-pointer pointer-events-auto" onClick={() => handleWireDisconnect('blue')} />
              )}
              {step === 'REMOVE_WIRES' && removedWires.blue && (
                <path d="M 20 120 C 25 130, 15 140, 10 150" fill="none" stroke="#3b82f6" strokeWidth="3" />
              )}
              {isNewSwitchPlaced && (
                <path d="M 20 120 C 40 100, 60 110, 74 115" fill="none" stroke={connectedNewWires.blue ? '#3b82f6' : '#3b82f644'} strokeWidth="3" strokeDasharray={connectedNewWires.blue ? 'none' : '4 4'} />
              )}

              {/* Wire 3: Green */}
              {step === 'REMOVE_WIRES' && !removedWires.green && (
                <path d="M 20 160 C 40 140, 50 150, 74 145" fill="none" stroke="#22c55e" strokeWidth="3" className="cursor-pointer pointer-events-auto" onClick={() => handleWireDisconnect('green')} />
              )}
              {step === 'REMOVE_WIRES' && removedWires.green && (
                <path d="M 20 160 C 25 170, 15 180, 10 185" fill="none" stroke="#22c55e" strokeWidth="3" />
              )}
              {isNewSwitchPlaced && (
                <path d="M 20 160 C 40 140, 50 150, 74 145" fill="none" stroke={connectedNewWires.green ? '#22c55e' : '#22c55e44'} strokeWidth="3" strokeDasharray={connectedNewWires.green ? 'none' : '4 4'} />
              )}
            </svg>

            {/* Disconnect indicator points for Broken Stage */}
            {step === 'REMOVE_WIRES' && (
              <>
                {!removedWires.red && <div className="absolute left-[70px] top-[71px] w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />}
                {!removedWires.blue && <div className="absolute left-[70px] top-[111px] w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />}
                {!removedWires.green && <div className="absolute left-[70px] top-[141px] w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />}
              </>
            )}
          </div>

          {/* Connect Wires Selector Panel (Step 4) */}
          {step === 'CONNECT_WIRES' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="absolute bottom-4 left-4 right-4 bg-zinc-900 border border-zinc-700 p-3 rounded flex justify-around items-center gap-2"
            >
              <div className="text-[10px] font-mono text-zinc-400 uppercase">REWIRE TERMINALS:</div>
              <button
                onClick={() => handleConnectWire('red')}
                disabled={connectedNewWires.red}
                className={`px-3 py-1 font-mono text-xs font-bold rounded ${
                  connectedNewWires.red ? 'bg-zinc-800 text-zinc-600' : 'bg-red-600 text-white hover:bg-red-500'
                }`}
              >
                RED {connectedNewWires.red ? '✔' : ''}
              </button>
              <button
                onClick={() => handleConnectWire('blue')}
                disabled={connectedNewWires.blue}
                className={`px-3 py-1 font-mono text-xs font-bold rounded ${
                  connectedNewWires.blue ? 'bg-zinc-800 text-zinc-600' : 'bg-blue-600 text-white hover:bg-blue-500'
                }`}
              >
                BLUE {connectedNewWires.blue ? '✔' : ''}
              </button>
              <button
                onClick={() => handleConnectWire('green')}
                disabled={connectedNewWires.green}
                className={`px-3 py-1 font-mono text-xs font-bold rounded ${
                  connectedNewWires.green ? 'bg-zinc-800 text-zinc-600' : 'bg-green-600 text-white hover:bg-green-500'
                }`}
              >
                GREEN {connectedNewWires.green ? '✔' : ''}
              </button>
            </motion.div>
          )}

        </div>

        {/* Footer / Status */}
        <div className="mt-6 flex justify-between items-center bg-zinc-950 p-3 rounded border border-zinc-800 z-10">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${switchFlipped ? 'bg-green-500 animate-pulse' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-xs font-mono text-zinc-400">
              ELEVATOR POWER GRID: {switchFlipped ? 'ONLINE (100%)' : '0% OFFLINE'}
            </span>
          </div>
        </div>

        {/* Success Screen Overlay */}
        <AnimatePresence>
          {step === 'COMPLETE' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-30"
            >
              <motion.div
                initial={{ scale: 0.5, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                className="flex flex-col items-center gap-4 text-center p-6"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/10 border-2 border-green-500 flex items-center justify-center animate-bounce">
                  <CheckCircle2 className="text-green-500" size={32} />
                </div>
                <div>
                  <h3 className="text-green-500 font-mono font-bold text-xl tracking-widest uppercase">
                    ELEVATOR POWER RESTORED!
                  </h3>
                  <p className="text-zinc-300 font-mono text-sm mt-2">
                    Power circuits successfully bridged.
                  </p>
                  <p className="text-yellow-500 font-mono text-xs mt-3 animate-pulse">
                    The elevator doors are now OPEN. Enter the elevator to escape!
                  </p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
