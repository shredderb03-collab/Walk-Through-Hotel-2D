/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Trophy, RefreshCw, Star, Clock, DoorOpen, Calendar, HelpCircle } from 'lucide-react';
import { GameStats } from '../types';
import { sound } from '../utils/audio';

interface VictoryScreenProps {
  stats: GameStats;
  onRestart: () => void;
}

export default function VictoryScreen({ stats, onRestart }: VictoryScreenProps) {
  React.useEffect(() => {
    sound.playVictory();
  }, []);

  const timeElapsedStr = (() => {
    const elapsed = Math.max(0, (stats.timeEnded || Date.now()) - stats.timeStarted);
    const secs = Math.floor(elapsed / 1000) % 60;
    const mins = Math.floor(elapsed / 60000);
    return `${mins}m ${secs}s`;
  })();

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-50 p-6 overflow-hidden select-none">
      
      {/* Radiant particle grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.15)_0%,rgba(0,0,0,1)_100%)] z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none z-10 opacity-30" />

      {/* Main container with gorgeous animations */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-20 flex flex-col items-center max-w-md w-full text-center"
      >
        {/* Glowing Trophy Ring */}
        <motion.div
          animate={{ 
            scale: [1, 1.08, 1],
            boxShadow: [
              '0 0 20px rgba(16,185,129,0.2)',
              '0 0 40px rgba(16,185,129,0.5)',
              '0 0 20px rgba(16,185,129,0.2)'
            ]
          }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="w-24 h-24 rounded-full bg-emerald-950/20 border-2 border-emerald-500 flex items-center justify-center mb-6"
        >
          <Trophy className="text-emerald-400 animate-pulse" size={44} />
        </motion.div>

        {/* Victory Titles */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-mono text-emerald-400 font-extrabold tracking-widest uppercase mb-1"
        >
          YOU ESCAPED!
        </motion.h1>
        <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase mb-8">
          You survived all 100 doors & repaired the power
        </p>

        {/* Stats Grid */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="w-full bg-zinc-900/90 border border-emerald-950 rounded-lg p-6 mb-8 flex flex-col gap-4 shadow-2xl backdrop-blur-md"
        >
          <div className="border-b border-emerald-950/50 pb-3 mb-1 flex items-center justify-center gap-2">
            <Star className="text-emerald-400 w-4 h-4" />
            <span className="text-zinc-400 font-mono text-xs uppercase tracking-wider font-semibold">
              RUN STATISTICAL SUMMATION
            </span>
            <Star className="text-emerald-400 w-4 h-4" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-950/50 border border-zinc-800 p-3 rounded flex flex-col items-center">
              <DoorOpen className="text-emerald-500 mb-1" size={20} />
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Doors Cleared</span>
              <span className="text-white font-mono font-bold text-lg mt-1">100 / 100</span>
            </div>

            <div className="bg-zinc-950/50 border border-zinc-800 p-3 rounded flex flex-col items-center">
              <Clock className="text-emerald-500 mb-1" size={20} />
              <span className="text-[10px] font-mono text-zinc-500 uppercase">Time Spent</span>
              <span className="text-white font-mono font-bold text-lg mt-1">{timeElapsedStr}</span>
            </div>

            <div className="bg-zinc-950/50 border border-zinc-800 p-3 rounded flex flex-col items-center">
              <span className="text-emerald-500 font-mono font-bold text-lg">✔</span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase mt-1">Puzzles Solved</span>
              <span className="text-white font-mono font-bold text-lg mt-0.5">{stats.puzzlesSolved}</span>
            </div>

            <div className="bg-zinc-950/50 border border-zinc-800 p-3 rounded flex flex-col items-center">
              <span className="text-emerald-500 font-mono font-bold text-lg">🛡</span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase mt-1">Times Hidden</span>
              <span className="text-white font-mono font-bold text-lg mt-0.5">{stats.timesHidden}</span>
            </div>

            <div className="bg-zinc-950/50 border border-zinc-800 p-3 rounded flex flex-col items-center col-span-2">
              <span className="text-yellow-500 font-mono font-bold text-lg">🪙 {stats.coins || 0}</span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase mt-1">Coins Amassed</span>
            </div>
          </div>
        </motion.div>

        {/* Narrative closure */}
        <p className="text-zinc-400 font-mono text-xs italic mb-8 max-w-sm">
          "The elevator moves slowly upwards. Below, the terrifying noises of the hotel corridor fade into darkness. You are safe. For now."
        </p>

        {/* Play Again Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            sound.playClick();
            onRestart();
          }}
          className="w-full max-w-xs bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold tracking-widest uppercase py-4 px-6 rounded border-2 border-emerald-500 hover:border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3 transition-colors cursor-pointer"
        >
          <RefreshCw size={18} />
          RESTART GAME
        </motion.button>
      </motion.div>

      {/* Watermark bottom */}
      <div className="absolute bottom-4 left-4 right-4 text-center text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
        EXPERIMENT RESULT: SURVIVED • FACILITY OUTFLOW ARCHIVE
      </div>
    </div>
  );
}
