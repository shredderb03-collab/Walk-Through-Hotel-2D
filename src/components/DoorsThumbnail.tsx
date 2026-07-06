import React, { useEffect, useState } from 'react';
import { Skull, Music, Eye } from 'lucide-react';
import { motion } from 'motion/react';

export default function DoorsThumbnail() {
  const [flicker, setFlicker] = useState(false);
  const [monsterVisible, setMonsterVisible] = useState(false);
  const [radioActive, setRadioActive] = useState(true);

  // Periodic visual events inside the thumbnail to make it "alive"
  useEffect(() => {
    // Flickering overhead lamp
    const flickerInterval = setInterval(() => {
      setFlicker(true);
      setTimeout(() => setFlicker(false), 80);
      if (Math.random() < 0.3) {
        setTimeout(() => {
          setFlicker(true);
          setTimeout(() => setFlicker(false), 120);
        }, 150);
      }
    }, 3000);

    // Periodic monster peak
    const monsterInterval = setInterval(() => {
      setMonsterVisible(true);
      setTimeout(() => setMonsterVisible(false), 1200);
    }, 7000);

    // Toggle radio notes pulse
    const radioInterval = setInterval(() => {
      setRadioActive(prev => !prev);
    }, 1800);

    return () => {
      clearInterval(flickerInterval);
      clearInterval(monsterInterval);
      clearInterval(radioInterval);
    };
  }, []);

  return (
    <div id="doors-animated-preview" className="relative w-full h-48 bg-zinc-950 rounded-xl border border-zinc-800/80 overflow-hidden flex items-center justify-center select-none shadow-2xl">
      {/* Dark Ambient Vignette and Gradients */}
      <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/40 to-black z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-zinc-950/40 to-transparent" />

      {/* Perspective Wall Lines (Retro 3D look) */}
      <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <line x1="0" y1="20" x2="160" y2="96" stroke="#4b5563" strokeWidth="1.5" />
        <line x1="0" y1="172" x2="160" y2="96" stroke="#4b5563" strokeWidth="1.5" />
        <line x1="400" y1="20" x2="240" y2="96" stroke="#4b5563" strokeWidth="1.5" />
        <line x1="400" y1="172" x2="240" y2="96" stroke="#4b5563" strokeWidth="1.5" />
        {/* Floor panel lines */}
        <line x1="160" y1="130" x2="0" y2="192" stroke="#1f2937" strokeWidth="1" />
        <line x1="200" y1="130" x2="200" y2="192" stroke="#1f2937" strokeWidth="1" />
        <line x1="240" y1="130" x2="400" y2="192" stroke="#1f2937" strokeWidth="1" />
      </svg>

      {/* Corridor Floor Shadow */}
      <div className="absolute bottom-0 inset-x-0 h-1/3 bg-gradient-to-t from-zinc-900 to-transparent opacity-80" />

      {/* OVERHEAD FLICKERING LAMP */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 flex flex-col items-center z-10">
        <div className="w-12 h-1 bg-zinc-700" />
        <div className="w-1 h-3 bg-zinc-600" />
        {/* Lamp bulb */}
        <div className={`w-3.5 h-3.5 rounded-full transition-all duration-75 ${
          flicker ? 'bg-zinc-800 shadow-none' : 'bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]'
        }`} />
        
        {/* Yellow ambient light cone casting downward */}
        <div className={`w-40 h-36 bg-gradient-to-b from-yellow-500/10 via-yellow-500/2 to-transparent rounded-b-full transform -translate-y-1 transition-opacity duration-75 pointer-events-none ${
          flicker ? 'opacity-0' : 'opacity-100'
        }`} />
      </div>

      {/* CREEPY BACKWALL DOOR 100 */}
      <div className="relative z-10 flex items-center justify-center gap-14">
        
        {/* Secondary Decorative Door (Left) */}
        <div className="w-8 h-24 bg-zinc-900/60 border border-zinc-800 rounded-sm opacity-40 transform -skew-y-3 flex flex-col items-center justify-between p-1.5">
          <div className="text-[7px] font-mono text-zinc-500">99</div>
          <div className="w-1 h-1.5 bg-yellow-600 rounded-full self-end mt-4" />
        </div>

        {/* MAIN DOOR 100 (Centerpiece) */}
        <div className="relative group/door">
          {/* Crimson glow from behind door cracks */}
          <div className="absolute -inset-1.5 bg-red-600/30 rounded-lg blur-md group-hover/door:bg-red-500/40 transition-all duration-300 animate-pulse" />
          
          <div className="w-14 h-28 bg-zinc-900 border-2 border-zinc-800 rounded-t-sm relative flex flex-col justify-between p-2 shadow-inner group-hover/door:border-red-500/50 transition-colors z-20">
            {/* Plaque 100 */}
            <div className="bg-zinc-950 border border-zinc-850 px-1 py-0.5 rounded text-[8px] font-mono text-amber-500/90 font-bold tracking-widest text-center self-center shadow">
              100
            </div>

            {/* Glowing skull emblem on mesh */}
            <div className="w-6 h-6 rounded-full bg-zinc-950 border border-red-500/30 flex items-center justify-center self-center my-1 shadow-[0_0_10px_rgba(239,68,68,0.1)] group-hover/door:shadow-[0_0_15px_rgba(239,68,68,0.4)] group-hover/door:border-red-500/60 transition-all">
              <Skull className="text-red-500 animate-pulse" size={10} />
            </div>

            {/* Brass Knob */}
            <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-yellow-500 to-amber-600 self-end mr-1 border border-amber-700 shadow" />
          </div>

          {/* MONSTER ENTITY PEEKING EYE EFFECT */}
          {monsterVisible && (
            <div className="absolute -right-2 top-10 flex items-center gap-1 z-30 animate-pulse">
              <div className="w-4 h-4 rounded-full bg-red-950/80 border border-red-500 flex items-center justify-center animate-bounce shadow-[0_0_12px_rgba(239,68,68,0.9)]">
                <Eye className="text-red-400" size={10} />
              </div>
            </div>
          )}
        </div>

        {/* Secondary Decorative Closet (Right) */}
        <div className="w-9 h-26 bg-zinc-900/50 border border-zinc-800 rounded-sm opacity-50 transform skew-y-3 flex flex-col justify-between p-1 shadow-md">
          <div className="flex justify-between w-full h-full border-r border-zinc-800/40">
            <div className="w-0.5 h-full bg-zinc-800" />
            {/* Louvres/slats on closet door */}
            <div className="flex flex-col gap-1.5 w-5 py-2">
              <div className="h-0.5 bg-zinc-800 w-full" />
              <div className="h-0.5 bg-zinc-800 w-full" />
              <div className="h-0.5 bg-zinc-800 w-full" />
              <div className="h-0.5 bg-zinc-800 w-full" />
              <div className="h-0.5 bg-zinc-800 w-full" />
            </div>
          </div>
        </div>

      </div>

      {/* LIVING ENTITIES & PARTICLES */}
      {/* Glowing musical waves (Vintage Radio Teaser) */}
      {radioActive && (
        <div className="absolute left-6 bottom-4 z-20 flex flex-col gap-0.5 items-center bg-zinc-950/90 border border-pink-500/20 px-1.5 py-1 rounded shadow-lg backdrop-blur-sm scale-90">
          <div className="flex items-center gap-1 font-mono text-[7.5px] text-pink-400 font-bold uppercase tracking-wider">
            <Music size={8} className="text-pink-400 animate-bounce" />
            <span>Radio Live</span>
          </div>
          {/* Animated sound equalizer bars */}
          <div className="flex items-end gap-0.5 h-4 w-12 justify-center mt-1">
            <div className="w-1 bg-pink-500 rounded-t animate-pulse h-1.5" style={{ animationDelay: '0.1s' }} />
            <div className="w-1 bg-pink-500 rounded-t animate-pulse h-3.5" style={{ animationDelay: '0.3s' }} />
            <div className="w-1 bg-pink-500 rounded-t animate-pulse h-2" style={{ animationDelay: '0.5s' }} />
            <div className="w-1 bg-pink-500 rounded-t animate-pulse h-4" style={{ animationDelay: '0.2s' }} />
            <div className="w-1 bg-pink-500 rounded-t animate-pulse h-1" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      )}

      {/* Creepy lurking shadows on the floor/background */}
      <div className={`absolute bottom-0 left-12 w-28 h-6 bg-red-950/20 rounded-full blur-md mix-blend-multiply pointer-events-none transition-all duration-1000 ${
        monsterVisible ? 'scale-x-150 opacity-100 translate-x-4 bg-red-900/30' : 'scale-x-100 opacity-20'
      }`} />

      {/* BADGES/LABELS */}
      <div className="absolute top-3 left-3 flex items-center gap-1 bg-zinc-950/90 border border-zinc-800/80 px-2 py-0.5 rounded text-[8.5px] font-mono text-zinc-400 uppercase tracking-widest z-20">
        <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
        Survival Horror
      </div>
      <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-zinc-950/95 border border-red-500/40 px-2 py-0.5 rounded text-[9px] font-mono text-red-500 uppercase tracking-widest font-black shadow z-20">
        <Skull size={9} className="animate-pulse text-red-500 mr-0.5" /> STAGE 100
      </div>
    </div>
  );
}
