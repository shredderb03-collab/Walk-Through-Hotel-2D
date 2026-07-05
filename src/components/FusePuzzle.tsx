/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, HelpCircle, RefreshCw, X, ShieldAlert } from 'lucide-react';
import { sound } from '../utils/audio';

interface FusePuzzleProps {
  onSolve: () => void;
  onClose: () => void;
  doorNumber: number;
  keysCount: number;
}

interface Socket {
  id: string;
  colorName: string;
  hex: string;
  side: 'left' | 'right';
  connectedTo: string | null; // ID of the other side connected
}

const COLOR_MAP: { [key: string]: string } = {
  Red: '#ef4444',
  Blue: '#3b82f6',
  Green: '#22c55e',
  Yellow: '#eab308',
};

export default function FusePuzzle({ onSolve, onClose, doorNumber, keysCount }: FusePuzzleProps) {
  const [leftSockets, setLeftSockets] = useState<Socket[]>([]);
  const [rightSockets, setRightSockets] = useState<Socket[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ id: string; x: number; y: number } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [solved, setSolved] = useState(false);
  const [errorFlash, setErrorFlash] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Initialize randomized left and right sockets
  useEffect(() => {
    const colors = ['Red', 'Blue', 'Green', 'Yellow'];
    
    // Left side: ordered or shuffled
    const left: Socket[] = colors.map((col, idx) => ({
      id: `left-${col.toLowerCase()}`,
      colorName: col,
      hex: COLOR_MAP[col],
      side: 'left',
      connectedTo: null,
    }));

    // Right side: shuffled
    const shuffledColors = [...colors].sort(() => Math.random() - 0.5);
    const right: Socket[] = shuffledColors.map((col, idx) => ({
      id: `right-${col.toLowerCase()}`,
      colorName: col,
      hex: COLOR_MAP[col],
      side: 'right',
      connectedTo: null,
    }));

    setLeftSockets(left);
    setRightSockets(right);
    sound.playFlicker();
  }, []);

  const handleSocketClick = (socket: Socket) => {
    if (solved) return;
    sound.playClick();

    if (socket.side === 'left') {
      if (selectedLeft === socket.id) {
        setSelectedLeft(null);
      } else {
        setSelectedLeft(socket.id);
      }
    } else {
      // Right socket clicked
      if (selectedLeft) {
        const leftSock = leftSockets.find(s => s.id === selectedLeft);
        if (leftSock) {
          // If colors match, connect them!
          if (leftSock.colorName === socket.colorName) {
            connectSockets(leftSock.id, socket.id);
          } else {
            // Trigger failure animation
            sound.playFlicker();
            setErrorFlash(true);
            setTimeout(() => setErrorFlash(false), 500);
            setSelectedLeft(null);
          }
        }
      }
    }
  };

  const connectSockets = (leftId: string, rightId: string) => {
    // Check if rightId is already connected, if so, clear its connection
    let updatedLeft = leftSockets.map(s => {
      if (s.id === leftId) return { ...s, connectedTo: rightId };
      if (s.connectedTo === rightId) return { ...s, connectedTo: null }; // break previous
      return s;
    });

    let updatedRight = rightSockets.map(s => {
      if (s.id === rightId) return { ...s, connectedTo: leftId };
      const leftCorr = leftSockets.find(ls => ls.id === leftId);
      // break previous of whatever leftSock was connected to
      if (leftCorr && s.connectedTo === leftId) return { ...s, connectedTo: null };
      return s;
    });

    setLeftSockets(updatedLeft);
    setRightSockets(updatedRight);
    setSelectedLeft(null);

    // Play connecting spark sound
    sound.playUnlock();

    // Check if fully solved
    const allConnected = updatedLeft.every(s => s.connectedTo !== null);
    if (allConnected) {
      setSolved(true);
      sound.playKey();
      setTimeout(() => {
        onSolve();
      }, 1200);
    }
  };

  const getSocketCoordinates = (id: string) => {
    const el = document.getElementById(id);
    const container = boardRef.current;
    if (el && container) {
      const rect = el.getBoundingClientRect();
      const parentRect = container.getBoundingClientRect();
      return {
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top + rect.height / 2,
      };
    }
    return { x: 0, y: 0 };
  };

  // Drag handlers for mouse & touch
  const handleMouseDown = (socket: Socket, e: React.MouseEvent) => {
    if (solved || socket.side !== 'left') return;
    const coords = getSocketCoordinates(socket.id);
    setDragStart({ id: socket.id, x: coords.x, y: coords.y });
    setSelectedLeft(socket.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!dragStart) return;
    // Check if let go over a right socket
    const element = document.elementFromPoint(e.clientX, e.clientY);
    if (element) {
      const socketId = element.getAttribute('data-socket-id');
      if (socketId && socketId.startsWith('right-')) {
        const rightSock = rightSockets.find(s => s.id === socketId);
        const leftSock = leftSockets.find(s => s.id === dragStart.id);
        if (rightSock && leftSock) {
          if (leftSock.colorName === rightSock.colorName) {
            connectSockets(leftSock.id, rightSock.id);
          } else {
            sound.playFlicker();
            setErrorFlash(true);
            setTimeout(() => setErrorFlash(false), 500);
          }
        }
      }
    }
    setDragStart(null);
    setSelectedLeft(null);
  };

  // Touch support
  const handleTouchStart = (socket: Socket, e: React.TouchEvent) => {
    if (solved || socket.side !== 'left') return;
    const coords = getSocketCoordinates(socket.id);
    setDragStart({ id: socket.id, x: coords.x, y: coords.y });
    setSelectedLeft(socket.id);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragStart || !boardRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    setMousePos({
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!dragStart) return;
    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      const socketId = element.getAttribute('data-socket-id');
      if (socketId && socketId.startsWith('right-')) {
        const rightSock = rightSockets.find(s => s.id === socketId);
        const leftSock = leftSockets.find(s => s.id === dragStart.id);
        if (rightSock && leftSock) {
          if (leftSock.colorName === rightSock.colorName) {
            connectSockets(leftSock.id, rightSock.id);
          } else {
            sound.playFlicker();
            setErrorFlash(true);
            setTimeout(() => setErrorFlash(false), 500);
          }
        }
      }
    }
    setDragStart(null);
    setSelectedLeft(null);
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`relative w-full max-w-xl aspect-[4/3] bg-zinc-900 border-4 ${
          errorFlash ? 'border-red-600 bg-red-950/20' : 'border-zinc-700'
        } rounded-xl shadow-2xl p-6 flex flex-col justify-between overflow-hidden transition-all duration-300`}
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Metal hazard stripes top and bottom */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-yellow-500 via-zinc-800 to-yellow-500 bg-[length:40px_100%] opacity-80" />
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-r from-yellow-500 via-zinc-800 to-yellow-500 bg-[length:40px_100%] opacity-80" />

        {/* Screws on metal box */}
        <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-zinc-600 border border-zinc-500 shadow-inner flex items-center justify-center"><div className="w-3 h-0.5 bg-zinc-800 rotate-45" /></div>
        <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-zinc-600 border border-zinc-500 shadow-inner flex items-center justify-center"><div className="w-3 h-0.5 bg-zinc-800 -rotate-12" /></div>
        <div className="absolute bottom-4 left-4 w-4 h-4 rounded-full bg-zinc-600 border border-zinc-500 shadow-inner flex items-center justify-center"><div className="w-3 h-0.5 bg-zinc-800 120deg" /></div>
        <div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-zinc-600 border border-zinc-500 shadow-inner flex items-center justify-center"><div className="w-3 h-0.5 bg-zinc-800 -rotate-45" /></div>

        {/* Header */}
        <div className="flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-yellow-500 animate-pulse" size={24} />
            <div>
              <h2 className="text-yellow-500 font-mono text-lg font-bold tracking-wider">
                FUSE BOX SYSTEM
              </h2>
              <p className="text-zinc-400 font-mono text-xs">
                DOOR {doorNumber} LOCK BYPASS • KEY {keysCount + 1}/5
              </p>
            </div>
          </div>
          {!solved && (
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Puzzle Board */}
        <div 
          ref={boardRef}
          className="relative flex-1 my-6 grid grid-cols-5 items-center justify-center rounded bg-zinc-950 border border-zinc-800 p-4"
        >
          
          {/* SVG Overlay for Cables */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {/* Draw active/dragged wire */}
            {dragStart && (
              <path
                d={`M ${dragStart.x} ${dragStart.y} C ${(dragStart.x + mousePos.x) / 2} ${dragStart.y}, ${(dragStart.x + mousePos.x) / 2} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
                fill="none"
                stroke={leftSockets.find(s => s.id === dragStart.id)?.hex || '#ffffff'}
                strokeWidth="5"
                strokeLinecap="round"
                className="opacity-90 animate-pulse"
              />
            )}

            {/* Draw established wires */}
            {leftSockets.map(left => {
              if (!left.connectedTo) return null;
              const start = getSocketCoordinates(left.id);
              const end = getSocketCoordinates(left.connectedTo);
              return (
                <path
                  key={`cable-${left.id}`}
                  d={`M ${start.x} ${start.y} C ${(start.x + end.x) / 2} ${start.y}, ${(start.x + end.x) / 2} ${end.y}, ${end.x} ${end.y}`}
                  fill="none"
                  stroke={left.hex}
                  strokeWidth="6"
                  strokeLinecap="round"
                  className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                />
              );
            })}
          </svg>

          {/* Left Sockets Column */}
          <div className="col-span-1 flex flex-col justify-around h-full z-10 gap-2">
            {leftSockets.map(socket => {
              const isSelected = selectedLeft === socket.id;
              const isConnected = socket.connectedTo !== null;
              return (
                <div key={socket.id} className="flex flex-col items-center">
                  <div
                    id={socket.id}
                    data-socket-id={socket.id}
                    onClick={() => handleSocketClick(socket)}
                    onMouseDown={(e) => handleMouseDown(socket, e)}
                    onTouchStart={(e) => handleTouchStart(socket, e)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border-4 transition-all duration-200 shadow-lg ${
                      isConnected
                        ? 'border-zinc-800 bg-zinc-900'
                        : isSelected
                        ? 'border-white scale-110 shadow-white/20'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'
                    }`}
                    style={{ touchAction: 'none' }}
                  >
                    <div
                      className={`w-4 h-4 rounded-full transition-all duration-200 pointer-events-none ${
                        isConnected ? 'scale-75 opacity-40' : 'animate-pulse'
                      }`}
                      style={{ backgroundColor: socket.hex }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">
                    {socket.colorName}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Middle schematic diagram decorations */}
          <div className="col-span-3 flex flex-col justify-center items-center pointer-events-none opacity-20 font-mono text-zinc-600 text-[10px] select-none gap-4">
            <div className="border border-dashed border-zinc-700 p-2 text-center rounded w-full">
              ⚡ FUSE CONNECTOR BAY ⚡
              <br />
              MATCH COLOR SIGNAL TERMINALS
            </div>
            <div className="flex gap-4">
              <div className="text-right">INPUT [V+]<br />L1-L4 PRIMARY</div>
              <div className="text-left">LOAD [Ω]<br />R1-R4 FEED</div>
            </div>
          </div>

          {/* Right Sockets Column */}
          <div className="col-span-1 flex flex-col justify-around h-full z-10 gap-2">
            {rightSockets.map(socket => {
              const isConnected = socket.connectedTo !== null;
              return (
                <div key={socket.id} className="flex flex-col items-center">
                  <div
                    id={socket.id}
                    data-socket-id={socket.id}
                    onClick={() => handleSocketClick(socket)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer border-4 transition-all duration-200 shadow-lg ${
                      isConnected
                        ? 'border-zinc-800 bg-zinc-900'
                        : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'
                    }`}
                    data-socket-target="true"
                  >
                    <div
                      className={`w-4 h-4 rounded-full transition-all duration-200 pointer-events-none ${
                        isConnected ? 'scale-75 opacity-40' : 'opacity-80'
                      }`}
                      style={{ backgroundColor: socket.hex }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">
                    LOAD {socket.colorName[0]}
                  </span>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer / Status */}
        <div className="flex justify-between items-center bg-zinc-950 p-3 rounded border border-zinc-800 z-10">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${solved ? 'bg-green-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} />
            <span className="text-xs font-mono text-zinc-400">
              STATUS: {solved ? 'CIRCUIT COMPLETE' : 'AWAITING STABILIZATION'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-zinc-600 uppercase">
            {solved ? 'KEY GRANTED' : 'DRAG OR TAP TO CONNECT MATCHING COLORS'}
          </span>
        </div>

        {/* Success Splash */}
        <AnimatePresence>
          {solved && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center z-30"
            >
              <motion.div
                initial={{ scale: 0.5, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                className="flex flex-col items-center gap-4 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-yellow-500/10 border-2 border-yellow-500 flex items-center justify-center animate-bounce">
                  <Sparkles className="text-yellow-500" size={32} />
                </div>
                <div>
                  <h3 className="text-green-500 font-mono font-bold text-xl tracking-widest">
                    PUZZLE SOLVED!
                  </h3>
                  <p className="text-zinc-300 font-mono text-sm mt-1">
                    Circuit Restored & Key Obtained!
                  </p>
                  <p className="text-yellow-500 font-mono text-lg font-bold mt-2">
                    🔑 KEYS: {keysCount + 1}/5
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
