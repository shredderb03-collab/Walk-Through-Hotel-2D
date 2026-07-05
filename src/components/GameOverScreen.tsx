/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Skull, RefreshCw, Trophy, Calendar, Eye, Activity } from 'lucide-react';
import { GameStats } from '../types';
import { sound } from '../utils/audio';

interface GameOverScreenProps {
  stats: GameStats;
  onRestart: () => void;
}

export default function GameOverScreen({ stats, onRestart }: GameOverScreenProps) {
  React.useEffect(() => {
    sound.playDeath();
  }, []);

  const timeElapsedStr = (() => {
    const elapsed = Math.max(0, (stats.timeEnded || Date.now()) - stats.timeStarted);
    const secs = Math.floor(elapsed / 1000) % 60;
    const mins = Math.floor(elapsed / 60000);
    return `${mins}m ${secs}s`;
  })();

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col items-center justify-center z-50 p-6 overflow-hidden select-none">
      
      {/* Horrific static glitch overlay background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(60,10,10,0.4)_0%,rgba(0,0,0,1)_100%)] z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%] pointer-events-none opacity-40 z-10" />

      {/* Creepy pulsating red eye particles or vignette */}
      <motion.div 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        className="absolute inset-0 border-[30px] border-red-950/20 pointer-events-none z-10 rounded-lg"
      />

      {/* Main Container */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="relative z-20 flex flex-col items-center max-w-md w-full text-center"
      >
        {/* Animated Skull Logo */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 0.98, 1.05, 1],
            rotate: [0, -2, 2, -1, 0]
          }}
          transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          className="w-24 h-24 rounded-full bg-red-950/20 border-2 border-red-600 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)] mb-6"
        >
          <Skull className="text-red-500 animate-pulse" size={48} />
        </motion.div>

        {/* Text Details */}
        <h1 className="text-4xl md:text-5xl font-mono text-red-600 font-extrabold tracking-widest uppercase mb-1 drop-shadow-[0_4px_8px_rgba(0,0,0,1)]">
          YOU DIED
        </h1>
        <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase mb-8">
          The monster caught you in the dark
        </p>

        {/* Stats Board */}
        <div className="w-full bg-zinc-900/80 border border-red-950 rounded-lg p-5 mb-8 flex flex-col gap-3 shadow-2xl backdrop-blur-sm">
          <div className="border-b border-red-950/50 pb-2 mb-1 flex items-center justify-center gap-2">
            <Activity className="text-red-500 w-4 h-4 animate-pulse" />
            <span className="text-zinc-400 font-mono text-[10px] uppercase tracking-wider font-semibold">
              VICTIM BIO-TELEMETRY
            </span>
          </div>

          <div className="flex justify-between items-center text-sm font-mono border-b border-zinc-800/40 pb-2">
            <span className="text-zinc-500 uppercase">Cause of Demise:</span>
            <span className="text-red-500 font-bold uppercase">{stats.diedTo || 'RUSH'}</span>
          </div>

          <div className="flex justify-between items-center text-sm font-mono border-b border-zinc-800/40 pb-2">
            <span className="text-zinc-500 uppercase">Furthest Door:</span>
            <span className="text-white font-bold text-base">Door {stats.doorsOpened}</span>
          </div>

          <div className="flex justify-between items-center text-sm font-mono border-b border-zinc-800/40 pb-2">
            <span className="text-zinc-500 uppercase">Hiding Places Used:</span>
            <span className="text-zinc-300 font-bold">{stats.timesHidden} times</span>
          </div>

          <div className="flex justify-between items-center text-sm font-mono border-b border-zinc-800/40 pb-2">
            <span className="text-zinc-500 uppercase">Puzzles Solved:</span>
            <span className="text-zinc-300 font-bold">{stats.puzzlesSolved}</span>
          </div>

          <div className="flex justify-between items-center text-sm font-mono border-b border-zinc-800/40 pb-2">
            <span className="text-zinc-500 uppercase">Coins Collected:</span>
            <span className="text-yellow-500 font-bold flex items-center gap-1">🪙 {stats.coins || 0}</span>
          </div>

          <div className="flex justify-between items-center text-sm font-mono">
            <span className="text-zinc-500 uppercase">Time Survived:</span>
            <span className="text-zinc-300 font-bold">{timeElapsedStr}</span>
          </div>
        </div>

        {/* Tip / Warning */}
        <p className="text-zinc-400 font-mono text-xs italic mb-8 max-w-sm">
          {stats.diedTo === 'DUPE (FAKE DOOR)' 
            ? '"Always remember your room index. If there are duplicate doors, check which door has the correct sequence number. Dupe cannot copy the correct sequence."'
            : '"When the ceiling lights flicker, drop whatever you are doing and hide in a closet immediately. Do not stay outside."'}
        </p>

        {/* Restart Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            sound.playClick();
            onRestart();
          }}
          className="w-full max-w-xs bg-red-600 hover:bg-red-500 text-white font-mono font-bold tracking-widest uppercase py-4 px-6 rounded border-2 border-red-500 hover:border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.4)] flex items-center justify-center gap-3 transition-colors cursor-pointer"
        >
          <RefreshCw size={18} className="animate-spin-slow" />
          REPLAY THE NIGHTMARE
        </motion.button>
      </motion.div>

      {/* Creepy watermark bottom */}
      <div className="absolute bottom-4 left-4 right-4 text-center text-[9px] font-mono text-zinc-700 uppercase tracking-widest">
        SYSTEM CLASSIFIED • SUBJECT ENCOUNTER RECON
      </div>
    </div>
  );
}
