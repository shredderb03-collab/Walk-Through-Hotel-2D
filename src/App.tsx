/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Skull, Play, ShieldAlert, Key, Zap, Volume2, Gamepad2, Info, Laptop, Smartphone, ArrowRight, Lock, ArrowLeft, Music, Eye } from 'lucide-react';
import { GameState, GameStats } from './types';
import GameCanvas from './components/GameCanvas';
import GameOverScreen from './components/GameOverScreen';
import VictoryScreen from './components/VictoryScreen';
import { sound } from './utils/audio';
import HubBackground from './components/HubBackground';
import DoorsThumbnail from './components/DoorsThumbnail';
import TacticalGrid from './components/TacticalGrid';

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
  const [viewMode, setViewMode] = useState<'HUB' | 'INTRO' | 'GAME' | 'TACTICAL_GRID'>('HUB');
  const [gameState, setGameState] = useState<GameState>('START');
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [introStep, setIntroStep] = useState<'DEVICE_SELECT' | 'CONTROLS' | 'ORIGINAL'>('DEVICE_SELECT');
  const [selectedDevice, setSelectedDevice] = useState<'COMPUTER' | 'MOBILE'>('COMPUTER');

  // Intro Cinematic States
  const [introPercent, setIntroPercent] = useState(0);
  const [introText, setIntroText] = useState("INITIALIZING COMPILING ENGINE...");

  useEffect(() => {
    if (viewMode !== 'INTRO') return;
    
    setIntroPercent(0);
    setIntroText("INITIALIZING COMPILING ENGINE...");
    sound.playFlicker();

    const interval = setInterval(() => {
      setIntroPercent(prev => {
        const next = prev + 1;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setViewMode('GAME');
            setGameState('START');
            setIntroStep('DEVICE_SELECT');
          }, 350);
          return 100;
        }

        // Set descriptive messages along the way
        if (next < 25) {
          setIntroText("BOOTING CANVAS ENGINES...");
        } else if (next < 50) {
          setIntroText("COOL_85™ WATERMARK SECURED...");
        } else if (next < 75) {
          setIntroText("STABILIZING ENTITY_RUSH.AI...");
        } else if (next < 95) {
          setIntroText("CONNECTING AUDIO BUFFERS (Spear of Justice)...");
        } else {
          setIntroText("DOORS 2D PORTALS ALIGNED!");
        }

        return next;
      });
    }, 32); // ~3.2 seconds total duration

    return () => clearInterval(interval);
  }, [viewMode]);

  const skipIntro = () => {
    sound.playClick();
    setViewMode('GAME');
    setGameState('START');
    setIntroStep('DEVICE_SELECT');
  };

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
  };  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'INTRO' && e.key === 'Escape') {
        skipIntro();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between selection:bg-red-600/30 overflow-x-hidden relative">
      
      {/* Decorative top static effect or vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(24,24,27,0.8)_0%,rgba(9,9,11,1)_100%)] pointer-events-none z-0" />

      {/* Main App Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 max-w-4xl mx-auto w-full">
        
        <AnimatePresence mode="wait">
          {viewMode === 'HUB' && (
            <motion.div
              key="hub"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex flex-col items-center py-6 relative"
            >
              {/* Animated Background Canvas and Overlays */}
              <HubBackground />
              <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10 rounded-2xl">
                <div className="absolute inset-0 bg-radial-gradient from-emerald-500/5 via-transparent to-zinc-950" />
                <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:24px_24px]" />
              </div>

              {/* Title Section with Animated Cool_85™ */}
              <div className="text-center mb-10 select-none z-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1, duration: 0.8 }}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-950/30 border border-emerald-500/30 rounded-full mb-3 text-emerald-400 font-mono text-[10px] tracking-widest uppercase shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  CREATOR HUB ACTIVE
                </motion.div>

                <motion.h1
                  animate={{
                    textShadow: [
                      "0 0 5px rgba(16,185,129,0.2)",
                      "0 0 20px rgba(16,185,129,0.7)",
                      "0 0 5px rgba(16,185,129,0.2)"
                    ],
                    scale: [1, 1.02, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="text-4xl md:text-6xl font-mono text-white font-extrabold tracking-widest uppercase relative bg-clip-text select-none cursor-default"
                >
                  COOL_85<span className="text-emerald-500 font-black">™</span>
                </motion.h1>
                <p className="text-zinc-500 font-mono text-xs tracking-widest uppercase mt-2">
                  Official Games & Concept Portfolio
                </p>
              </div>

              {/* Games Category Container */}
              <div className="w-full max-w-3xl">
                <div className="flex items-center gap-2.5 mb-6 border-b border-zinc-800/80 pb-3">
                  <Gamepad2 className="text-emerald-500" size={20} />
                  <h2 className="text-sm font-mono text-zinc-300 font-bold uppercase tracking-widest">
                    Games Category
                  </h2>
                  <span className="ml-auto text-[10px] font-mono text-zinc-500 bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 rounded">
                    2 DEPLOYED
                  </span>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  
                  {/* GAME 1: DOORS 2D */}
                  <motion.div
                    whileHover={{ y: -4, borderColor: "rgba(16, 185, 129, 0.4)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-zinc-900/45 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-sm relative overflow-hidden group transition-all"
                  >
                    {/* Custom Animated Teaser Thumbnail */}
                    <DoorsThumbnail />

                    {/* Metadata & Description */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-lg font-mono font-extrabold text-white uppercase group-hover:text-emerald-400 transition-colors">
                          Doors 2D
                        </h3>
                        <span className="text-[9px] font-mono text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded bg-emerald-950/10">
                          Active
                        </span>
                      </div>
                      <p className="text-zinc-400 font-mono text-[11px] leading-relaxed mb-6">
                        Navigate a chilling, 2D scrolling hotel corridor of 100 doors. Wire circuit fuses, search retro drawers for keys, hide in dark closets, and survive the terrifying rush of monsters.
                      </p>
                    </div>

                    {/* Launch button */}
                    <button
                      onClick={() => {
                        sound.playClick();
                        setViewMode('INTRO');
                      }}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-zinc-950 font-mono font-bold text-xs tracking-wider uppercase py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_12px_rgba(16,185,129,0.15)] group-hover:shadow-[0_4px_20px_rgba(16,185,129,0.3)]"
                    >
                      <Play size={12} fill="black" />
                      Launch Doors 2D
                    </button>
                  </motion.div>

                  {/* GAME 2: TACTICAL GRID: OVERDRIVE ENGINE */}
                  <motion.div
                    whileHover={{ y: -4, borderColor: "rgba(6, 182, 212, 0.4)" }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="bg-zinc-900/45 border border-zinc-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-sm relative overflow-hidden group transition-all"
                  >
                    {/* Animated Teaser Thumbnail for Tactical Grid */}
                    <div className="relative w-full h-44 bg-slate-950 rounded-xl border border-zinc-800/80 overflow-hidden flex flex-col justify-between p-3.5 mb-4 group-hover:border-cyan-500/40 transition-colors select-none">
                      {/* Grid background lines */}
                      <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(0,243,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.2)_1px,transparent_1px)] bg-[size:16px_16px]" />
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)] pointer-events-none" />
                      
                      {/* Neon path illustration */}
                      <div className="absolute w-[180px] h-3 bg-zinc-800/40 rounded-full top-[60px] left-[-20px] -rotate-[15deg] border border-cyan-500/15" />
                      <div className="absolute w-[180px] h-3 bg-zinc-800/40 rounded-full top-[100px] left-[100px] rotate-[25deg] border border-cyan-500/15" />
                      
                      {/* Glowing entities representing creep/enemy and tower */}
                      <motion.div 
                        animate={{ x: [0, 150, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute w-4.5 h-4.5 bg-rose-500 rounded-full top-[42px] left-2 shadow-[0_0_12px_#f43f5e]"
                      />
                      <motion.div 
                        animate={{ x: [100, 240, 100] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "linear", delay: 1 }}
                        className="absolute w-4 h-4 bg-yellow-400 rounded-full top-[112px] left-2 shadow-[0_0_10px_#eab308]"
                      />

                      {/* Tower turret placement */}
                      <div className="absolute w-6.5 h-6.5 bg-zinc-900 border border-zinc-700 rounded-lg top-[75px] left-[90px] shadow-lg flex items-center justify-center">
                        <div className="w-2.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]" />
                        {/* laser beam firing */}
                        <motion.div 
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute h-0.5 w-[50px] bg-cyan-400 origin-left left-3 rotate-[120deg] shadow-[0_0_6px_#22d3ee]" 
                        />
                      </div>

                      {/* Watermark badge */}
                      <div className="ml-auto text-[8.5px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest relative z-10">
                        OVERDRIVE v2.0
                      </div>
                    </div>

                    {/* Metadata & Description */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-lg font-mono font-extrabold text-white uppercase group-hover:text-cyan-400 transition-colors">
                          Tactical Grid
                        </h3>
                        <span className="text-[9px] font-mono text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded bg-cyan-950/10">
                          Deployable
                        </span>
                      </div>
                      <p className="text-zinc-400 font-mono text-[11px] leading-relaxed mb-6">
                        An intense tactical grid tower defense game. Construct automated spike matrices, long-range snipers, mobile slimes, miniguns, and flamethrowers to survive increasingly fast waves of sectors.
                      </p>
                    </div>

                    {/* Launch button */}
                    <button
                      onClick={() => {
                        sound.playClick();
                        setViewMode('TACTICAL_GRID');
                      }}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-zinc-950 font-mono font-bold text-xs tracking-wider uppercase py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_4px_12px_rgba(6,182,212,0.15)] group-hover:shadow-[0_4px_20_rgba(6,182,212,0.3)]"
                    >
                      <Play size={12} fill="black" />
                      Launch Tactical Grid
                    </button>
                  </motion.div>

                </div>
              </div>

              {/* Developer Watermark Note */}
              <div className="mt-14 border border-zinc-800/50 rounded-xl py-3.5 px-6 bg-zinc-900/10 backdrop-blur-md flex flex-col gap-1.5 items-center select-none text-center">
                <span className="font-mono text-[9.5px] text-zinc-500 uppercase tracking-[0.2em] block">
                  DEVELOPED BY THE ONE AND ONLY • <span className="text-emerald-500 font-extrabold">COOL_85™</span>
                </span>
                <span className="font-mono text-[9.5px] text-zinc-400 uppercase tracking-[0.2em] block">
                  PRODUCED BY • <span className="text-emerald-400 font-extrabold tracking-[0.25em]">THEODORE PRODUCTIONS</span>
                </span>
              </div>
            </motion.div>
          )}

          {viewMode === 'INTRO' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-xl text-center flex flex-col items-center p-8 bg-black border border-zinc-900 rounded-2xl shadow-2xl relative overflow-hidden"
            >
              {/* Cinematic projector background scanlines */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_4px,3px_100%] pointer-events-none" />

              {/* Skip Intro button */}
              <button
                onClick={skipIntro}
                className="absolute top-4 right-4 text-[9px] font-mono text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-500 bg-zinc-950 px-2 py-1 rounded transition-all cursor-pointer uppercase z-30"
              >
                Skip Intro [ESC]
              </button>

              <div className="my-12 flex flex-col items-center select-none">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: [0, 1, 1, 0.8, 1] }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.4em] block mb-3 font-bold"
                >
                  A PRODUCTION BY
                </motion.span>

                {/* WATERMARK EMBLEM */}
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 80, delay: 0.3 }}
                  className="relative px-8 py-4 border-2 border-dashed border-emerald-500/20 rounded-xl bg-emerald-950/5 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                >
                  <motion.h2
                    animate={{
                      textShadow: [
                        "0 0 5px rgba(16,185,129,0.3)",
                        "0 0 25px rgba(16,185,129,0.85)",
                        "0 0 5px rgba(16,185,129,0.3)"
                      ],
                      scale: [1, 1.03, 1]
                    }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="text-3xl md:text-5xl font-mono text-white font-extrabold tracking-[0.3em] uppercase bg-clip-text bg-gradient-to-r from-emerald-400 via-white to-teal-400 select-none cursor-default"
                  >
                    COOL_85™
                  </motion.h2>
                  <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-emerald-500/60 rounded-full animate-ping" />
                </motion.div>

                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="text-[9px] font-mono text-emerald-400 uppercase tracking-[0.3em] block mt-4 font-bold"
                >
                  ★ WATERMARK CONFIRMED ★
                </motion.span>
              </div>

              {/* Interactive Loading Feed */}
              <div className="w-full max-w-sm flex flex-col gap-2 mt-4 text-left font-mono text-[10px]">
                <div className="flex justify-between text-zinc-500 border-b border-zinc-900 pb-1">
                  <span>SYSTEM FEED:</span>
                  <span className="text-emerald-500 animate-pulse">RUNNING</span>
                </div>
                
                <div className="text-zinc-400 flex items-center justify-between">
                  <span className="uppercase text-[9.5px] tracking-wider truncate mr-2">{introText}</span>
                  <span className="text-emerald-400 font-bold ml-auto shrink-0">{introPercent}%</span>
                </div>

                {/* Modern Progress Bar */}
                <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${introPercent}%` }}
                  />
                </div>
              </div>

              <div className="text-[9px] font-mono text-zinc-600 uppercase mt-8 select-none">
                LOADING SECURE SANDBOX ENVIRONMENTS
              </div>
            </motion.div>
          )}

          {viewMode === 'GAME' && gameState === 'START' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-xl text-center flex flex-col items-center p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl shadow-2xl backdrop-blur-md relative overflow-hidden"
            >
              {/* Back to Hub Button */}
              <button
                onClick={() => {
                  sound.playClick();
                  setViewMode('HUB');
                }}
                className="absolute top-4 left-4 flex items-center gap-1 text-[10px] font-mono text-zinc-500 hover:text-emerald-400 uppercase transition-all bg-zinc-950/50 border border-zinc-850 px-2 py-1 rounded cursor-pointer group z-20"
              >
                <ArrowLeft size={10} className="group-hover:-translate-x-0.5 transition-transform" />
                Return to Hub
              </button>

              {/* Caution stripe background headers */}
              <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-yellow-500 via-zinc-800 to-yellow-500 bg-[length:40px_100%] opacity-40" />

              {/* Creepy pulsating warning icon and Theodore Productions */}
              <div className="flex items-center gap-4 mb-6 mt-6 select-none">
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
                  className="flex flex-col items-center w-full mt-6"
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

          {viewMode === 'GAME' && gameState === 'PLAYING' && (
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

          {viewMode === 'GAME' && gameState === 'GAMEOVER' && (
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
              
              {/* Return to Hub trigger */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    sound.playClick();
                    setViewMode('HUB');
                  }}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white px-4 py-2 rounded font-mono text-xs uppercase cursor-pointer transition-all"
                >
                  ← Return to Cool_85™ Hub
                </button>
              </div>
            </motion.div>
          )}

          {viewMode === 'GAME' && gameState === 'VICTORY' && (
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

              {/* Return to Hub trigger */}
              <div className="mt-4 text-center">
                <button
                  onClick={() => {
                    sound.playClick();
                    setViewMode('HUB');
                  }}
                  className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white px-4 py-2 rounded font-mono text-xs uppercase cursor-pointer transition-all"
                >
                  ← Return to Cool_85™ Hub
                </button>
              </div>
            </motion.div>
          )}

          {viewMode === 'TACTICAL_GRID' && (
            <motion.div
              key="tactical_grid"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full flex-1 flex flex-col items-center"
            >
              <TacticalGrid onBack={() => setViewMode('HUB')} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Humble, literal footer credit */}
      <footer className="relative z-10 py-6 text-center text-[9px] font-mono text-zinc-600 uppercase tracking-widest border-t border-zinc-900/40 select-none bg-zinc-950/20">
        COOL_85™ PLATFORM • PRESS KEYBOARD OR USE ON-SCREEN TOUCH ARROWS
      </footer>
    </div>
  );
}
