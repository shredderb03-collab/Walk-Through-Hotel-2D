/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Skull, Play, ShieldAlert, Key, Zap, Volume2, Gamepad2, Info, Laptop, Smartphone, ArrowRight } from 'lucide-react';
import { GameState, GameStats } from './types';
import GameCanvas from './components/GameCanvas';
import GameOverScreen from './components/GameOverScreen';
import VictoryScreen from './components/VictoryScreen';
import { sound } from './utils/audio';

const INITIAL_STATS: GameStats = {
  doorsOpened: 1,
  timesHidden: 0,
  puzzlesSolved: 0,
  timeStarted: 0,
  timeEnded: 0,
  diedTo: 'RUSH',
  coins: 0,
};

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [introStep, setIntroStep] = useState<'DEVICE_SELECT' | 'CONTROLS' | 'ORIGINAL'>('DEVICE_SELECT');
  const [selectedDevice, setSelectedDevice] = useState<'COMPUTER' | 'MOBILE'>('COMPUTER');

  const startGame = () => {
    sound.playClick();
    setStats({
      ...INITIAL_STATS,
      timeStarted: Date.now(),
    });
    setGameState('PLAYING');
  };

  const handleGameOver = (diedTo: string) => {
    setStats(prev => ({
      ...prev,
      timeEnded: Date.now(),
      diedTo,
    }));
    setGameState('GAMEOVER');
  };

  const handleVictory = () => {
    setStats(prev => ({
      ...prev,
      timeEnded: Date.now(),
    }));
    setGameState('VICTORY');
  };

  const restartGame = () => {
    sound.playClick();
    setStats({
      ...INITIAL_STATS,
      timeStarted: Date.now(),
    });
    setGameState('PLAYING');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-red-600/30">
      
      {/* Decorative top static effect or vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(24,24,27,0.8)_0%,rgba(9,9,11,1)_100%)] pointer-events-none z-0" />

      {/* Main App Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full">
        
        <AnimatePresence mode="wait">
          {gameState === 'START' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-xl text-center flex flex-col items-center p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden"
            >
              {/* Caution stripe background headers */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-yellow-500 via-zinc-800 to-yellow-500 bg-[length:40px_100%] opacity-40" />

              {/* Creepy pulsating warning icon and Theodore Productions */}
              <div className="flex items-center gap-4 mb-6 select-none">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2.0, ease: "easeInOut" }}
                  className="w-16 h-16 rounded-full bg-red-950/30 border border-red-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                >
                  <Skull className="text-red-500 animate-pulse" size={32} />
                </motion.div>
                
                <motion.span 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs md:text-sm font-mono text-red-500 font-extrabold tracking-normal normal-case border border-red-500/30 px-3 py-1 rounded bg-red-950/20 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                >
                  Theodore Productions™
                </motion.span>
              </div>

              {/* Title Header */}
              <h1 className="text-3xl md:text-5xl font-mono text-white font-extrabold tracking-widest uppercase flex items-center justify-center gap-3">
                <span>DOORS <span className="text-red-600">2D</span></span>
                <motion.span 
                  initial={{ opacity: 0, scale: 0, rotate: -15, y: -20 }}
                  animate={{ 
                    opacity: 1, 
                    scale: 1, 
                    rotate: 0,
                    y: 0,
                    textShadow: [
                      "0 0 4px rgba(239, 68, 68, 0.4)",
                      "0 0 16px rgba(239, 68, 68, 0.8)",
                      "0 0 4px rgba(239, 68, 68, 0.4)"
                    ]
                  }}
                  transition={{ 
                    duration: 1.2,
                    type: "spring",
                    stiffness: 100,
                    delay: 0.5,
                    textShadow: {
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "easeInOut"
                    }
                  }}
                  className="text-xs md:text-sm font-mono text-red-500 font-extrabold tracking-normal normal-case select-none border border-red-500/30 px-2 py-0.5 rounded bg-red-950/20 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                >
                  Cool_85™
                </motion.span>
              </h1>
              <p className="text-zinc-500 font-mono text-[10px] tracking-widest uppercase mt-1">
                An Atmospheric Escape Experiment
              </p>

              {/* WARNING: FLASHING LIGHTS & JUMPSCARES */}
              <div className="w-full max-w-md bg-amber-950/15 border border-amber-900/40 rounded-xl p-3 text-left mt-4 font-mono text-[10.5px] text-amber-400/90 flex flex-col gap-1 shadow-sm">
                <span className="font-extrabold text-amber-500 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  ⚠️ SENSITIVITY & CONTENT WARNING
                </span>
                <p className="text-zinc-400 leading-relaxed text-[10px]">
                  This game features intense <span className="text-amber-400 font-bold">flashing lights</span>, rapid visual flickering, loud sudden sounds, and terrifying <span className="text-amber-400 font-bold">jumpscares</span>. Player discretion is advised for photosensitive or faint-hearted survivors.
                </p>
              </div>

              {introStep === 'DEVICE_SELECT' && (
                <motion.div
                  key="device-select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col items-center w-full mt-6"
                >
                  <p className="text-zinc-400 font-mono text-xs mb-6 max-w-sm">
                    Welcome, Survivor. Before stepping into the dark hotel corridors, choose your control method:
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mb-4">
                    <button
                      onClick={() => {
                        sound.playClick();
                        setSelectedDevice('COMPUTER');
                        setIntroStep('CONTROLS');
                      }}
                      className="flex-1 flex flex-col items-center gap-3 p-5 bg-zinc-950/50 hover:bg-zinc-800/80 border border-zinc-800 hover:border-red-500/50 rounded-xl transition-all cursor-pointer group"
                    >
                      <Laptop className="text-zinc-400 group-hover:text-red-500 group-hover:scale-110 transition-all" size={32} />
                      <div className="flex flex-col">
                        <span className="text-xs font-mono font-bold text-white uppercase">COMPUTER / PC</span>
                        <span className="text-[10px] font-mono text-zinc-500 mt-1">Keyboard & Hotkeys</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        sound.playClick();
                        setSelectedDevice('MOBILE');
                        setIntroStep('ORIGINAL');
                      }}
                      className="flex-1 flex flex-col items-center gap-3 p-5 bg-zinc-950/50 hover:bg-zinc-800/80 border border-zinc-800 hover:border-red-500/50 rounded-xl transition-all cursor-pointer group"
                    >
                      <Smartphone className="text-zinc-400 group-hover:text-red-500 group-hover:scale-110 transition-all" size={32} />
                      <div className="flex flex-col">
                        <span className="text-xs font-mono font-bold text-white uppercase">MOBILE / TOUCH</span>
                        <span className="text-[10px] font-mono text-zinc-500 mt-1">On-screen Touch Buttons</span>
                      </div>
                    </button>
                  </div>
                </motion.div>
              )}

              {introStep === 'CONTROLS' && (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col items-center w-full mt-6 animate-none"
                >
                  <span className="text-xs font-mono font-bold text-red-500 uppercase tracking-widest mb-3">💻 KEYBOARD CONTROLS</span>
                  <div className="w-full max-w-md bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 text-left font-mono text-[11px] text-zinc-300 flex flex-col gap-2 shadow-inner">
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
                      <span className="text-zinc-500">WALK LEFT / RIGHT</span>
                      <span className="text-white font-bold bg-zinc-800 px-1.5 py-0.5 rounded">[A] / [D] <span className="text-zinc-500 text-[9px] font-normal">or</span> [◀] [▶]</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
                      <span className="text-zinc-500">SPRINT (DRAINS STAMINA)</span>
                      <span className="text-white font-bold bg-zinc-800 px-1.5 py-0.5 rounded">[HOLD SHIFT]</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
                      <span className="text-zinc-500">INTERACT / SEARCH / HIDE</span>
                      <span className="text-white font-bold bg-zinc-800 px-1.5 py-0.5 rounded">[E] <span className="text-zinc-500 text-[9px] font-normal">or</span> CLICK</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
                      <span className="text-zinc-500">TOGGLE FLASHLIGHT</span>
                      <span className="text-white font-bold bg-zinc-800 px-1.5 py-0.5 rounded">[F]</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-1.5">
                      <span className="text-zinc-500">SELECT HOTBAR ITEM</span>
                      <span className="text-white font-bold bg-zinc-800 px-1.5 py-0.5 rounded">[1] [2] [3] [4]</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">USE SELECTED BANDAGE</span>
                      <span className="text-white font-bold bg-zinc-800 px-1.5 py-0.5 rounded">[Q]</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      sound.playClick();
                      setIntroStep('ORIGINAL');
                    }}
                    className="w-full max-w-xs mt-6 bg-zinc-800 hover:bg-zinc-700 text-white font-mono font-bold text-xs tracking-wider uppercase py-3 px-6 rounded-lg border border-zinc-700 hover:border-zinc-500 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    CONTINUE <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}

              {introStep === 'ORIGINAL' && (
                <motion.div
                  key="original"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col items-center w-full"
                >
                  {/* Lore / Elevator Mission Summary */}
                  <p className="text-zinc-400 font-mono text-xs mt-6 mb-4 leading-relaxed max-w-md">
                    You are trapped inside a dark, infinite hotel of <span className="text-white font-bold">100 Doors</span>. 
                    Locked doors require wire fuse bypass keys. But beware: when the lights flicker, 
                    a rushing horror will sweep the hallways. Hide in a closet or die.
                    Repower the final elevator at the end to escape the nightmare.
                  </p>

                  {/* Warning message inside the intro */}
                  <div className="w-full max-w-md bg-red-950/20 border border-red-900/40 rounded-xl p-3.5 text-left mb-6 font-mono text-[11px] text-red-400 flex flex-col gap-1 shadow-md">
                    <span className="font-extrabold text-red-500 flex items-center gap-1.5 uppercase tracking-wider text-xs">
                      ⚠️ TRICKSTER WARNING: "DUPE"
                    </span>
                    <p className="text-zinc-300 leading-relaxed text-[10.5px]">
                      A shape-shifting entity named <span className="text-red-400 font-bold">Dupe</span> may spawn duplicate doors. 
                      One of the doors has the WRONG door number. If you walk into a fake door, 
                      Dupe will jumpscare you, deal <span className="text-red-400 font-bold">-25 damage</span>, and push you back. 
                      Always keep track of your room index!
                    </p>
                  </div>

                  {/* Grid of Key mechanics */}
                  <div className="grid grid-cols-3 gap-3 w-full mb-6 max-w-md">
                    <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-lg flex flex-col items-center">
                      <Key className="text-yellow-500 mb-1" size={18} />
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">Solve Fuses</span>
                      <span className="text-[10px] font-mono text-white font-bold mt-0.5">5/5 Keys</span>
                    </div>
                    <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-lg flex flex-col items-center">
                      <ShieldAlert className="text-red-500 mb-1 animate-pulse" size={18} />
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">Hide Fast</span>
                      <span className="text-[10px] font-mono text-white font-bold mt-0.5">In Closets</span>
                    </div>
                    <div className="bg-zinc-950/60 border border-zinc-800 p-3 rounded-lg flex flex-col items-center">
                      <Zap className="text-green-500 mb-1" size={18} />
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">Repower Lift</span>
                      <span className="text-[10px] font-mono text-white font-bold mt-0.5">Door 100</span>
                    </div>
                  </div>

                  {/* Play Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startGame}
                    className="w-full max-w-sm bg-red-600 hover:bg-red-500 text-white font-mono font-bold tracking-widest uppercase py-4 px-6 rounded-lg border border-red-500 shadow-[0_4px_15px_rgba(239,68,68,0.25)] flex items-center justify-center gap-3 transition-colors cursor-pointer"
                  >
                    <Play size={16} fill="white" />
                    ENTER THE HOTELS
                  </motion.button>
                </motion.div>
              )}

              {/* Audio warning */}
              <div className="flex items-center gap-1.5 mt-4 text-[10px] font-mono text-zinc-500 uppercase">
                <Volume2 size={12} />
                Spooky synthetic audio effects active
              </div>
            </motion.div>
          )}

          {gameState === 'PLAYING' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <GameCanvas
                gameState={gameState}
                setGameState={setGameState}
                stats={stats}
                setStats={setStats}
                selectedDevice={selectedDevice}
                onGameOver={handleGameOver}
                onVictory={handleVictory}
              />
            </motion.div>
          )}

          {gameState === 'GAMEOVER' && (
            <motion.div
              key="gameover"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <GameOverScreen
                stats={stats}
                onRestart={restartGame}
              />
            </motion.div>
          )}

          {gameState === 'VICTORY' && (
            <motion.div
              key="victory"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <VictoryScreen
                stats={stats}
                onRestart={restartGame}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Humble, literal footer credit */}
      <footer className="relative z-10 py-6 text-center text-[9px] font-mono text-zinc-600 uppercase tracking-widest border-t border-zinc-900/40 select-none bg-zinc-950/20">
        DOORS 2D HORROR • PRESS KEYBOARD OR USE ON-SCREEN TOUCH ARROWS
      </footer>
    </div>
  );
}
