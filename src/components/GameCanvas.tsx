/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Key, 
  DoorOpen, 
  ShieldAlert, 
  ArrowLeft, 
  ArrowRight, 
  Power, 
  HelpCircle, 
  Search, 
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Heart,
  Zap,
  ShoppingBag,
  Coins,
  Music,
  Plus,
  Lock,
  ChevronDown
} from 'lucide-react';
import { GameStats, GameState, InventoryItem, ItemType } from '../types';
import FusePuzzle from './FusePuzzle';
import SwitchPuzzle from './SwitchPuzzle';
import { sound } from '../utils/audio';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  stats: GameStats;
  setStats: React.Dispatch<React.SetStateAction<GameStats>>;
  selectedDevice?: 'COMPUTER' | 'MOBILE';
  onGameOver: (diedTo: string) => void;
  onVictory: () => void;
}

export default function GameCanvas({
  gameState,
  setGameState,
  stats,
  setStats,
  selectedDevice = 'COMPUTER',
  onGameOver,
  onVictory,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const coinCounterRef = useRef<HTMLDivElement>(null);

  // Core Game State
  const [currentDoor, setCurrentDoor] = useState(1);
  const [playerPosition, setPlayerPosition] = useState(150); // 100 to 800
  const [playerFacing, setPlayerFacing] = useState<'left' | 'right'>('right');
  const [isHiding, setIsHiding] = useState(false);
  const [keysCollected, setKeysCollected] = useState(0);

  // Health and Stamina (Stamina drains while sprinting, health drains from monster hit)
  const [health, setHealth] = useState(100);
  const [stamina, setStamina] = useState(100);
  const [isSprinting, setIsSprinting] = useState(false);

  // Coins State (top-right HUD, shop buying currency)
  const [coins, setCoins] = useState(0);
  const [displayedCoins, setDisplayedCoins] = useState(0);
  const [flyingCoins, setFlyingCoins] = useState<{ id: number; startX: number; startY: number; targetX: number; targetY: number; delay: number }[]>([]);
  const flyingCoinIdRef = useRef(0);

  const triggerCoinAnimation = (amount: number, canvasX: number) => {
    const particleCount = Math.min(10, Math.max(4, Math.floor(amount / 2)));
    
    // Default safe fallbacks
    let startX = 200;
    let startY = 260;
    let targetX = 650;
    let targetY = 22;

    if (canvasRef.current && outerRef.current && coinCounterRef.current) {
      try {
        const outerRect = outerRef.current.getBoundingClientRect();
        const canvasRect = canvasRef.current.getBoundingClientRect();
        const coinCounterRect = coinCounterRef.current.getBoundingClientRect();

        const canvasLeft = canvasRect.left - outerRect.left;
        const canvasTop = canvasRect.top - outerRect.top;

        startX = canvasLeft + (canvasX / 900) * canvasRect.width;
        // y=260 on 400px base height canvas is where drawers/player torso are
        startY = canvasTop + (260 / 400) * canvasRect.height;

        targetX = coinCounterRect.left - outerRect.left + coinCounterRect.width / 2;
        targetY = coinCounterRect.top - outerRect.top + coinCounterRect.height / 2;
      } catch (e) {
        console.warn("Could not calculate coin animation positions, using fallbacks:", e);
      }
    }

    const newCoins = Array.from({ length: particleCount }).map((_, i) => {
      flyingCoinIdRef.current += 1;
      return {
        id: flyingCoinIdRef.current,
        startX,
        startY,
        targetX,
        targetY,
        delay: i * 0.08,
      };
    });

    setFlyingCoins(prev => [...prev, ...newCoins]);
  };

  // Hotbar & Selected Item index
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);

  // Drawers in the current room
  const [drawers, setDrawers] = useState<{ x: number; searched: boolean; hasKey?: boolean; hasCode?: boolean }[]>([]);

  // Shop state at Door 40
  const [showShop, setShowShop] = useState(false);

  // Floating text array ref for high-performance canvas text rendering (particles)
  const floatingTextsRef = useRef<{ x: number; y: number; text: string; color: string; life: number }[]>([]);

  // Flashlight toggle & battery
  const [flashlightOn, setFlashlightOn] = useState(true);
  const [flashlightBattery, setFlashlightBattery] = useState(100);

  // Door 100 Special States
  const [hasNewSwitch, setHasNewSwitch] = useState(false);
  const [switchRepaired, setSwitchRepaired] = useState(false);
  const [elevatorOpened, setElevatorOpened] = useState(false);

  // Puzzle overlays
  const [showFusePuzzle, setShowFusePuzzle] = useState(false);
  const [showSwitchPuzzle, setShowSwitchPuzzle] = useState(false);

  // Level elements (Closet position, locked door state, flickering)
  const [closetX, setClosetX] = useState<number[]>([450]);
  const [isDoorLocked, setIsDoorLocked] = useState(false);
  const [isRoomKeyLocked, setIsRoomKeyLocked] = useState(false);
  const [hasRoomKey, setHasRoomKey] = useState(false);
  const [isFlickering, setIsFlickering] = useState(false);
  const [roomDarkened, setRoomDarkened] = useState(false);

  // Side Room (Grey Door with Green Stripe) States
  const [hasSideRoom, setHasSideRoom] = useState(false);
  const [sideRoomDoorX, setSideRoomDoorX] = useState<number | null>(null);
  const [inSideRoom, setInSideRoom] = useState(false);
  const [sideRoomCode, setSideRoomCode] = useState(() => {
    return [
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10),
      Math.floor(Math.random() * 10)
    ].join('');
  });
  const [sideRoomCodeFound, setSideRoomCodeFound] = useState(false);
  const [sideRoomChestUnlocked, setSideRoomChestUnlocked] = useState(false);
  const [showChestLockPuzzle, setShowChestLockPuzzle] = useState(false);
  const [digit1, setDigit1] = useState(0);
  const [digit2, setDigit2] = useState(0);
  const [digit3, setDigit3] = useState(0);
  const [chestErrorFlash, setChestErrorFlash] = useState(false);

  // Amazon Box States
  interface AmazonBox {
    id: string;
    x: number;
    y: number;
    targetY: number;
    vy: number;
    scaleX: number;
    scaleY: number;
    itemType: ItemType;
    itemLabel: string;
    itemDescription: string;
    isOpening: boolean;
    isOpened: boolean;
    openProgress: number;
    door: number;
    beamAlpha?: number;
    awarded?: boolean;
  }
  const [amazonBoxes, setAmazonBoxes] = useState<AmazonBox[]>([]);

  // Drone Delivery States
  interface DroneDelivery {
    id: string;
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    state: 'FLYING_IN' | 'HOVERING' | 'DROPPING' | 'FLYING_AWAY';
    itemType: ItemType;
    itemLabel: string;
    itemDescription: string;
    boxId: string;
    timer: number;
  }
  const [drones, setDrones] = useState<DroneDelivery[]>([]);
  const pendingOrdersRef = useRef<Array<{ id: string; type: ItemType; label: string; desc: string }>>([]);
  const awardedBoxIdsRef = useRef<Set<string>>(new Set());

  // iPad States
  const [showIpad, setShowIpad] = useState(false);
  const [ipadActiveApp, setIpadActiveApp] = useState<'HOME' | 'SHOP'>('HOME');
  const [ipadRestockTimer, setIpadRestockTimer] = useState(85);
  const [ipadItems, setIpadItems] = useState<{
    id: string;
    name: string;
    price: number;
    description: string;
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
    available: boolean;
    stock: number;
  }[]>([]);

  // Function to restock iPad items
  const restockIpadItems = () => {
    const hasLuck = luckPotionTimerRef.current > 0;
    const luckMultiplier = hasLuck ? 1.3 : 1.0;

    const items = [
      { id: 'bandage', name: 'Survival Bandage', price: 40, description: 'Heals 40 Health. Press Q to use.', rarity: 'Common', chance: 0.9, minStock: 1, maxStock: 4 },
      { id: 'lockpick', name: 'Lockpick', price: 65, description: 'Instantly unlocks locked doors.', rarity: 'Uncommon', chance: 0.6, minStock: 1, maxStock: 2 },
      { id: 'cola', name: 'Speed Cola', price: 45, description: 'Speed & infinite stamina for 11s.', rarity: 'Rare', chance: 0.45 * luckMultiplier, minStock: 1, maxStock: 1 },
      { id: 'crucifix', name: 'Holy Crucifix', price: 150, description: 'Banish Rush. Equip to protect.', rarity: 'Legendary', chance: 0.20 * luckMultiplier, minStock: 1, maxStock: 1 },
      { id: 'radio', name: 'Vintage Radio', price: 100, description: 'Plays electronic tunes when held.', rarity: 'Rare', chance: 0.40 * luckMultiplier, minStock: 1, maxStock: 1 },
      { id: 'battery', name: 'Battery Refill', price: 25, description: 'Recharges flashlight battery to 100%.', rarity: 'Common', chance: 0.85, minStock: 1, maxStock: 3 },
      { id: 'luck_potion', name: 'Luck Potion', price: 60, description: 'Boosts rare drops/stock by +30% for 44s.', rarity: 'Rare', chance: 0.50 * luckMultiplier, minStock: 1, maxStock: 2 }
    ];

    const generated = items.map(item => {
      const chance = Math.min(1.0, item.chance);
      const isAvailable = Math.random() < chance;
      let stock = isAvailable ? (item.id === 'bandage' ? Math.floor(Math.random() * 4) + 1 : Math.floor(Math.random() * (item.maxStock - item.minStock + 1)) + item.minStock) : 0;
      if (isAvailable && hasLuck && (item.rarity === 'Rare' || item.rarity === 'Legendary')) {
        stock = Math.max(stock, Math.round(stock * 1.3));
      }
      return {
        id: item.id,
        name: item.name,
        price: item.price,
        description: item.description,
        rarity: item.rarity as 'Common' | 'Uncommon' | 'Rare' | 'Legendary',
        available: isAvailable && stock > 0,
        stock: stock
      };
    });

    setIpadItems(generated);
  };

  // Initial iPad population
  useEffect(() => {
    restockIpadItems();
  }, []);

  // iPad Timer loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = setInterval(() => {
      setIpadRestockTimer(prev => {
        if (prev <= 1) {
          restockIpadItems();
          return 85;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Dynamic Paintings, Carpets, and Skull States
  interface RoomPainting {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    type: 'eye' | 'moon' | 'smile' | 'scream' | 'portrait';
    title: string;
    isSideRoom: boolean;
  }
  const [roomPaintings, setRoomPaintings] = useState<RoomPainting[]>([]);

  interface CarpetConfig {
    color: string;
    pattern: 'solid' | 'striped' | 'ornate';
    borderColor: string;
  }
  const [hasCarpet, setHasCarpet] = useState(false);
  const [carpetStyle, setCarpetStyle] = useState<CarpetConfig | null>(null);

  const [hasSkull, setHasSkull] = useState(false);
  const [skullX, setSkullX] = useState<number>(0);
  const [skullInteracted, setSkullInteracted] = useState(false);

  // Cola States
  const [colaTimer, setColaTimer] = useState(0);
  const colaTimerRef = useRef(0);

  // Luck Potion States
  const [luckPotionTimer, setLuckPotionTimer] = useState(0);
  const luckPotionTimerRef = useRef(0);

  // Dupe (Fake Door) states
  const [dupeActive, setDupeActive] = useState(false);
  const [dupeDoors, setDupeDoors] = useState<{ x: number; doorNumber: number; isReal: boolean; isOpened: boolean }[]>([]);
  const [dupeJumpscare, setDupeJumpscare] = useState(false);

  // Monster (Rush / Ambush) States
  const [monsterActive, setMonsterActive] = useState(false);
  const [monsterX, setMonsterX] = useState(-200);
  const [activeMonsterType, setActiveMonsterType] = useState<'RUSH' | 'AMBUSH'>('RUSH');
  const ambushDirRef = useRef(1); // 1 = right, -1 = left
  const ambushCyclesRef = useRef(0); // rebounds remaining

  // Banish sequence for Crucifix action
  const [banishActive, setBanishActive] = useState(false);
  const banishActiveRef = useRef(false);
  const banishProgressRef = useRef(0); // 0 to 100 frames

  // Ensure collision is only checked once per monster rush
  const monsterHitTriggered = useRef(false);

  // Input states for keyboard
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Refs to prevent room double-initialization and duplicate monster spawns
  const lastInitializedRoomRef = useRef<number>(0);
  const monsterRushTimeoutRef = useRef<any>(null);
  const monsterCleanupTimeoutRef = useRef<any>(null);
  const lastBoxWarningTimeRef = useRef<number>(0);
  const skullInteractedRef = useRef<boolean>(false);
  const openingBoxIdsRef = useRef<Set<string>>(new Set());

  // Audio mute helper
  const [muted, setMuted] = useState(false);

  // On-screen notification alerts
  const [alertMessage, setAlertMessage] = useState("");

  // Touch controls helpers
  const [touchSprinting, setTouchSprinting] = useState(false);

  // Refs for stable keyboard listener
  const gameStateRef = useRef(gameState);
  const showIpadRef = useRef(showIpad);
  const inventoryRef = useRef(inventory);
  const selectedItemIdxRef = useRef(selectedItemIdx);
  const flashlightBatteryRef = useRef(flashlightBattery);
  const flashlightOnRef = useRef(flashlightOn);
  const mutedRef = useRef(muted);
  const handleInteractionRef = useRef<() => void>(() => {});
  const useActiveItemRef = useRef<() => void>(() => {});
  const toggleFlashlightRef = useRef<() => void>(() => {});

  // Determine if a room should be locked / have a puzzle
  // Locked doors at doors: 18 (Key 1), 36 (Key 2), 54 (Key 3), 72 (Key 4), 90 (Key 5)
  const isKeyCheckpoint = (door: number) => {
    if (door === 18) return 1;
    if (door === 36) return 2;
    if (door === 54) return 3;
    if (door === 72) return 4;
    if (door === 90) return 5;
    return null;
  };

  // Add Item to Inventory Helper
  const addToInventory = (type: ItemType, label: string, description: string): boolean => {
    if (inventory.length >= 5) {
      setAlertMessage("HOTBAR FULL! NO SPACE LEFT.");
      setTimeout(() => setAlertMessage(""), 2000);
      return false;
    }
    const newItem: InventoryItem = {
      id: Math.random().toString(),
      type,
      label,
      description
    };
    setInventory(prev => [...prev, newItem]);
    return true;
  };

    // Setup / reset a room when entering
  const initRoom = (doorNum: number) => {
    if (lastInitializedRoomRef.current === doorNum) {
      // Already initialized this room! Prevent double-triggering
      return;
    }
    lastInitializedRoomRef.current = doorNum;

    // Clear any active monster timeouts from previous room transitions
    if (monsterRushTimeoutRef.current) {
      clearTimeout(monsterRushTimeoutRef.current);
      monsterRushTimeoutRef.current = null;
    }
    if (monsterCleanupTimeoutRef.current) {
      clearTimeout(monsterCleanupTimeoutRef.current);
      monsterCleanupTimeoutRef.current = null;
    }

    // Player starts at left side
    setPlayerPosition(150);
    setIsHiding(false);
    setIsSprinting(false);
    setShowShop(false);

    const checkpoint = isKeyCheckpoint(doorNum);
    
    // Dupe setup
    // Reduced chance (5% instead of 12%) so Dupe is very rare
    const hasDupe = (doorNum > 3 && doorNum !== 40 && doorNum !== 100 && !checkpoint && Math.random() < 0.05);
    setDupeActive(hasDupe);
    if (hasDupe) {
      const isLeftReal = Math.random() < 0.5;
      const fakeNumber = Math.random() < 0.5 ? doorNum : doorNum + 2;
      setDupeDoors([
        {
          x: 580,
          doorNumber: isLeftReal ? doorNum + 1 : fakeNumber,
          isReal: isLeftReal,
          isOpened: false
        },
        {
          x: 740,
          doorNumber: isLeftReal ? fakeNumber : doorNum + 1,
          isReal: !isLeftReal,
          isOpened: false
        }
      ]);
    } else {
      setDupeDoors([]);
    }

    // Side Room (Grey Door with Green Stripe) Spawning Setup
    // 8% chance in standard rooms > 1 so Code Room is rare
    const canHaveSideRoom = (doorNum > 1 && doorNum !== 40 && doorNum !== 100 && !checkpoint && !hasDupe);
    const sideRoomSpawn = canHaveSideRoom && (Math.random() < 0.08);
    setHasSideRoom(sideRoomSpawn);
    if (sideRoomSpawn) {
      setSideRoomDoorX(hasDupe ? 420 : 360);
      setInSideRoom(false);
      
      // Generate a fresh unique 3-digit code for this code room!
      const newCode = [
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 10)
      ].join('');
      setSideRoomCode(newCode);

      setSideRoomCodeFound(false);
      setSideRoomChestUnlocked(false);
      // Reset input digits
      setDigit1(0);
      setDigit2(0);
      setDigit3(0);
    } else {
      setHasSideRoom(false);
      setSideRoomDoorX(null);
      setInSideRoom(false);
    }

    // --- Generate Dynamic Paintings, Carpets, and Skull ---
    const newPaintings: RoomPainting[] = [];
    const paintingTypes: ('eye' | 'moon' | 'smile' | 'scream' | 'portrait')[] = ['eye', 'moon', 'smile', 'scream', 'portrait'];
    const titles = {
      eye: "GUIDING EYE",
      moon: "VALLEY",
      smile: "SMILE",
      scream: "THE SCREAM",
      portrait: "PORTRAIT"
    };

    // Main Room Paintings (1 or 2 at varying locations)
    if (doorNum !== 100) {
      const paintingCount = Math.random() > 0.4 ? 2 : 1;
      const titles = {
        eye: "GUIDING EYE",
        moon: "VALLEY",
        smile: "SMILE",
        scream: "THE SCREAM",
        portrait: "PORTRAIT"
      };

      // Helper to find a non-overlapping X coordinate for a painting of width pW
      const findValidPaintingX = (pW: number, isSide: boolean): number => {
        const blocked: [number, number][] = [];
        if (isSide) {
          // Locked chest is on the right around X = 600
          blocked.push([100, 220]); // far left/return door spawn
          blocked.push([520, 720]); // chest area
        } else {
          blocked.push([0, 200]); // player spawn/exit zone
          if (doorNum === 40) {
            blocked.push([370, 530]); // Jeff's shop counter at X = 450 (width 120)
          } else {
            blocked.push([740, 860]); // exit door on the right
          }
          if (hasDupe) {
            blocked.push([560, 680]);
            blocked.push([720, 840]);
          }
          if (sideRoomSpawn) {
            const sDoorX = hasDupe ? 420 : 360;
            blocked.push([sDoorX - 15, sDoorX + 95]);
          }
          // Use current closetX positions if set, or calculate based on doorNum
          const closetsCount = doorNum === 100 ? 1 : Math.random() > 0.5 ? 2 : 1;
          const tempClosets = doorNum === 40 ? [] : (closetsCount === 2 ? [350, 600] : [doorNum === 100 ? 220 : (hasDupe ? 320 : 450)]);
          tempClosets.forEach(cx => {
            blocked.push([cx - 20, cx + 55 + 20]);
          });
          // Drawers
          if (doorNum !== 40 && doorNum !== 100) {
            let d1 = 180;
            let d2 = 500;
            if (hasDupe) {
              d2 = 460;
            } else {
              if (tempClosets.length === 2) {
                d2 = 490;
              } else {
                d2 = 640;
              }
            }
            blocked.push([d1 - 20, d1 + 65]);
            blocked.push([d2 - 20, d2 + 65]);
          }
        }

        // Block other paintings in this generation pass
        newPaintings.filter(pt => pt.isSideRoom === isSide).forEach(pt => {
          blocked.push([pt.x - 35, pt.x + pt.w + 35]);
        });

        const minLimit = isSide ? 230 : 210;
        const maxLimit = isSide ? 510 : 710;

        // Try 150 times for a random spot
        for (let attempt = 0; attempt < 150; attempt++) {
          const testX = minLimit + Math.floor(Math.random() * (maxLimit - minLimit - pW));
          const overlaps = blocked.some(([bMin, bMax]) => testX <= bMax && testX + pW >= bMin);
          if (!overlaps) {
            return testX;
          }
        }

        // Linear scan fallback
        for (let testX = minLimit; testX <= maxLimit - pW; testX += 8) {
          const overlaps = blocked.some(([bMin, bMax]) => testX <= bMax && testX + pW >= bMin);
          if (!overlaps) {
            return testX;
          }
        }

        return isSide ? 280 : 220;
      };

      for (let idx = 0; idx < paintingCount; idx++) {
        const type = paintingTypes[Math.floor(Math.random() * paintingTypes.length)];
        const w = 55 + Math.floor(Math.random() * 15);
        const h = 70 + Math.floor(Math.random() * 15);
        const pX = findValidPaintingX(w, false);
        newPaintings.push({
          id: `main-${idx}-${Math.random()}`,
          x: pX,
          y: 65 + Math.floor(Math.random() * 25), // dynamic height on wall
          w,
          h,
          type,
          title: titles[type],
          isSideRoom: false
        });
      }
    }

    // Side Room Painting
    if (sideRoomSpawn) {
      const type = paintingTypes[Math.floor(Math.random() * paintingTypes.length)];
      const titles = {
        eye: "GUIDING EYE",
        moon: "VALLEY",
        smile: "SMILE",
        scream: "THE SCREAM",
        portrait: "PORTRAIT"
      };

      // Helper to find a non-overlapping X coordinate for a painting of width pW
      const findValidPaintingX = (pW: number, isSide: boolean): number => {
        const blocked: [number, number][] = [];
        if (isSide) {
          blocked.push([100, 220]); // far left/return door spawn
          blocked.push([520, 720]); // chest area
        }
        const minLimit = 230;
        const maxLimit = 510;

        for (let attempt = 0; attempt < 150; attempt++) {
          const testX = minLimit + Math.floor(Math.random() * (maxLimit - minLimit - pW));
          const overlaps = blocked.some(([bMin, bMax]) => testX <= bMax && testX + pW >= bMin);
          if (!overlaps) {
            return testX;
          }
        }
        return 280;
      };

      const w = 55 + Math.floor(Math.random() * 15);
      const h = 70 + Math.floor(Math.random() * 15);
      const pX = findValidPaintingX(w, true);
      newPaintings.push({
        id: `side-0-${Math.random()}`,
        x: pX,
        y: 65 + Math.floor(Math.random() * 25),
        w,
        h,
        type,
        title: titles[type],
        isSideRoom: true
      });
    }
    setRoomPaintings(newPaintings);

    // Carpeting (Sometimes spawn in rooms, 40% chance, except shop/elevator)
    const isCarpeting = (doorNum !== 40 && doorNum !== 100 && Math.random() < 0.40);
    setHasCarpet(isCarpeting);
    if (isCarpeting) {
      const colors = ['#881337', '#1e3a8a', '#4c1d95', '#064e3b', '#7c2d12']; // rose, blue, purple, emerald, rust
      const borders = ['#fbbf24', '#f59e0b', '#c084fc', '#34d399', '#fca5a5'];
      const patterns: ('solid' | 'striped' | 'ornate')[] = ['solid', 'striped', 'ornate'];
      const randomIdx = Math.floor(Math.random() * colors.length);
      setCarpetStyle({
        color: colors[randomIdx],
        borderColor: borders[randomIdx],
        pattern: patterns[Math.floor(Math.random() * patterns.length)]
      });
    } else {
      setCarpetStyle(null);
    }

    // Skull Spawning (Rarely, 15% chance, except shop/elevator)
    const isSkullSpawn = (doorNum > 1 && doorNum !== 40 && doorNum !== 100 && Math.random() < 0.15);
    setHasSkull(isSkullSpawn);
    if (isSkullSpawn) {
      // safe positions avoiding left return or right boundaries
      setSkullX(240 + Math.floor(Math.random() * 420));
      setSkullInteracted(false);
      skullInteractedRef.current = false;
    } else {
      setSkullX(0);
      setSkullInteracted(false);
      skullInteractedRef.current = false;
    }

    // Generate closets (None in shop Door 40!)
    let count = 0;
    if (doorNum === 40) {
      setClosetX([]);
    } else {
      count = doorNum === 100 ? 1 : Math.random() > 0.5 ? 2 : 1;
      if (hasDupe) {
        count = 1; // Only 1 closet to avoid overlap with Dupe doors
      }
      if (count === 2) {
        if (sideRoomSpawn) {
          setClosetX([240, 600]); // Shift first closet to 240 (from 350) so it doesn't overlap/block side room door at 360
        } else {
          setClosetX([350, 600]);
        }
      } else {
        if (sideRoomSpawn) {
          setClosetX([580]); // Shift single closet to 580 (from 450) so it doesn't block/sit next to side room door at 360
        } else {
          setClosetX([doorNum === 100 ? 220 : (hasDupe ? 320 : 450)]);
        }
      }
    }

    // Determine standard key lock state (only if not a checkpoint, shop, elevator, or dupe, and doorNum > 2)
    const isLockedWithKey = (checkpoint === null && doorNum > 2 && doorNum !== 40 && doorNum !== 100 && !hasDupe && Math.random() < 0.35);
    setIsRoomKeyLocked(isLockedWithKey);
    setHasRoomKey(false);

    // Generate drawers in the current room (except shop door 40 and elevator door 100)
    if (doorNum !== 40 && doorNum !== 100) {
      const roomDrawers: { x: number; searched: boolean; hasKey?: boolean; hasCode?: boolean }[] = [];
      
      // Calculate non-overlapping positions dynamically
      let pos1 = 180;
      let pos2 = 500;
      
      if (hasDupe) {
        // Closet is at 320. Doors are at 580 and 740.
        pos1 = 180; // Far left
        pos2 = 460; // Between closet (320-375) and first dupe door (580-660)
      } else {
        // No dupe. Standard door is at 760 (760-840).
        if (count === 2) {
          if (sideRoomSpawn) {
            // Closets are at 240 (240-295) and 600 (600-655). Side room door is at 360 (360-440).
            pos1 = 170; // Left of closet 1
            pos2 = 480; // Between side room door (360) and closet 2 (600)
          } else {
            // Closets are at 350 (350-405) and 600 (600-655).
            pos1 = 180; // Far left
            pos2 = 490; // Between closet 1 and closet 2
          }
        } else {
          if (sideRoomSpawn) {
            // Closet is at 580 (580-635). Side room door is at 360 (360-440).
            pos1 = 180; // Left side
            pos2 = 480; // Between side room door (360) and closet (580)
          } else {
            // Closet is at 450 (450-505).
            pos1 = 180; // Far left
            pos2 = 640; // Between closet (450-505) and standard door (760-840)
          }
        }
      }

      // If locked with key or side room is active, guarantee at least 1 drawer!
      const spawnFirst = isLockedWithKey || sideRoomSpawn || (Math.random() < 0.6);
      const spawnSecond = Math.random() < 0.5;

      if (spawnFirst) {
        roomDrawers.push({ x: pos1, searched: false });
      }
      if (spawnSecond) {
        roomDrawers.push({ x: pos2, searched: false });
      }

      // Safeguard: always have at least one drawer
      if (roomDrawers.length === 0) {
        roomDrawers.push({ x: pos1, searched: false });
      }

      // Distribute the key or side room code
      if (isLockedWithKey) {
        const luckyIdx = Math.floor(Math.random() * roomDrawers.length);
        roomDrawers[luckyIdx].hasKey = true;
      } else if (sideRoomSpawn) {
        const luckyIdx = Math.floor(Math.random() * roomDrawers.length);
        roomDrawers[luckyIdx].hasCode = true;
      }

      setDrawers(roomDrawers);
    } else {
      setDrawers([]);
    }

    // Handle initial lock status of the door
    if (isLockedWithKey) {
      setIsDoorLocked(true);
    } else if (checkpoint && keysCollected < checkpoint) {
      setIsDoorLocked(true);
    } else {
      setIsDoorLocked(false);
    }

    // Flicker/Monster setup
    setIsFlickering(false);
    setRoomDarkened(false);
    setMonsterActive(false);
    setMonsterX(-250);
    monsterHitTriggered.current = false;

    // Reset banish state
    setBanishActive(false);
    banishActiveRef.current = false;
    banishProgressRef.current = 0;

    // Flickering lights chance (11% in rooms without locked door puzzles, except door 40 and 100)
    if (doorNum > 1 && doorNum !== 40 && doorNum < 100 && !checkpoint && Math.random() < 0.11) {
      triggerMonsterSequence();
    }
  };

  // Trigger scary monster rush
  const triggerMonsterSequence = () => {
    setIsFlickering(true);
    if (!muted) sound.playFlicker();

    // 75% chance of Rush, 25% chance of Ambush
    const type = Math.random() < 0.25 ? 'AMBUSH' : 'RUSH';
    setActiveMonsterType(type);

    if (type === 'AMBUSH') {
      ambushDirRef.current = 1; // start rushing right
      ambushCyclesRef.current = Math.random() < 0.5 ? 2 : 3; // rebounds back and forth
      setAlertMessage("⚠️ AMBUSH IS INCOMING! HIDE IN A CLOSET IMMEDIATELY! ⚠️");
      setTimeout(() => setAlertMessage(""), 4500);
    } else {
      setAlertMessage("⚠️ RUSH IS INCOMING! HIDE! ⚠️");
      setTimeout(() => setAlertMessage(""), 3000);
    }

    // Clear any active timeouts before setting new ones
    if (monsterRushTimeoutRef.current) clearTimeout(monsterRushTimeoutRef.current);
    if (monsterCleanupTimeoutRef.current) clearTimeout(monsterCleanupTimeoutRef.current);

    // After 1.8 seconds of flickering lights, monster starts rushing
    monsterRushTimeoutRef.current = setTimeout(() => {
      setRoomDarkened(true);
      setMonsterActive(true);
      setMonsterX(-250);
      if (!muted) {
        if (type === 'AMBUSH') {
          sound.playAmbushScream(3.5);
        } else {
          sound.playMonsterRush(2.5);
        }
      }
    }, 1800);

    // Fail-safe cleanup to guarantee the screen goes back to normal after 7.5 seconds
    monsterCleanupTimeoutRef.current = setTimeout(() => {
      setIsFlickering(false);
      setRoomDarkened(false);
      setMonsterActive(false);
    }, 7500);
  };

  const triggerDupeJumpscare = () => {
    setDupeJumpscare(true);
    setHealth(prev => {
      const nextHealth = Math.max(0, prev - 25);
      if (nextHealth <= 0) {
        setGameState('GAMEOVER');
        onGameOver('DUPE (FAKE DOOR)');
      }
      return nextHealth;
    });

    if (!muted) {
      sound.playDeath(); 
    }

    setTimeout(() => {
      setDupeJumpscare(false);
      setPlayerPosition(prev => Math.max(100, prev - 120)); // push player back
    }, 1500);
  };

  // Sync coins with parent app state
  useEffect(() => {
    setStats(prev => ({ ...prev, coins }));
  }, [coins, setStats]);

  // Smoothly increment displayed coins towards actual coins count
  useEffect(() => {
    if (displayedCoins === coins) return;
    const diff = coins - displayedCoins;
    if (diff > 0) {
      const step = Math.ceil(diff / 10);
      const timer = setTimeout(() => {
        setDisplayedCoins(prev => Math.min(coins, prev + step));
      }, 40);
      return () => clearTimeout(timer);
    } else {
      setDisplayedCoins(coins);
    }
  }, [coins, displayedCoins]);

  // Effect to load ambiance
  useEffect(() => {
    if (gameState === 'PLAYING' && !muted) {
      sound.startAmbiance();
    } else {
      sound.stopAmbiance();
    }
    return () => {
      sound.stopAmbiance();
    };
  }, [gameState, muted]);

  // Handle Radio Equip Loop
  useEffect(() => {
    const activeItem = inventory[selectedItemIdx];
    if (gameState === 'PLAYING' && activeItem?.type === 'radio' && !muted) {
      sound.startRadioMusic();
    } else {
      sound.stopRadioMusic();
    }
    return () => {
      sound.stopRadioMusic();
    };
  }, [selectedItemIdx, inventory, gameState, muted]);

  // Initial room trigger
  useEffect(() => {
    if (gameState === 'PLAYING') {
      // Reset initialization tracker for fresh run
      lastInitializedRoomRef.current = 0;

      // Starting items: give some pocket coins initially
      setCoins(20);
      setHealth(100);
      setStamina(100);
      setFlashlightBattery(100);
      setFlashlightOn(true);
      setAmazonBoxes([]);
      
      const startingFlashlight: InventoryItem = {
        id: 'starting-flashlight',
        type: 'flashlight',
        label: 'Flashlight',
        description: 'Illuminates dark rooms. Requires battery power.'
      };
      setInventory([startingFlashlight]);
      setSelectedItemIdx(0);
      initRoom(currentDoor);
    }
  }, [gameState]);

  // Trigger Drone Delivery when exiting the iPad
  useEffect(() => {
    if (!showIpad && pendingOrdersRef.current.length > 0) {
      // For each pending order, dispatch a delivery drone!
      const orders = [...pendingOrdersRef.current];
      pendingOrdersRef.current = []; // Clear pending list immediately to avoid double execution

      orders.forEach((order, index) => {
        // Stagger the drones
        setTimeout(() => {
          // Drone flies in from left (x = -150) to hover above player, then fly away right
          const targetX = Math.max(120, Math.min(780, playerPosition + (index * 45) - 45));
          const newDrone: DroneDelivery = {
            id: Math.random().toString(),
            x: -150,
            y: 80, // High up in the sky
            targetX: targetX,
            targetY: 306, // Sitting ground Y center
            state: 'FLYING_IN',
            itemType: order.type,
            itemLabel: order.label,
            itemDescription: order.desc,
            boxId: order.id,
            timer: 60 // Hover time in ticks (~1 second)
          };
          setDrones(prevDrones => [...prevDrones, newDrone]);
          if (!muted) {
            sound.playUnlock();
          }
        }, index * 800); // 0.8s stagger
      });
      
      setAlertMessage("JEFF'S DELIVERY DRONES DEPLOYED! 🛸");
      setTimeout(() => setAlertMessage(""), 3000);
    }
  }, [showIpad, playerPosition, muted]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current !== 'PLAYING') return;

      const code = e.code;
      
      // If iPad is open, allow pressing Escape or KeyQ to close it
      if (showIpadRef.current) {
        if (code === 'KeyQ' || code === 'Escape') {
          setShowIpad(false);
          if (!mutedRef.current) sound.playClick();
        }
        return;
      }

      keysPressed.current[code] = true;

      // Hotbar selection keys [1-5]
      if (code === 'Digit1') setSelectedItemIdx(0);
      if (code === 'Digit2') setSelectedItemIdx(1);
      if (code === 'Digit3') setSelectedItemIdx(2);
      if (code === 'Digit4') setSelectedItemIdx(3);
      if (code === 'Digit5') setSelectedItemIdx(4);

      // Hiding / Interaction trigger with 'KeyE' or 'Space'
      if (code === 'KeyE' || code === 'Space') {
        e.preventDefault();
        handleInteractionRef.current();
      }

      // Flashlight Toggle
      if (code === 'KeyF') {
        toggleFlashlightRef.current();
      }

      // Quick use / Consume active item [KeyQ or click]
      if (code === 'KeyQ') {
        useActiveItemRef.current();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Flashlight Toggle Helper
  const toggleFlashlight = () => {
    const hasFlashlight = inventory.some(item => item.type === 'flashlight');
    const isHoldingFlashlight = inventory[selectedItemIdx]?.type === 'flashlight';
    if (!hasFlashlight) {
      setAlertMessage("YOU DO NOT HAVE A FLASHLIGHT!");
      setTimeout(() => setAlertMessage(""), 2000);
    } else if (!isHoldingFlashlight) {
      setAlertMessage("EQUIP FLASHLIGHT IN HOTBAR!");
      setTimeout(() => setAlertMessage(""), 2000);
    } else if (flashlightBattery <= 0) {
      setAlertMessage("FLASHLIGHT BATTERY IS DEAD!");
      setTimeout(() => setAlertMessage(""), 2000);
    } else {
      setFlashlightOn(prev => !prev);
      if (!muted) sound.playClick();
    }
  };

  // Consume / Use active item helper
  const useActiveItem = () => {
    const activeItem = inventory[selectedItemIdx];
    if (!activeItem) {
      setAlertMessage("NO ITEM EQUIPPED!");
      setTimeout(() => setAlertMessage(""), 2000);
      return;
    }

    if (activeItem.type === 'bandage') {
      if (health >= 100) {
        setAlertMessage("HEALTH IS ALREADY FULL!");
        setTimeout(() => setAlertMessage(""), 2000);
        return;
      }
      setHealth(prev => Math.min(100, prev + 40));
      if (!muted) sound.playHeal();
      floatingTextsRef.current.push({
        x: playerPosition,
        y: 220,
        text: "+40 HEALED 💖",
        color: "#10b981",
        life: 80
      });

      // Remove item
      setInventory(prev => prev.filter((_, idx) => idx !== selectedItemIdx));
    } 
    else if (activeItem.type === 'cola') {
      colaTimerRef.current = 11;
      setColaTimer(11);
      if (!muted) sound.playHeal(); // Refreshing drink sound
      floatingTextsRef.current.push({
        x: playerPosition,
        y: 220,
        text: "SPEED BOOST ACTIVE! ⚡",
        color: "#eab308",
        life: 110
      });
      setAlertMessage("DRANK COLA: SPEED & INFINITE STAMINA FOR 11 SECONDS!");
      setTimeout(() => setAlertMessage(""), 3500);

      // Remove item
      setInventory(prev => prev.filter((_, idx) => idx !== selectedItemIdx));
    }
    else if (activeItem.type === 'luck_potion') {
      luckPotionTimerRef.current = 44;
      setLuckPotionTimer(44);
      if (!muted) sound.playHeal(); // Potion drink sound
      floatingTextsRef.current.push({
        x: playerPosition,
        y: 220,
        text: "LUCK POTION ACTIVE! 🍀",
        color: "#10b981",
        life: 110
      });
      setAlertMessage("DRANK LUCK POTION: +30% CHANCE OF RARE ITEMS FOR 44 SECONDS!");
      setTimeout(() => setAlertMessage(""), 3500);

      // Remove item
      setInventory(prev => prev.filter((_, idx) => idx !== selectedItemIdx));
    }
    else if (activeItem.type === 'vitamins') {
      setHealth(prev => Math.min(100, prev + 25));
      colaTimerRef.current = 4.5;
      setColaTimer(4.5);
      if (!muted) sound.playHeal();
      floatingTextsRef.current.push({
        x: playerPosition,
        y: 220,
        text: "+25 HP & VITAMIN ENERGY! 💊⚡",
        color: "#f43f5e",
        life: 90
      });
      setAlertMessage("TOOK VITAMINS: HEALED 25 HP & GAINED SPEED FOR 4.5 SECONDS!");
      setTimeout(() => setAlertMessage(""), 3500);

      // Remove item
      setInventory(prev => prev.filter((_, idx) => idx !== selectedItemIdx));
    }
    else if (activeItem.type === 'lockpick') {
      if (inSideRoom && Math.abs(playerPosition - 600) < 55 && !sideRoomChestUnlocked) {
        setSideRoomChestUnlocked(true);
        if (!muted) sound.playUnlock();
        setCoins(prev => prev + 12);
        triggerCoinAnimation(12, playerPosition);
        addToInventory('lockpick', 'Lockpick', 'Instantly unlocks locked doors.');
        floatingTextsRef.current.push({
          x: playerPosition,
          y: 200,
          text: "+12 COINS & RECOVERED LOCKPICK",
          color: "#fbbf24",
          life: 120
        });
        setAlertMessage("LOCKPICKED SECURE CHEST! FOUND 12 COINS & A SPARE LOCKPICK.");
        setTimeout(() => setAlertMessage(""), 3500);
        // Remove used lockpick
        setInventory(prev => prev.filter((_, idx) => idx !== selectedItemIdx));
      }
      else if (!inSideRoom && isDoorLocked && playerPosition >= 740) {
        setIsDoorLocked(false);
        setIsRoomKeyLocked(false);
        if (!muted) sound.playUnlock();
        floatingTextsRef.current.push({
          x: playerPosition,
          y: 220,
          text: "LOCKPICKED DOOR! 🗝️",
          color: "#fbbf24",
          life: 120
        });
        setAlertMessage("LOCKPICK USED! THE DOOR IS NOW UNLOCKED.");
        setTimeout(() => setAlertMessage(""), 3000);

        // Remove item
        setInventory(prev => prev.filter((_, idx) => idx !== selectedItemIdx));
      } else {
        setAlertMessage("NOTHING TO LOCKPICK HERE!");
        setTimeout(() => setAlertMessage(""), 2000);
      }
    } 
    else if (activeItem.type === 'skeleton_key') {
      if (inSideRoom && Math.abs(playerPosition - 600) < 55 && !sideRoomChestUnlocked) {
        setSideRoomChestUnlocked(true);
        if (!muted) sound.playUnlock();
        setCoins(prev => prev + 12);
        triggerCoinAnimation(12, playerPosition);
        floatingTextsRef.current.push({
          x: playerPosition,
          y: 200,
          text: "+12 COINS 🪙",
          color: "#fbbf24",
          life: 120
        });
        setAlertMessage("UNLOCKED SECURE CHEST! THE SKELETON KEY IS RETAINED.");
        setTimeout(() => setAlertMessage(""), 3500);
      }
      else if (!inSideRoom && isDoorLocked && playerPosition >= 740) {
        setIsDoorLocked(false);
        setIsRoomKeyLocked(false);
        if (!muted) sound.playUnlock();
        floatingTextsRef.current.push({
          x: playerPosition,
          y: 220,
          text: "UNLOCKED WITH SKELETON KEY! 🗝️",
          color: "#a78bfa",
          life: 120
        });
        setAlertMessage("THE DOOR IS UNLOCKED! SKELETON KEY RETAINED.");
        setTimeout(() => setAlertMessage(""), 3000);
      } else {
        setAlertMessage("NOTHING TO UNLOCK WITH SKELETON KEY!");
        setTimeout(() => setAlertMessage(""), 2000);
      }
    }
    else if (activeItem.type === 'ipad') {
      setShowIpad(prev => !prev);
      setIpadActiveApp('HOME');
      if (!muted) sound.playClick();
    }
    else {
      setAlertMessage(`CANNOT CONSUME OR ACTIVE-USE ${activeItem.label.toUpperCase()}!`);
      setTimeout(() => setAlertMessage(""), 2000);
    }
  };

  // Interaction logic
  const handleInteraction = () => {
    // Amazon Box Interaction check
    const nearBox = amazonBoxes.find(box => box.door === currentDoor && !box.isOpened && !box.isOpening && Math.abs(playerPosition - box.x) < 45);
    if (nearBox) {
      if (nearBox.itemType !== 'battery' && inventory.length >= 5) {
        setAlertMessage("HOTBAR FULL! MAKE SPACE IN YOUR INVENTORY.");
        setTimeout(() => setAlertMessage(""), 2000);
        return;
      }
      
      if (!openingBoxIdsRef.current.has(nearBox.id)) {
        openingBoxIdsRef.current.add(nearBox.id);
        // Start cool opening animation
        setAmazonBoxes(prev => prev.map(b => b.id === nearBox.id ? { ...b, isOpening: true } : b));
        
        if (!muted) {
          sound.playUnlock();
        }
        
        floatingTextsRef.current.push({
          x: nearBox.x,
          y: 220,
          text: `UNBOXING... 📦`,
          color: "#fbbf24",
          life: 60
        });
      }
      return;
    }

    // If shop is open, just close it or let click handle
    if (showShop) {
      setShowShop(false);
      return;
    }

    // Skull Interaction (gives 4 coins, crushing effect)
    if (hasSkull && !skullInteractedRef.current && !inSideRoom && Math.abs(playerPosition - skullX) < 40) {
      skullInteractedRef.current = true;
      setSkullInteracted(true);
      setCoins(prev => prev + 4);
      triggerCoinAnimation(4, skullX);
      if (!muted) sound.playCoin();
      floatingTextsRef.current.push({
        x: skullX,
        y: 200,
        text: "+4 COINS (CRUSHED SKULL) 💀",
        color: "#fbbf24",
        life: 110
      });
      setAlertMessage("YOU CRUSHED THE SKULL AND FOUND 4 GLISTENING COINS!");
      setTimeout(() => setAlertMessage(""), 3000);
      return;
    }

    // 1. Closet check (hide or exit closet)
    if (isHiding) {
      setIsHiding(false);
      sound.playClick();
      return;
    }

    // Side-room entry, exit, and chest check
    if (!inSideRoom && hasSideRoom && sideRoomDoorX !== null && Math.abs(playerPosition - sideRoomDoorX) < 45) {
      setInSideRoom(true);
      setPlayerPosition(180); // Spawn near return door on left
      if (!muted) sound.playUnlock();
      return;
    }

    if (inSideRoom && Math.abs(playerPosition - 180) < 45) {
      setInSideRoom(false);
      setPlayerPosition(sideRoomDoorX !== null ? sideRoomDoorX : 360); // Spawn near side-room door
      if (!muted) sound.playUnlock();
      return;
    }

    if (inSideRoom && Math.abs(playerPosition - 600) < 55) {
      if (sideRoomChestUnlocked) {
        setAlertMessage("THIS SECURE CHEST IS ALREADY OPENED!");
        setTimeout(() => setAlertMessage(""), 2000);
      } else {
        setShowChestLockPuzzle(true);
      }
      return;
    }

    // See if close to any closet
    const nearCloset = closetX.some(cx => Math.abs(playerPosition - cx) < 45);
    if (nearCloset && !inSideRoom) {
      setIsHiding(true);
      sound.playClick();
      setStats(prev => ({ ...prev, timesHidden: prev.timesHidden + 1 }));
      return;
    }

    // 2. Search drawers check
    const nearDrawer = !inSideRoom ? drawers.find(d => !d.searched && Math.abs(playerPosition - d.x) < 75) : undefined;
    if (nearDrawer) {
      nearDrawer.searched = true;
      setDrawers([...drawers]);

      if (nearDrawer.hasKey) {
        setHasRoomKey(true);
        setIsDoorLocked(false);
        if (!muted) sound.playKey();
        floatingTextsRef.current.push({
          x: nearDrawer.x,
          y: 200,
          text: "ROOM KEY 🔑",
          color: "#fbbf24",
          life: 110
        });
        setAlertMessage("YOU FOUND THE ROOM KEY! DOOR UNLOCKED.");
        setTimeout(() => setAlertMessage(""), 3000);
      } else if (hasSideRoom && nearDrawer.hasCode) {
        setSideRoomCodeFound(true);
        if (!muted) sound.playKey();
        floatingTextsRef.current.push({
          x: nearDrawer.x,
          y: 200,
          text: `CODE: ${sideRoomCode} 📝`,
          color: "#10b981",
          life: 140
        });
        setAlertMessage(`FOUND CHEST SCROLL: CODE IS ${sideRoomCode}`);
        setTimeout(() => setAlertMessage(""), 4500);
      } else {
        // Roll drop percentage
        const roll = Math.random();
        const hasLuck = luckPotionTimerRef.current > 0;
        const luckMultiplier = hasLuck ? 1.3 : 1.0;

        // iPad has 0.9% base drop chance
        const ipadChance = 0.009 * luckMultiplier;
        // Luck Potion has 4.3% base drop chance
        const luckPotionChance = 0.043 * luckMultiplier;

        if (roll < ipadChance) {
          // iPad with 0.9% drop chance!
          const success = addToInventory('ipad', 'iPad', 'Sleek electronic tablet. Open Jeff Express to buy items.');
          if (success) {
            if (!muted) sound.playKey();
            floatingTextsRef.current.push({
              x: nearDrawer.x,
              y: 200,
              text: "FOUND IPAD! 📱",
              color: "#a855f7",
              life: 120
            });
            setAlertMessage("YOU FOUND AN IPAD! EQUIP IT AND PRESS Q OR TAP USE TO OPEN THE SHOP!");
            setTimeout(() => setAlertMessage(""), 4500);
          }
        } else if (roll < ipadChance + luckPotionChance) {
          // Luck Potion with 4.3% drop chance!
          const success = addToInventory('luck_potion', 'Luck Potion', 'Boosts rare drops/stock by +30% for 44s. Press Q to drink.');
          if (success) {
            if (!muted) sound.playHeal();
            floatingTextsRef.current.push({
              x: nearDrawer.x,
              y: 200,
              text: "FOUND LUCK POTION! 🍀",
              color: "#10b981",
              life: 120
            });
            setAlertMessage("YOU FOUND A LUCK POTION! DRINK IT [Q] TO BOOST YOUR LUCK BY 30%!");
            setTimeout(() => setAlertMessage(""), 4500);
          }
        } else {
          // Normal drops
          const normalRoll = Math.random();
          const baseCrucifixChance = 0.03;
          const crucifixChance = baseCrucifixChance * luckMultiplier; // 3% * 1.3 = 3.9%

          const baseColaChance = 0.10;
          const colaChance = baseColaChance * luckMultiplier; // 10% * 1.3 = 13%

          const baseCoins55Chance = 0.08;
          const coins55Chance = baseCoins55Chance * luckMultiplier; // 8% * 1.3 = 10.4%

          const baseBandageChance = 0.12;
          const baseBatteryChance = 0.10;
          const baseCoins20Chance = 0.20;

          let cumulative = 0;

          cumulative += crucifixChance;
          if (normalRoll < cumulative) {
            // Crucifix
            const success = addToInventory('crucifix', 'Crucifix', 'Banish Rush. Equip to protect.');
            if (success) {
              if (!muted) sound.playKey();
              floatingTextsRef.current.push({
                x: nearDrawer.x,
                y: 200,
                text: "FOUND CRUCIFIX!",
                color: "#3b82f6",
                life: 90
              });
            }
          } else {
            cumulative += coins55Chance;
            if (normalRoll < cumulative) {
              // 55 Coins
              setCoins(prev => prev + 55);
              triggerCoinAnimation(55, nearDrawer.x);
              if (!muted) sound.playCoin();
              floatingTextsRef.current.push({
                x: nearDrawer.x,
                y: 200,
                text: "+55 COINS!",
                color: "#fbbf24",
                life: 90
              });
            } else {
              cumulative += colaChance;
              if (normalRoll < cumulative) {
                // Cola
                const success = addToInventory('cola', 'Speed Cola', 'Incredible speed & infinite stamina for 11s. Press Q to drink.');
                if (success) {
                  if (!muted) sound.playHeal();
                  floatingTextsRef.current.push({
                    x: nearDrawer.x,
                    y: 200,
                    text: "FOUND SPEED COLA! ⚡",
                    color: "#fbbf24",
                    life: 110
                  });
                }
              } else {
                cumulative += baseBandageChance;
                if (normalRoll < cumulative) {
                  // Bandage
                  const success = addToInventory('bandage', 'Bandage', 'Heals 40 Health. Press Q to use.');
                  if (success) {
                    if (!muted) sound.playHeal();
                    floatingTextsRef.current.push({
                      x: nearDrawer.x,
                      y: 200,
                      text: "FOUND BANDAGE",
                      color: "#10b981",
                      life: 90
                    });
                  }
                } else {
                  cumulative += baseBatteryChance;
                  if (normalRoll < cumulative) {
                    // Battery
                    setFlashlightBattery(prev => Math.min(100, prev + 50));
                    if (!muted) sound.playKey();
                    floatingTextsRef.current.push({
                      x: nearDrawer.x,
                      y: 200,
                      text: "+50% BATTERY!",
                      color: "#06b6d4",
                      life: 90
                    });
                  } else {
                    cumulative += baseCoins20Chance;
                    if (normalRoll < cumulative) {
                      // 20 Coins
                      setCoins(prev => prev + 20);
                      triggerCoinAnimation(20, nearDrawer.x);
                      if (!muted) sound.playCoin();
                      floatingTextsRef.current.push({
                        x: nearDrawer.x,
                        y: 200,
                        text: "+20 COINS",
                        color: "#fbbf24",
                        life: 90
                      });
                    } else {
                      // Empty
                      if (!muted) sound.playClick();
                      floatingTextsRef.current.push({
                        x: nearDrawer.x,
                        y: 200,
                        text: "EMPTY",
                        color: "#6b7280",
                        life: 80
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }
      return;
    }

    // 3. Shopkeeper Jeff check at Door 40
    if (currentDoor === 40 && Math.abs(playerPosition - 450) < 60) {
      setShowShop(true);
      sound.playClick();
      return;
    }

    // 4. Door 100: workbench cabinet with New Switch
    if (currentDoor === 100 && !hasNewSwitch && Math.abs(playerPosition - 350) < 60) {
      setHasNewSwitch(true);
      sound.playKey();
      return;
    }

    // 5. Door 100: Elevator Power Junction Repair
    if (currentDoor === 100 && hasNewSwitch && !switchRepaired && Math.abs(playerPosition - 550) < 60) {
      setShowSwitchPuzzle(true);
      return;
    }

    // 6. Door 100: Elevator entrance
    if (currentDoor === 100 && switchRepaired && playerPosition >= 760) {
      onVictory();
      return;
    }

    // 7. General Locked Door / Fuse Puzzle trigger
    if (!dupeActive && isDoorLocked && playerPosition >= 760) {
      if (isRoomKeyLocked) {
        setAlertMessage("THIS DOOR IS LOCKED. FIND THE ROOM KEY IN THE DRAWERS!");
        setTimeout(() => setAlertMessage(""), 2500);
      } else {
        setShowFusePuzzle(true);
      }
      return;
    }

    // Dupe Door interaction
    if (dupeActive && dupeDoors.length > 0) {
      const nearDoor = dupeDoors.find(door => Math.abs(playerPosition - door.x) < 45);
      if (nearDoor) {
        if (nearDoor.isReal) {
          // Walk through real door
          const nextDoor = currentDoor + 1;
          setCurrentDoor(nextDoor);
          setStats(prev => ({ ...prev, doorsOpened: nextDoor }));
          if (!muted) sound.playUnlock();
          initRoom(nextDoor);
        } else {
          if (!nearDoor.isOpened) {
            nearDoor.isOpened = true;
            setDupeDoors([...dupeDoors]);
            triggerDupeJumpscare();
          }
        }
      }
      return;
    }

    // 8. Walk through Door (At the right screen boundary)
    if (!dupeActive && playerPosition >= 770 && !isDoorLocked && currentDoor < 100) {
      const nextDoor = currentDoor + 1;
      setCurrentDoor(nextDoor);
      setStats(prev => ({ ...prev, doorsOpened: nextDoor }));
      if (!muted) sound.playUnlock();
      initRoom(nextDoor);
    }
  };

  // Keep refs updated on every render
  gameStateRef.current = gameState;
  showIpadRef.current = showIpad;
  inventoryRef.current = inventory;
  selectedItemIdxRef.current = selectedItemIdx;
  flashlightBatteryRef.current = flashlightBattery;
  flashlightOnRef.current = flashlightOn;
  mutedRef.current = muted;
  handleInteractionRef.current = handleInteraction;
  useActiveItemRef.current = useActiveItem;
  toggleFlashlightRef.current = toggleFlashlight;

  // Buy Item from Shop Counter
  const buyItem = (type: ItemType | 'battery', cost: number, label: string, desc: string) => {
    if (coins < cost) {
      setAlertMessage("NOT ENOUGH COINS!");
      setTimeout(() => setAlertMessage(""), 2000);
      return;
    }
    if (type === 'battery') {
      setCoins(prev => prev - cost);
      setFlashlightBattery(100);
      if (!muted) sound.playCoin();
      floatingTextsRef.current.push({
        x: playerPosition,
        y: 200,
        text: `FLASHLIGHT RECHARGED! 🔋`,
        color: "#22d3ee",
        life: 80
      });
      setAlertMessage("BATTERY PURCHASED! FLASHLIGHT IS FULLY CHARGED.");
      setTimeout(() => setAlertMessage(""), 2500);
      return;
    }
    const success = addToInventory(type, label, desc);
    if (success) {
      setCoins(prev => prev - cost);
      if (!muted) sound.playCoin();
      floatingTextsRef.current.push({
        x: playerPosition,
        y: 200,
        text: `BOUGHT ${label}`,
        color: "#10b981",
        life: 80
      });
    }
  };

  // Game Loop (Updates position and renders canvas)
  useEffect(() => {
    let animationId: number;

    const update = () => {
      if (gameState !== 'PLAYING') return;

      // 0. Update Flashlight Battery drain
      const isFlashlightEquipped = inventory[selectedItemIdx]?.type === 'flashlight';
      if (isFlashlightEquipped && flashlightOn && flashlightBattery > 0) {
        setFlashlightBattery(prev => {
          const next = Math.max(0, prev - 0.01); // Slower drain: ~166 seconds of continuous use (from ~33s)
          if (next === 0) {
            setFlashlightOn(false);
            if (!muted) sound.playClick();
            setAlertMessage("FLASHLIGHT BATTERY DEAD!");
            setTimeout(() => setAlertMessage(""), 2000);
          }
          return next;
        });
      }

      // Tick Cola duration
      if (colaTimerRef.current > 0) {
        colaTimerRef.current = Math.max(0, colaTimerRef.current - 1 / 60);
        setColaTimer(colaTimerRef.current);
      }

      // Tick Luck Potion duration
      if (luckPotionTimerRef.current > 0) {
        luckPotionTimerRef.current = Math.max(0, luckPotionTimerRef.current - 1 / 60);
        setLuckPotionTimer(luckPotionTimerRef.current);
      }

      // 1. Move Player & Stamina consumption
      const isShiftPressed = !!(keysPressed.current['ShiftLeft'] || keysPressed.current['ShiftRight'] || touchSprinting);
      const isMoving = !isHiding && !showFusePuzzle && !showSwitchPuzzle && !showShop && !showIpad && !banishActiveRef.current && (
        keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA'] ||
        keysPressed.current['ArrowRight'] || keysPressed.current['KeyD']
      );

      const hasColaActive = colaTimerRef.current > 0;
      let speed = hasColaActive ? 4.2 : 2.8;
      if (isMoving && isShiftPressed && (stamina > 0 || hasColaActive)) {
        speed = hasColaActive ? 7.2 : 5.2;
        setIsSprinting(true);
        if (!hasColaActive) {
          setStamina(prev => Math.max(0, prev - 0.5)); // Slower drain (was 1.2)
        }
      } else {
        setIsSprinting(false);
        setStamina(prev => Math.min(100, prev + 0.4)); // Regain stamina
      }

      if (!isHiding && !showFusePuzzle && !showSwitchPuzzle && !showShop && !showIpad && !banishActiveRef.current) {
        if (keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA']) {
          setPlayerPosition(prev => {
            const next = Math.max(100, prev - speed);
            setPlayerFacing('left');
            return next;
          });
        }
        if (keysPressed.current['ArrowRight'] || keysPressed.current['KeyD']) {
          setPlayerPosition(prev => {
            const limit = inSideRoom ? 740 : (currentDoor === 100 && !switchRepaired ? 740 : 800);
            const next = Math.min(limit, prev + speed);
            setPlayerFacing('right');
            return next;
          });
        }

        // Automatic room transition when player walks into the standard door (X >= 770)
        if (!inSideRoom && !dupeActive && playerPosition >= 770 && !isDoorLocked && currentDoor < 100) {
          const nextDoor = currentDoor + 1;
          setCurrentDoor(nextDoor);
          setStats(prev => ({ ...prev, doorsOpened: nextDoor }));
          if (!muted) sound.playUnlock();
          initRoom(nextDoor);
        }
      }

      // 2. Update Monster Rush / Collision / Banishment / Rebound
      if (monsterActive && !banishActiveRef.current && !inSideRoom) {
        setMonsterX(prev => {
          const speed = activeMonsterType === 'AMBUSH' ? 14 : 12;
          const next = prev + speed * ambushDirRef.current;

          // Collision Check
          if (next >= playerPosition - 60 && next <= playerPosition + 60 && !monsterHitTriggered.current) {
            if (!isHiding) {
              // Crucial choice: check if player is holding/equipping Crucifix
              const equippedItem = inventory[selectedItemIdx];
              const pendantIdx = inventory.findIndex(item => item.type === 'pendant');

              if (equippedItem?.type === 'crucifix') {
                // BANISH ACTIVATED!
                monsterHitTriggered.current = true;
                banishActiveRef.current = true;
                setBanishActive(true);
                banishProgressRef.current = 0;
                
                if (!muted) sound.playBanish();
                // Consume Crucifix
                setInventory(prevInv => prevInv.filter((_, idx) => idx !== selectedItemIdx));
                
                floatingTextsRef.current.push({
                  x: playerPosition,
                  y: 180,
                  text: "CRUCIFIX BANISHMENT!",
                  color: "#3b82f6",
                  life: 150
                });
              } else if (pendantIdx !== -1) {
                // JEFF'S PENDANT BLOCKS DAMAGE PASSIVELY!
                monsterHitTriggered.current = true;
                
                // Consume the pendant from inventory
                setInventory(prevInv => prevInv.filter((_, idx) => idx !== pendantIdx));
                
                if (!muted) sound.playHeal(); // protective chime
                
                floatingTextsRef.current.push({
                  x: playerPosition,
                  y: 180,
                  text: "PENDANT SHIELDED YOU! 🛡️",
                  color: "#60a5fa",
                  life: 150
                });
                setAlertMessage("JEFF'S LUCKY PENDANT SHATTERED BUT SAVED YOUR LIFE!");
                setTimeout(() => setAlertMessage(""), 3500);
              } else {
                // Take Damage
                monsterHitTriggered.current = true;
                setHealth(prevHealth => {
                  const dmg = activeMonsterType === 'AMBUSH' ? 65 : 50;
                  const nextHealth = Math.max(0, prevHealth - dmg);
                  if (nextHealth <= 0) {
                    setGameState('GAMEOVER');
                    onGameOver(activeMonsterType);
                  } else {
                    // Flash notification of impact
                    floatingTextsRef.current.push({
                      x: playerPosition,
                      y: 220,
                      text: `-${dmg} HEALTH 💀`,
                      color: "#ef4444",
                      life: 90
                    });
                    if (!muted) sound.playDeath(); // scary screech
                  }
                  return nextHealth;
                });
              }
            }
          }

          // Ambush Rebounding Mechanics
          if (activeMonsterType === 'AMBUSH') {
            if (ambushDirRef.current === 1 && next > 1100) {
              if (ambushCyclesRef.current > 0) {
                ambushDirRef.current = -1; // reverse back left
                ambushCyclesRef.current -= 1;
                monsterHitTriggered.current = false; // reset hit trigger
                if (!muted) sound.playAmbushScream(1.8);
                setAlertMessage("⚠️ AMBUSH REBOUNDS! STAY HIDDEN! ⚠️");
                setTimeout(() => setAlertMessage(""), 2000);
                floatingTextsRef.current.push({
                  x: playerPosition,
                  y: 120,
                  text: "AMBUSH REBOUNDS! 🔄",
                  color: "#10b981",
                  life: 80
                });
              } else {
                setMonsterActive(false);
                setIsFlickering(false);
                setRoomDarkened(false);
              }
            } else if (ambushDirRef.current === -1 && next < -250) {
              if (ambushCyclesRef.current > 0) {
                ambushDirRef.current = 1; // reverse back right
                ambushCyclesRef.current -= 1;
                monsterHitTriggered.current = false; // reset hit trigger
                if (!muted) sound.playAmbushScream(1.8);
                setAlertMessage("⚠️ AMBUSH REBOUNDS! STAY HIDDEN! ⚠️");
                setTimeout(() => setAlertMessage(""), 2000);
                floatingTextsRef.current.push({
                  x: playerPosition,
                  y: 120,
                  text: "AMBUSH REBOUNDS! 🔄",
                  color: "#10b981",
                  life: 80
                });
              } else {
                setMonsterActive(false);
                setIsFlickering(false);
                setRoomDarkened(false);
              }
            }
          } else {
            // Standard Rush behavior: just offscreen despawn
            if (next > 1100) {
              setMonsterActive(false);
              setIsFlickering(false);
              setRoomDarkened(false);
            }
          }
          return next;
        });
      }

      // Handle Crucifix Banishment ticks
      if (banishActiveRef.current) {
        banishProgressRef.current += 1;
        if (banishProgressRef.current >= 130) {
          // Banish complete
          banishActiveRef.current = false;
          setBanishActive(false);
          setMonsterActive(false);
          setIsFlickering(false);
          setRoomDarkened(false);
        }
      }

      // 3. Update floating texts
      floatingTextsRef.current.forEach(ft => {
        ft.y -= 0.8;
        ft.life -= 1;
      });
      floatingTextsRef.current = floatingTextsRef.current.filter(ft => ft.life > 0);

      // 3.5 Update Amazon Boxes physics and animations
      let itemsToAward: { type: ItemType; label: string; description: string }[] = [];
      let rechargeBattery = false;

      setAmazonBoxes(prev => {
        let changed = false;
        const next = prev.map(box => {
          if (box.door !== currentDoor) return box;
          
          let nextY = box.y;
          let nextVy = box.vy;
          let nextScaleX = box.scaleX;
          let nextScaleY = box.scaleY;
          let nextProgress = box.openProgress;
          let nextOpening = box.isOpening;
          let nextOpened = box.isOpened;
          let nextBeam = box.beamAlpha !== undefined ? box.beamAlpha : 1;
          
          // Beam alpha decay
          if (nextBeam > 0) {
            nextBeam = Math.max(0, nextBeam - 0.015);
          }
          
          // Physics
          if (nextY < box.targetY) {
            nextVy += 0.45; // Gravity
            nextY += nextVy;
            if (nextY >= box.targetY) {
              nextY = box.targetY;
              nextVy = -nextVy * 0.35; // Bounce
              if (Math.abs(nextVy) < 1) {
                nextVy = 0;
              }
              // Squash on landing impact
              nextScaleX = 1.25;
              nextScaleY = 0.75;
              
              if (!muted && Math.abs(nextVy) > 1.5) {
                sound.playClick();
              }
            }
            changed = true;
          } else {
            // Decay scales back to 1
            if (nextScaleX > 1) nextScaleX -= 0.04;
            if (nextScaleX < 1) nextScaleX = 1;
            if (nextScaleY < 1) nextScaleY += 0.04;
            if (nextScaleY > 1) nextScaleY = 1;
          }
          
          // Opening progress
          if (nextOpening) {
            nextProgress += 0.02; // Take ~0.8s
            if (nextProgress >= 1) {
              nextProgress = 1;
              nextOpening = false;
              nextOpened = true;
              
              // Safe side-effect-free unboxing check (prevents double unboxing from Strict Mode)
              if (!awardedBoxIdsRef.current.has(box.id)) {
                awardedBoxIdsRef.current.add(box.id);
                box.awarded = true;
                if (box.itemType === 'battery') {
                  rechargeBattery = true;
                } else {
                  itemsToAward.push({ type: box.itemType, label: box.itemLabel, description: box.itemDescription });
                }
              }
              
              if (!muted) {
                sound.playUnlock();
              }
              
              // Particles and texts
              floatingTextsRef.current.push({
                x: box.x,
                y: 220,
                text: box.itemType === 'battery' ? "FLASHLIGHT RECHARGED! ⚡" : `+1 ${box.itemLabel.toUpperCase()} 📦`,
                color: "#10b981",
                life: 130
              });
              
              for (let i = 0; i < 15; i++) {
                floatingTextsRef.current.push({
                  x: box.x + (Math.random() - 0.5) * 30,
                  y: box.targetY - Math.random() * 20,
                  text: ["✨", "📦", "🎉", "★", "⚡"][Math.floor(Math.random() * 5)],
                  color: ["#fbcfe8", "#fef08a", "#99f6e4", "#bfdbfe", "#fbbf24"][Math.floor(Math.random() * 5)],
                  life: 40 + Math.floor(Math.random() * 30)
                });
              }
            }
            changed = true;
          }
          
          if (nextY !== box.y || nextVy !== box.vy || nextScaleX !== box.scaleX || nextScaleY !== box.scaleY || nextProgress !== box.openProgress || nextOpening !== box.isOpening || nextOpened !== box.isOpened || nextBeam !== box.beamAlpha) {
            changed = true;
            return {
              ...box,
              y: nextY,
              vy: nextVy,
              scaleX: nextScaleX,
              scaleY: nextScaleY,
              openProgress: nextProgress,
              isOpening: nextOpening,
              isOpened: nextOpened,
              beamAlpha: nextBeam
            };
          }
          
          return box;
        });
        
        const filtered = next.filter(box => !box.isOpened);
        if (filtered.length !== prev.length || changed) {
          return filtered;
        }
        return prev;
      });

      // Apply the rewards safely OUTSIDE the state updater to avoid React side-effects
      if (rechargeBattery) {
        setFlashlightBattery(100);
      }
      itemsToAward.forEach(item => {
        addToInventory(item.type, item.label, item.description);
      });

      // Update Drones animations and physics
      setDrones(prevDrones => {
        if (prevDrones.length === 0) return prevDrones;
        let changed = false;
        const nextDrones = prevDrones.map(drone => {
          let nextX = drone.x;
          let nextY = drone.y;
          let nextState = drone.state;
          let nextTimer = drone.timer;

          if (nextState === 'FLYING_IN') {
            const dx = drone.targetX - drone.x;
            if (Math.abs(dx) > 4) {
              nextX += Math.sign(dx) * 4.5;
            } else {
              nextX = drone.targetX;
              nextState = 'HOVERING';
            }
            changed = true;
          } else if (nextState === 'HOVERING') {
            nextTimer -= 1;
            if (nextTimer <= 0) {
              nextState = 'DROPPING';
            }
            changed = true;
          } else if (nextState === 'DROPPING') {
            const newBox: AmazonBox = {
              id: drone.boxId,
              x: drone.targetX,
              y: drone.y + 30, // Drop from where it was hanging
              targetY: drone.targetY,
              vy: 2.0,
              scaleX: 1,
              scaleY: 1,
              itemType: drone.itemType,
              itemLabel: drone.itemLabel,
              itemDescription: drone.itemDescription,
              isOpening: false,
              isOpened: false,
              openProgress: 0,
              door: currentDoor,
              beamAlpha: 1.0
            };
            setAmazonBoxes(prevBoxes => [...prevBoxes, newBox]);
            if (!muted) sound.playClick();
            nextState = 'FLYING_AWAY';
            changed = true;
          } else if (nextState === 'FLYING_AWAY') {
            nextX += 5.5;
            nextY -= 2.5;
            changed = true;
          }

          return {
            ...drone,
            x: nextX,
            y: nextY,
            state: nextState,
            timer: nextTimer
          };
        });

        const filteredDrones = nextDrones.filter(d => d.state !== 'FLYING_AWAY' || d.x < 950);
        if (filteredDrones.length !== prevDrones.length || changed) {
          return filteredDrones;
        }
        return prevDrones;
      });

      // Render loop
      draw();

      animationId = requestAnimationFrame(update);
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Save context to restore later and prevent screen shifting glitches
      ctx.save();

      // Screen Shake during monster rush (applied to the entire canvas frame)
      if (monsterActive && Math.random() > 0.3) {
        const dx = (Math.random() - 0.5) * 11;
        const dy = (Math.random() - 0.5) * 11;
        ctx.translate(dx, dy);
      }

      // Clear
      ctx.clearRect(0, 0, width, height);

      if (inSideRoom) {
        // Draw Side Room Background (Mysterious grey/green walls and concrete floor)
        ctx.fillStyle = '#2d3748'; // Cool dark slate walls
        ctx.fillRect(0, 0, width, height - 80);

        // Grid brick patterns on walls
        ctx.strokeStyle = '#1a202c';
        ctx.lineWidth = 1;
        for (let x = 0; x <= width; x += 100) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height - 80);
          ctx.stroke();
        }

        // Draw Dynamic Paintings for Side Room
        roomPaintings.filter(p => p.isSideRoom).forEach(p => {
          let frameColor = '#1e293b'; 
          let canvasBg = '#000000';
          let borderThick = 2.5;

          if (p.type === 'eye') {
            frameColor = '#b45309'; 
            canvasBg = '#090d16'; 
          } else if (p.type === 'moon') {
            frameColor = '#1e293b'; 
            canvasBg = '#064e3b'; 
          } else if (p.type === 'smile') {
            frameColor = '#4c1d95'; 
            canvasBg = '#030712'; 
          } else if (p.type === 'scream') {
            frameColor = '#9a3412'; 
            canvasBg = '#7c2d12'; 
          } else if (p.type === 'portrait') {
            frameColor = '#d97706'; 
            canvasBg = '#374151'; 
          }

          ctx.fillStyle = frameColor;
          ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = borderThick;
          ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);

          ctx.fillStyle = canvasBg;
          ctx.fillRect(p.x + 4, p.y + 4, p.w - 8, p.h - 8);

          if (p.type === 'eye') {
            const cx = p.x + p.w / 2;
            const cy = p.y + p.h / 2;
            ctx.strokeStyle = '#1e1b4b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, p.w * 0.22, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(cx - p.w * 0.25, cy);
            ctx.quadraticCurveTo(cx, cy - p.h * 0.1, cx + p.w * 0.25, cy);
            ctx.quadraticCurveTo(cx, cy + p.h * 0.1, cx - p.w * 0.25, cy);
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(cx, cy, p.w * 0.08, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx - 1.5, cy - 1.5, 1, 0, Math.PI * 2);
            ctx.fill();
          } 
          else if (p.type === 'moon') {
            ctx.fillStyle = '#022c22';
            ctx.beginPath();
            ctx.moveTo(p.x + 4, p.y + p.h - 4);
            ctx.lineTo(p.x + p.w / 2, p.y + p.h / 2 + 5);
            ctx.lineTo(p.x + p.w - 4, p.y + p.h - 4);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(p.x + p.w - 15, p.y + 18, p.w * 0.09, 0, Math.PI * 2);
            ctx.fill();
          } 
          else if (p.type === 'smile') {
            const cx = p.x + p.w / 2;
            const cy = p.y + p.h / 2;
            ctx.fillStyle = '#c084fc';
            ctx.beginPath();
            ctx.arc(cx - 8, cy - 6, 2, 0, Math.PI * 2);
            ctx.arc(cx + 8, cy - 6, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#e9d5ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy + 2, 7, 0, Math.PI);
            ctx.stroke();
          } 
          else if (p.type === 'scream') {
            const cx = p.x + p.w / 2;
            const cy = p.y + p.h / 2;
            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cx, p.y + 15, 10, Math.PI, 0);
            ctx.stroke();

            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 12, 6, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 5, 3.5, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(cx - 1.5, cy + 4, 1, 0, Math.PI * 2);
            ctx.arc(cx + 1.5, cy + 4, 1, 0, Math.PI * 2);
            ctx.ellipse(cx, cy + 7, 1, 2, 0, 0, Math.PI * 2);
            ctx.fill();
          } 
          else if (p.type === 'portrait') {
            const cx = p.x + p.w / 2;
            const cy = p.y + p.h / 2;
            ctx.fillStyle = '#991b1b';
            ctx.beginPath();
            ctx.moveTo(p.x + 6, p.y + p.h - 4);
            ctx.quadraticCurveTo(cx, cy + 8, p.x + p.w - 6, p.y + p.h - 4);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx - 4, cy + 8);
            ctx.lineTo(cx, cy + 13);
            ctx.lineTo(cx + 4, cy + 8);
            ctx.stroke();

            ctx.fillStyle = '#111827';
            ctx.beginPath();
            ctx.moveTo(cx - 1.5, cy + 13);
            ctx.lineTo(cx + 1.5, cy + 13);
            ctx.lineTo(cx, cy + 22);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.arc(cx, cy + 1, 6.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(p.x + p.w / 2 - 16, p.y + p.h - 14, 32, 7);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(p.x + p.w / 2 - 16, p.y + p.h - 14, 32, 7);
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(p.title, p.x + p.w / 2, p.y + p.h - 9);
        });

        // Baseboards
        ctx.fillStyle = '#111317';
        ctx.fillRect(0, height - 95, width, 15);

        // Floor (Dark cold concrete or plush carpet)
        if (hasCarpet && carpetStyle) {
          ctx.fillStyle = carpetStyle.color;
          ctx.fillRect(0, height - 80, width, 80);

          // Top edge border
          ctx.fillStyle = carpetStyle.borderColor;
          ctx.fillRect(0, height - 80, width, 4);

          // Carpet Patterns
          if (carpetStyle.pattern === 'striped') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 4;
            for (let x = 0; x < width; x += 40) {
              ctx.beginPath();
              ctx.moveTo(x, height - 80);
              ctx.lineTo(x + 20, height);
              ctx.stroke();
            }
          } else if (carpetStyle.pattern === 'ornate') {
            ctx.strokeStyle = carpetStyle.borderColor;
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            for (let y = height - 70; y < height; y += 20) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(width, y);
              ctx.stroke();
            }
            ctx.setLineDash([]); 
          }
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, height - 80, width, 80);

          // Concrete textures/cracks
          ctx.strokeStyle = '#111317';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(120, height - 40); ctx.lineTo(160, height - 25);
          ctx.moveTo(520, height - 60); ctx.lineTo(540, height - 70);
          ctx.stroke();
        }

        // Draw Return Door on Left (Grey with Green Stripe)
        const retDoorX = 140;
        const retDoorY = height - 240;
        const retDoorW = 80;
        const retDoorH = 160;

        // Frame
        ctx.fillStyle = '#111317';
        ctx.fillRect(retDoorX - 6, retDoorY - 6, retDoorW + 12, retDoorH + 6);

        // Door body (Grey)
        ctx.fillStyle = '#4b5563';
        ctx.fillRect(retDoorX, retDoorY, retDoorW, retDoorH);

        // Vertical Green Stripe
        ctx.fillStyle = '#10b981'; // Vivid green stripe
        ctx.fillRect(retDoorX + retDoorW / 2 - 8, retDoorY, 16, retDoorH);

        // Gold Knob
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(retDoorX + 12, retDoorY + retDoorH / 2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Label Plate
        ctx.fillStyle = '#111317';
        ctx.fillRect(retDoorX + retDoorW / 2 - 18, retDoorY + 20, 36, 15);
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("EXIT", retDoorX + retDoorW / 2, retDoorY + 31);

        // Exit Prompt
        if (Math.abs(playerPosition - retDoorX) < 45) {
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText("RETURN [E]", retDoorX + retDoorW / 2, retDoorY - 15);
          ctx.beginPath();
          ctx.moveTo(retDoorX + retDoorW / 2, retDoorY - 4);
          ctx.lineTo(retDoorX + retDoorW / 2 - 4, retDoorY - 10);
          ctx.lineTo(retDoorX + retDoorW / 2 + 4, retDoorY - 10);
          ctx.closePath();
          ctx.fill();
        }

        // Draw Mysterious Locked Chest on the Right
        const chestX = 600;
        const chestY = height - 130;
        
        // Draw Chest Body
        ctx.fillStyle = sideRoomChestUnlocked ? '#10b981' : '#4b5563';
        ctx.fillRect(chestX - 30, chestY, 60, 50);
        ctx.strokeStyle = '#111317';
        ctx.lineWidth = 3;
        ctx.strokeRect(chestX - 30, chestY, 60, 50);

        // Iron bands
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(chestX - 22, chestY, 6, 50);
        ctx.fillRect(chestX + 16, chestY, 6, 50);

        // Padlock or open latch
        if (sideRoomChestUnlocked) {
          // Open Latch
          ctx.fillStyle = '#10b981';
          ctx.fillRect(chestX - 6, chestY + 15, 12, 12);
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText("UNLOCKED", chestX, chestY - 15);
        } else {
          // Locked Padlock
          ctx.fillStyle = '#fbbf24'; // Gold Lock body
          ctx.fillRect(chestX - 8, chestY + 12, 16, 14);
          ctx.strokeStyle = '#d97706';
          ctx.strokeRect(chestX - 8, chestY + 12, 16, 14);

          // Shackle
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(chestX, chestY + 12, 6, Math.PI, 0);
          ctx.stroke();

          // Search Indicator Arrow for Chest
          if (Math.abs(playerPosition - chestX) < 55) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText("UNLOCK CHEST [E]", chestX, chestY - 15);
            ctx.beginPath();
            ctx.moveTo(chestX, chestY - 4);
            ctx.lineTo(chestX - 4, chestY - 10);
            ctx.lineTo(chestX + 4, chestY - 10);
            ctx.closePath();
            ctx.fill();
          }
        }

        // Hanging Ceiling Light for Side Room
        ctx.strokeStyle = '#718096';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(width / 2, 0); ctx.lineTo(width / 2, 60); ctx.stroke();
        
        ctx.fillStyle = '#4a5568';
        ctx.fillRect(width / 2 - 8, 60, 16, 12);
        
        ctx.fillStyle = 'rgba(16, 185, 129, 0.9)'; // Green stripe glow
        ctx.fillRect(width / 2 - 5, 66, 10, 8);

        // Radial green light beam
        const sideGlow = ctx.createRadialGradient(width / 2, 70, 5, width / 2, 70, 160);
        sideGlow.addColorStop(0, 'rgba(16, 185, 129, 0.22)');
        sideGlow.addColorStop(1, 'rgba(16, 185, 129, 0.0)');
        ctx.fillStyle = sideGlow;
        ctx.beginPath();
        ctx.arc(width / 2, 70, 160, 0, Math.PI * 2);
        ctx.fill();

      } else {
        // Draw Room Background
        ctx.fillStyle = currentDoor === 40 ? '#27272a' : '#1e1e24'; // Cozy charcoal for shop
        ctx.fillRect(0, 0, width, height - 80);

        // Perspective Wall columns
        ctx.strokeStyle = currentDoor === 40 ? '#18181b' : '#141418';
        ctx.lineWidth = 2;
        for (let i = 0; i <= width; i += 150) {
          ctx.strokeRect(i, 0, 1, height - 80);
        }

        // Draw Dynamic Paintings for Main Room
        roomPaintings.filter(p => !p.isSideRoom).forEach(p => {
          let frameColor = '#1e293b'; 
          let canvasBg = '#000000';
          let borderThick = 2.5;

          if (p.type === 'eye') {
            frameColor = '#b45309'; 
            canvasBg = '#090d16'; 
          } else if (p.type === 'moon') {
            frameColor = '#1e293b'; 
            canvasBg = '#064e3b'; 
          } else if (p.type === 'smile') {
            frameColor = '#4c1d95'; 
            canvasBg = '#030712'; 
          } else if (p.type === 'scream') {
            frameColor = '#9a3412'; 
            canvasBg = '#7c2d12'; 
          } else if (p.type === 'portrait') {
            frameColor = '#d97706'; 
            canvasBg = '#374151'; 
          }

          ctx.fillStyle = frameColor;
          ctx.fillRect(p.x, p.y, p.w, p.h);
          ctx.strokeStyle = '#020617';
          ctx.lineWidth = borderThick;
          ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);

          ctx.fillStyle = canvasBg;
          ctx.fillRect(p.x + 4, p.y + 4, p.w - 8, p.h - 8);

          if (p.type === 'eye') {
            const cx = p.x + p.w / 2;
            const cy = p.y + p.h / 2;
            ctx.strokeStyle = '#1e1b4b';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, p.w * 0.22, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(cx - p.w * 0.25, cy);
            ctx.quadraticCurveTo(cx, cy - p.h * 0.1, cx + p.w * 0.25, cy);
            ctx.quadraticCurveTo(cx, cy + p.h * 0.1, cx - p.w * 0.25, cy);
            ctx.closePath();
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(cx, cy, p.w * 0.08, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(cx - 1.5, cy - 1.5, 1, 0, Math.PI * 2);
            ctx.fill();
          } 
          else if (p.type === 'moon') {
            ctx.fillStyle = '#022c22';
            ctx.beginPath();
            ctx.moveTo(p.x + 4, p.y + p.h - 4);
            ctx.lineTo(p.x + p.w / 2, p.y + p.h / 2 + 5);
            ctx.lineTo(p.x + p.w - 4, p.y + p.h - 4);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(p.x + p.w - 15, p.y + 18, p.w * 0.09, 0, Math.PI * 2);
            ctx.fill();
          } 
          else if (p.type === 'smile') {
            const cx = p.x + p.w / 2;
            const cy = p.y + p.h / 2;
            ctx.fillStyle = '#c084fc';
            ctx.beginPath();
            ctx.arc(cx - 8, cy - 6, 2, 0, Math.PI * 2);
            ctx.arc(cx + 8, cy - 6, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#e9d5ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy + 2, 7, 0, Math.PI);
            ctx.stroke();
          } 
          else if (p.type === 'scream') {
            const cx = p.x + p.w / 2;
            const cy = p.y + p.h / 2;
            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(cx, p.y + 15, 10, Math.PI, 0);
            ctx.stroke();

            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 12, 6, 14, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 5, 3.5, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(cx - 1.5, cy + 4, 1, 0, Math.PI * 2);
            ctx.arc(cx + 1.5, cy + 4, 1, 0, Math.PI * 2);
            ctx.ellipse(cx, cy + 7, 1, 2, 0, 0, Math.PI * 2);
            ctx.fill();
          } 
          else if (p.type === 'portrait') {
            const cx = p.x + p.w / 2;
            const cy = p.y + p.h / 2;
            ctx.fillStyle = '#991b1b';
            ctx.beginPath();
            ctx.moveTo(p.x + 6, p.y + p.h - 4);
            ctx.quadraticCurveTo(cx, cy + 8, p.x + p.w - 6, p.y + p.h - 4);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(cx - 4, cy + 8);
            ctx.lineTo(cx, cy + 13);
            ctx.lineTo(cx + 4, cy + 8);
            ctx.stroke();

            ctx.fillStyle = '#111827';
            ctx.beginPath();
            ctx.moveTo(cx - 1.5, cy + 13);
            ctx.lineTo(cx + 1.5, cy + 13);
            ctx.lineTo(cx, cy + 22);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#1e1b4b';
            ctx.beginPath();
            ctx.arc(cx, cy + 1, 6.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(p.x + p.w / 2 - 16, p.y + p.h - 14, 32, 7);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(p.x + p.w / 2 - 16, p.y + p.h - 14, 32, 7);
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 5px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(p.title, p.x + p.w / 2, p.y + p.h - 9);
        });

      // Baseboards
      ctx.fillStyle = '#0f0f13';
      ctx.fillRect(0, height - 95, width, 15);

      // Floor (dirty rustic wood planks OR dynamic carpet)
      if (hasCarpet && carpetStyle) {
        ctx.fillStyle = carpetStyle.color;
        ctx.fillRect(0, height - 80, width, 80);

        // Top edge border
        ctx.fillStyle = carpetStyle.borderColor;
        ctx.fillRect(0, height - 80, width, 4);

        // Carpet Patterns
        if (carpetStyle.pattern === 'striped') {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
          ctx.lineWidth = 4;
          for (let x = 0; x < width; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, height - 80);
            ctx.lineTo(x + 20, height);
            ctx.stroke();
          }
        } else if (carpetStyle.pattern === 'ornate') {
          ctx.strokeStyle = carpetStyle.borderColor;
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 5]);
          for (let y = height - 70; y < height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
          }
          ctx.setLineDash([]); 
        }
      } else {
        ctx.fillStyle = currentDoor === 40 ? '#3f2b20' : '#2d211a'; // Warm wood floor for shop
        ctx.fillRect(0, height - 80, width, 80);

        // Floor lines
        ctx.strokeStyle = '#1d1510';
        ctx.lineWidth = 1;
        for (let y = height - 80; y < height; y += 16) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }

      // Draw Skull on the ground (rarely, 15% chance, if not interacted)
      if (hasSkull && !skullInteracted) {
        const sx = skullX;
        const sy = height - 92; // sits on the floor

        // Skull dome
        ctx.fillStyle = '#f1f5f9'; // cream-white
        ctx.beginPath();
        ctx.arc(sx, sy, 7, Math.PI, 0); // half circle dome
        ctx.fill();

        // Jaw base
        ctx.fillRect(sx - 4.5, sy, 9, 5);

        // Eye sockets
        ctx.fillStyle = '#0f172a'; // dark void
        ctx.beginPath();
        ctx.arc(sx - 2.5, sy - 1, 1.8, 0, Math.PI * 2);
        ctx.arc(sx + 2.5, sy - 1, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Nose cavity
        ctx.beginPath();
        ctx.moveTo(sx, sy + 1.2);
        ctx.lineTo(sx - 1, sy + 3);
        ctx.lineTo(sx + 1, sy + 3);
        ctx.closePath();
        ctx.fill();

        // Teeth lines
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(sx - 2.5, sy + 3);
        ctx.lineTo(sx - 2.5, sy + 5);
        ctx.moveTo(sx, sy + 3);
        ctx.lineTo(sx, sy + 5);
        ctx.moveTo(sx + 2.5, sy + 3);
        ctx.lineTo(sx + 2.5, sy + 5);
        ctx.stroke();

        // Golden glimmer star above the skull
        const pulse = Math.abs(Math.sin(Date.now() / 250)) * 4;
        ctx.fillStyle = '#eab308'; // gold
        ctx.beginPath();
        ctx.moveTo(sx, sy - 12 - pulse);
        ctx.lineTo(sx - 2, sy - 10 - pulse);
        ctx.lineTo(sx, sy - 8 - pulse);
        ctx.lineTo(sx + 2, sy - 10 - pulse);
        ctx.closePath();
        ctx.fill();

        // Skull Interaction Prompt
        if (Math.abs(playerPosition - sx) < 40) {
          ctx.fillStyle = '#f87171'; // soft red/gold spooky font
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText("CRUSH SKULL [E]", sx, sy - 18);
          ctx.beginPath();
          ctx.moveTo(sx, sy - 10);
          ctx.lineTo(sx - 4, sy - 14);
          ctx.lineTo(sx + 4, sy - 14);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Draw Ceiling Lights
      const bulbColor = isFlickering 
        ? (Math.random() > 0.4 ? 'rgba(253, 224, 71, 0.95)' : 'rgba(100, 100, 100, 0.1)')
        : (roomDarkened ? 'rgba(50, 50, 50, 0.1)' : 'rgba(253, 224, 71, 0.7)');

      if (currentDoor !== 40) {
        // Normal light fixture
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(width / 2 - 25, 0, 50, 8);
        ctx.beginPath();
        ctx.arc(width / 2, 8, 12, 0, Math.PI);
        ctx.fill();

        ctx.fillStyle = bulbColor;
        ctx.beginPath();
        ctx.arc(width / 2, 12, 7, 0, Math.PI * 2);
        ctx.fill();

        // Beam
        if (!roomDarkened && bulbColor !== 'rgba(100, 100, 100, 0.1)') {
          const grad = ctx.createLinearGradient(width / 2, 15, width / 2, height - 80);
          grad.addColorStop(0, 'rgba(253, 224, 71, 0.28)');
          grad.addColorStop(1, 'rgba(253, 224, 71, 0.0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(width / 2 - 8, 15);
          ctx.lineTo(width / 2 + 8, 15);
          ctx.lineTo(width / 2 + 180, height - 80);
          ctx.lineTo(width / 2 - 180, height - 80);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // Door 40 Cozy Lantern hanging lights
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        // left cable
        ctx.beginPath(); ctx.moveTo(250, 0); ctx.lineTo(250, 40); ctx.stroke();
        // right cable
        ctx.beginPath(); ctx.moveTo(650, 0); ctx.lineTo(650, 40); ctx.stroke();

        // Lanterns
        [250, 650].forEach(lx => {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(lx - 12, 40, 24, 30);
          // Cozy warm glow bulbs
          ctx.fillStyle = 'rgba(251, 146, 60, 0.9)'; // Amber glow
          ctx.fillRect(lx - 8, 48, 16, 18);

          // Radial Glow
          const grad = ctx.createRadialGradient(lx, 55, 10, lx, 55, 120);
          grad.addColorStop(0, 'rgba(251, 146, 60, 0.35)');
          grad.addColorStop(1, 'rgba(251, 146, 60, 0.0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(lx, 55, 120, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Draw Drawers (Wooden chest)
      drawers.forEach(drawer => {
        const dy = height - 130;
        // Drawer body
        ctx.fillStyle = '#78350f'; // rich brown wood
        ctx.fillRect(drawer.x - 22, dy, 44, 50);
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 3;
        ctx.strokeRect(drawer.x - 22, dy, 44, 50);

        // Individual drawer sliders
        for (let i = 0; i < 3; i++) {
          const sy = dy + 4 + i * 14;
          ctx.fillStyle = '#92400e';
          
          if (drawer.searched && i === 0) {
            // Searched: draw top drawer slightly pulled open (offset horizontally)
            ctx.fillRect(drawer.x - 20 - 6, sy, 40, 10);
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 1;
            ctx.strokeRect(drawer.x - 20 - 6, sy, 40, 10);
            // Little shadow of inside
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(drawer.x - 20, sy, 6, 10);
          } else {
            ctx.fillRect(drawer.x - 20, sy, 40, 10);
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 1;
            ctx.strokeRect(drawer.x - 20, sy, 40, 10);
          }

          // Golden Knobs
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          const knobX = (drawer.searched && i === 0) ? (drawer.x - 6) : drawer.x;
          ctx.arc(knobX, sy + 5, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Tiny search indicator arrow
        if (!drawer.searched && Math.abs(playerPosition - drawer.x) < 75) {
          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText("SEARCH", drawer.x, dy - 15);
          ctx.beginPath();
          ctx.moveTo(drawer.x, dy - 4);
          ctx.lineTo(drawer.x - 4, dy - 10);
          ctx.lineTo(drawer.x + 4, dy - 10);
          ctx.closePath();
          ctx.fill();
        }
      });

      // Draw Amazon Boxes
      amazonBoxes.forEach(box => {
        if (box.door !== currentDoor) return;

        ctx.save();
        
        // Wobble/shake when opening
        let shakeX = 0;
        let shakeY = 0;
        if (box.isOpening) {
          shakeX = (Math.random() - 0.5) * 4;
          shakeY = (Math.random() - 0.5) * 2;
        }

        // Move coordinate system to bottom-center of the box for proper squash/stretch from ground
        const boxBaseY = box.y + 14; // y is the center, box is 28px tall
        ctx.translate(box.x + shakeX, boxBaseY + shakeY);
        ctx.scale(box.scaleX, box.scaleY);

        // Draw a light glowing beam shooting up to the sky (Amazon delivery portal!)
        if (!box.isOpened && box.beamAlpha !== undefined && box.beamAlpha > 0.01) {
          const grad = ctx.createLinearGradient(0, -14, 0, -250);
          grad.addColorStop(0, `rgba(6, 182, 212, ${0.4 * box.beamAlpha})`);
          grad.addColorStop(1, `rgba(6, 182, 212, 0)`);
          ctx.fillStyle = grad;
          ctx.fillRect(-20, -250, 40, 236);
        }

        // Draw shadow under the box
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Standard Cardboard Brown body
        // Box is centered on (0, -14) relative to translated base
        const bW = 34;
        const bH = 28;
        const bX = -bW / 2;
        const bY = -bH;

        // Front face (cardboard base)
        ctx.fillStyle = '#b45309'; // Rich Cardboard Brown
        ctx.fillRect(bX, bY, bW, bH);

        // Smile Logo (Amazon theme!)
        ctx.strokeStyle = '#1e293b'; // Slate/black
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        // Draw the curved arrow (smile)
        ctx.arc(0, bY + 16, 7, 0.2 * Math.PI, 0.8 * Math.PI);
        ctx.stroke();
        
        // Smile arrow head
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(4.5, bY + 18);
        ctx.lineTo(8.5, bY + 18.5);
        ctx.lineTo(7, bY + 15);
        ctx.closePath();
        ctx.fill();

        // White shipping label
        ctx.fillStyle = '#f8fafc'; // Crisp label
        ctx.fillRect(-12, bY + 3, 7, 5);
        ctx.fillStyle = '#475569'; // Tiny text lines on label
        ctx.fillRect(-11, bY + 4, 5, 0.8);
        ctx.fillRect(-11, bY + 6, 4, 0.8);

        // Top sealing tape (dark brown)
        ctx.fillStyle = '#451a03'; // Dark chocolate brown tape
        ctx.fillRect(-3, bY, 6, bH);

        // Draw Flaps (left and right)
        // If progress is > 0, flaps tilt outwards
        const progress = box.openProgress;
        ctx.save();
        ctx.fillStyle = '#ca8a04'; // Lighter flap interior/exterior
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#78350f';

        // Left Flap
        ctx.save();
        ctx.translate(bX, bY);
        const leftFlapAngle = -progress * Math.PI * 0.75; // tilts up to 135 degrees
        ctx.rotate(leftFlapAngle);
        ctx.fillRect(0, -2, bW / 2, 4);
        ctx.strokeRect(0, -2, bW / 2, 4);
        ctx.restore();

        // Right Flap
        ctx.save();
        ctx.translate(bX + bW, bY);
        const rightFlapAngle = progress * Math.PI * 0.75; // tilts up to 135 degrees
        ctx.rotate(rightFlapAngle);
        ctx.fillRect(-bW / 2, -2, bW / 2, 4);
        ctx.strokeRect(-bW / 2, -2, bW / 2, 4);
        ctx.restore();

        ctx.restore();

        // If open progress is high, draw the item emerging with a glow!
        if (progress > 0.15) {
          ctx.save();
          const itemY = bY - (progress * 15);
          
          // Outer magical glow ring
          ctx.strokeStyle = `rgba(34, 211, 238, ${progress})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.arc(0, itemY, 14, 0, Math.PI * 2);
          ctx.stroke();

          // Draw a small icon/shape representing the item!
          ctx.fillStyle = '#22d3ee'; // Cyber cyan item placeholder
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          let itemEmoji = "🎁";
          if (box.itemType === 'bandage') itemEmoji = "❤️";
          else if (box.itemType === 'lockpick') itemEmoji = "🔑";
          else if (box.itemType === 'cola') itemEmoji = "⚡";
          else if (box.itemType === 'crucifix') itemEmoji = "✝️";
          else if (box.itemType === 'radio') itemEmoji = "📻";
          else if (box.itemType === 'battery') itemEmoji = "🔋";
          else if (box.itemType === 'luck_potion') itemEmoji = "🍀";
          else if (box.itemType === 'skeleton_key') itemEmoji = "🗝️";
          else if (box.itemType === 'pendant') itemEmoji = "📿";
          else if (box.itemType === 'vitamins') itemEmoji = "💊";
          else if (box.itemType === 'ipad') itemEmoji = "📱";
          
          ctx.fillText(itemEmoji, 0, itemY);
          ctx.restore();
        }

        ctx.restore();

        // Draw indicator prompts above the box (non-scaled)
        const isNear = Math.abs(playerPosition - box.x) < 45;
        ctx.textAlign = 'center';
        
        if (isNear) {
          ctx.fillStyle = '#22d3ee'; // bright cyber cyan
          ctx.font = 'bold 8px monospace';
          ctx.fillText("TAP OR [E] TO UNBOX!", box.x, box.y - 25);
          
          // Tiny pulse chevron
          const bounce = Math.sin(Date.now() / 150) * 3;
          ctx.fillStyle = '#22d3ee';
          ctx.beginPath();
          ctx.moveTo(box.x, box.y - 14 + bounce);
          ctx.lineTo(box.x - 3, box.y - 19 + bounce);
          ctx.lineTo(box.x + 3, box.y - 19 + bounce);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.fillStyle = '#a1a1aa'; // zinc
          ctx.font = 'bold 7px monospace';
          ctx.fillText("AMAZON DELIVERY", box.x, box.y - 24);
        }
      });

      // Draw Delivery Drones
      drones.forEach(drone => {
        ctx.save();
        
        const dx = drone.x;
        const dy = drone.y;

        // Draw hanging wire ropes if carrying the box
        if (drone.state === 'FLYING_IN' || drone.state === 'HOVERING') {
          ctx.strokeStyle = 'rgba(161, 161, 170, 0.6)'; // steel wire color
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(dx - 12, dy + 6);
          ctx.lineTo(dx - 8, dy + 28);
          ctx.moveTo(dx + 12, dy + 6);
          ctx.lineTo(dx + 8, dy + 28);
          ctx.stroke();

          // Draw a mini preview of the hanging Amazon Box!
          ctx.fillStyle = '#b45309'; // cardboard brown
          ctx.fillRect(dx - 10, dy + 28, 20, 16);
          ctx.fillStyle = '#1e293b'; // black/slate logo arc
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(dx, dy + 35, 3, 0.2 * Math.PI, 0.8 * Math.PI);
          ctx.stroke();
        }

        // Draw Drone Chassis
        ctx.fillStyle = '#18181b'; // Sleek dark zinc metal
        ctx.beginPath();
        ctx.roundRect(dx - 22, dy - 6, 44, 12, 4);
        ctx.fill();

        // Propeller Arms
        ctx.strokeStyle = '#3f3f46'; // lighter zinc metal
        ctx.lineWidth = 3;
        ctx.beginPath();
        // Top-left arm
        ctx.moveTo(dx - 14, dy - 4);
        ctx.lineTo(dx - 24, dy - 12);
        // Top-right arm
        ctx.moveTo(dx + 14, dy - 4);
        ctx.lineTo(dx + 24, dy - 12);
        ctx.stroke();

        // Spinning Propellers (animated)
        const rotation = (Date.now() / 35) % (Math.PI * 2);
        ctx.strokeStyle = 'rgba(161, 161, 170, 0.7)'; // Propeller blades semi-transparent
        ctx.lineWidth = 1.5;

        // Left prop
        ctx.save();
        ctx.translate(dx - 24, dy - 12);
        ctx.rotate(rotation);
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        ctx.restore();

        // Right prop
        ctx.save();
        ctx.translate(dx + 24, dy - 12);
        ctx.rotate(rotation + Math.PI / 2); // offset a bit
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.stroke();
        ctx.restore();

        // Glowing cyan delivery camera/lens (looks futuristic and high tech!)
        ctx.fillStyle = '#22d3ee';
        ctx.beginPath();
        ctx.arc(dx, dy + 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Flashing navigation status beacon (Red/Green blinking)
        const blink = Math.floor(Date.now() / 250) % 2 === 0;
        ctx.fillStyle = blink ? '#ef4444' : '#22c55e';
        ctx.beginPath();
        ctx.arc(dx - 12, dy - 6, 2, 0, Math.PI * 2);
        ctx.arc(dx + 12, dy - 6, 2, 0, Math.PI * 2);
        ctx.fill();

        // Subtle thrust glow underneath propellers
        const thrustGrad = ctx.createLinearGradient(0, 0, 0, 15);
        thrustGrad.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
        thrustGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = thrustGrad;
        ctx.fillRect(dx - 26, dy - 10, 4, 12);
        ctx.fillRect(dx + 22, dy - 10, 4, 12);

        ctx.restore();
      });

      // Draw Door 40: Friendly Shopkeeper Jeff Room
      if (currentDoor === 40) {
        const cx = 450;
        const cy = height - 135;

        // Counter desk
        ctx.fillStyle = '#78350f';
        ctx.fillRect(cx - 60, cy, 120, 55);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(cx - 65, cy - 4, 130, 6); // Countertop

        // Candle on counter
        ctx.fillStyle = '#ef4444'; // Red candle
        ctx.fillRect(cx - 45, cy - 20, 8, 16);
        ctx.fillStyle = '#f59e0b'; // Flame
        ctx.beginPath();
        ctx.ellipse(cx - 41, cy - 24 + (Math.random() * 2), 3, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Jeff the monster sitting behind table
        const jeffBob = Math.sin(Date.now() / (showShop ? 180 : 350)) * (showShop ? 5 : 2.5);
        const isBlinking = (Date.now() % 4000) < 180;

        // Purple body blob
        ctx.fillStyle = '#6366f1'; // Indigo purple
        ctx.beginPath();
        ctx.arc(cx, cy - 25 + jeffBob, 28, Math.PI, 0); // half circle body
        ctx.fill();
        ctx.fillRect(cx - 28, cy - 25 + jeffBob, 56, 12);

        // Tiny Fez Hat (bobs and tilts slightly!)
        const fezTilt = Math.sin(Date.now() / 250) * 0.08;
        ctx.save();
        ctx.translate(cx, cy - 56 + jeffBob);
        ctx.rotate(fezTilt);
        ctx.fillStyle = '#dc2626'; // Red fez
        ctx.fillRect(-10, -5, 20, 10);
        ctx.strokeStyle = '#fbbf24'; // Golden tassel
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, -5); ctx.lineTo(12, 2); ctx.stroke();
        ctx.restore();

        // Big friendly cute eye (blinks!)
        if (isBlinking) {
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(cx, cy - 26 + jeffBob, 10, 0, Math.PI);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(cx, cy - 28 + jeffBob, 14, 0, Math.PI * 2);
          ctx.fill();
          // Pupil (follows the player position!)
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          const dx = playerPosition - cx;
          const lookX = Math.max(-4, Math.min(4, dx / 80));
          ctx.arc(cx + lookX, cy - 28 + jeffBob, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff'; // light shine
          ctx.beginPath();
          ctx.arc(cx + lookX + 2, cy - 30 + jeffBob, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cute smile (wiggles/widens when shop is open!)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const smileRadius = showShop ? 6 + Math.abs(Math.sin(Date.now() / 150)) * 2 : 4;
        ctx.arc(cx, cy - 14 + jeffBob, smileRadius, 0, Math.PI);
        ctx.stroke();

        // Shop signs
        ctx.fillStyle = '#06b6d4'; // Glowing neon blue
        ctx.font = 'bold 12px monospace';
        ctx.shadowColor = '#06b6d4';
        ctx.shadowBlur = 10;
        ctx.fillText("JEFF'S SHOP", cx, cy - 80 + jeffBob * 0.3); // Less bobbing for the overhead sign
        ctx.shadowBlur = 0;

        // Prompt helper
        if (Math.abs(playerPosition - cx) < 60 && !showShop) {
          ctx.fillStyle = '#06b6d4';
          ctx.font = 'bold 8px monospace';
          ctx.fillText("TAP / PRESS E TO OPEN", cx, cy - 105);
        }
      }

      // Draw Door 100 Workbench / Elevator
      if (currentDoor === 100) {
        // Workbench Cabinet
        ctx.fillStyle = '#27272a';
        ctx.fillRect(320, height - 140, 60, 60);
        ctx.fillStyle = '#18181b';
        ctx.fillRect(315, height - 145, 70, 8);
        ctx.fillStyle = '#52525b';
        ctx.fillRect(330, height - 130, 40, 15);

        // Toolbox
        ctx.fillStyle = hasNewSwitch ? '#3f3f46' : '#b91c1c';
        ctx.fillRect(335, height - 158, 30, 14);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(348, height - 154, 4, 4);

        if (!hasNewSwitch) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(350, height - 175);
          ctx.lineTo(345, height - 183);
          ctx.lineTo(355, height - 183);
          ctx.closePath();
          ctx.fill();
        }

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("CABINET", 350, height - 110);

        // Power Junction Box
        ctx.fillStyle = '#3f3f46';
        ctx.fillRect(530, height - 170, 40, 50);
        ctx.fillStyle = switchRepaired ? '#10b981' : '#b91c1c';
        ctx.beginPath();
        ctx.arc(550, height - 160, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#a1a1aa';
        ctx.font = '8px monospace';
        ctx.fillText("POWER BOX", 550, height - 135);

        if (hasNewSwitch && !switchRepaired) {
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(550, height - 190);
          ctx.lineTo(545, height - 198);
          ctx.lineTo(555, height - 198);
          ctx.closePath();
          ctx.fill();
        }

        // Elevator Shaft on the Right
        ctx.fillStyle = '#18181b';
        ctx.fillRect(720, height - 260, 140, 180);

        if (switchRepaired) {
          ctx.fillStyle = '#059669';
          ctx.fillRect(730, height - 240, 120, 160);

          ctx.fillStyle = '#a7f3d0';
          ctx.fillRect(780, height - 240, 20, 160);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px monospace';
          ctx.fillText("ESCAPE", 790, height - 220);

          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 4;
          ctx.strokeRect(730, height - 240, 120, 160);
        } else {
          ctx.fillStyle = '#3f3f46';
          ctx.fillRect(730, height - 240, 58, 160);
          ctx.fillRect(792, height - 240, 58, 160);

          ctx.fillStyle = '#18181b';
          ctx.fillRect(788, height - 240, 4, 160);

          ctx.fillStyle = '#d97706';
          ctx.fillRect(740, height - 180, 10, 40);
          ctx.fillRect(810, height - 180, 10, 40);

          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 10px monospace';
          ctx.fillText("OUT OF POWER", 790, height - 210);
        }
      } else if (currentDoor !== 40) {
        if (dupeActive && dupeDoors.length > 0) {
          // Render Dupe Doors
          dupeDoors.forEach(door => {
            const doorX = door.x;
            const doorY = height - 240;
            const doorW = 80;
            const doorH = 160;

            // Frame
            ctx.fillStyle = '#1c1917';
            ctx.fillRect(doorX - 6, doorY - 6, doorW + 12, doorH + 6);

            if (door.isOpened) {
              // Clawed up dark void
              ctx.fillStyle = '#090504';
              ctx.fillRect(doorX, doorY, doorW, doorH);

              ctx.strokeStyle = '#dc2626';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(doorX + 20, doorY + 45); ctx.lineTo(doorX + 35, doorY + 95);
              ctx.moveTo(doorX + 35, doorY + 45); ctx.lineTo(doorX + 45, doorY + 100);
              ctx.moveTo(doorX + 50, doorY + 50); ctx.lineTo(doorX + 60, doorY + 90);
              ctx.stroke();

              ctx.fillStyle = '#ef4444';
              ctx.font = 'bold 8px monospace';
              ctx.textAlign = 'center';
              ctx.fillText("DECOY", doorX + doorW / 2, doorY + doorH / 2);
            } else {
              ctx.fillStyle = '#7c2d12';
              ctx.fillRect(doorX, doorY, doorW, doorH);

              ctx.strokeStyle = '#4c1d0f';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(doorX + 20, doorY + 10); ctx.lineTo(doorX + 20, doorY + doorH - 10);
              ctx.moveTo(doorX + 60, doorY + 10); ctx.lineTo(doorX + 60, doorY + doorH - 10);
              ctx.stroke();

              ctx.fillStyle = '#fbbf24';
              ctx.beginPath();
              ctx.arc(doorX + 12, doorY + doorH / 2, 5, 0, Math.PI * 2);
              ctx.fill();

              // Plate with number
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(doorX + doorW / 2 - 18, doorY + 20, 36, 20);
              ctx.strokeStyle = '#d97706';
              ctx.strokeRect(doorX + doorW / 2 - 18, doorY + 20, 36, 20);

              ctx.fillStyle = '#f59e0b';
              ctx.font = 'bold 11px monospace';
              ctx.textAlign = 'center';
              ctx.fillText(String(door.doorNumber), doorX + doorW / 2, doorY + 34);
            }

            // Interactive prompt
            if (!door.isOpened && Math.abs(playerPosition - doorX) < 45) {
              ctx.fillStyle = '#ef4444';
              ctx.font = 'bold 8px monospace';
              ctx.textAlign = 'center';
              ctx.fillText("OPEN DOOR", doorX + doorW / 2, doorY - 15);
              ctx.beginPath();
              ctx.moveTo(doorX + doorW / 2, doorY - 4);
              ctx.lineTo(doorX + doorW / 2 - 4, doorY - 10);
              ctx.lineTo(doorX + doorW / 2 + 4, doorY - 10);
              ctx.closePath();
              ctx.fill();
            }
          });
        } else {
          // Standard room doorway on the right
          const doorX = 760;
          const doorY = height - 240;
          const doorW = 80;
          const doorH = 160;

          ctx.fillStyle = '#1c1917';
          ctx.fillRect(doorX - 6, doorY - 6, doorW + 12, doorH + 6);

          ctx.fillStyle = isDoorLocked ? '#3f3f46' : '#7c2d12';
          ctx.fillRect(doorX, doorY, doorW, doorH);

          ctx.strokeStyle = '#4c1d0f';
          ctx.lineWidth = 2;
          if (!isDoorLocked) {
            ctx.beginPath();
            ctx.moveTo(doorX + 20, doorY + 10); ctx.lineTo(doorX + 20, doorY + doorH - 10);
            ctx.moveTo(doorX + 60, doorY + 10); ctx.lineTo(doorX + 60, doorY + doorH - 10);
            ctx.stroke();
          }

          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(doorX + 12, doorY + doorH / 2, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(doorX + doorW / 2 - 18, doorY + 20, 36, 20);
          ctx.strokeStyle = '#d97706';
          ctx.strokeRect(doorX + doorW / 2 - 18, doorY + 20, 36, 20);

          ctx.fillStyle = '#f59e0b';
          ctx.font = 'bold 11px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(String(currentDoor), doorX + doorW / 2, doorY + 34);

          if (isDoorLocked) {
            ctx.strokeStyle = '#a1a1aa';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(doorX, doorY + 40); ctx.lineTo(doorX + doorW, doorY + doorH - 40);
            ctx.moveTo(doorX + doorW, doorY + 40); ctx.lineTo(doorX, doorY + doorH - 40);
            ctx.stroke();

            ctx.fillStyle = '#fbbf24';
            ctx.fillRect(doorX + doorW / 2 - 14, doorY + doorH / 2 - 10, 28, 20);
            ctx.beginPath();
            ctx.arc(doorX + doorW / 2, doorY + doorH / 2 - 10, 8, Math.PI, 0);
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 3;
            ctx.stroke();

            ctx.fillStyle = isRoomKeyLocked ? '#fbbf24' : '#ef4444';
            ctx.font = 'bold 8px monospace';
            ctx.fillText(isRoomKeyLocked ? "LOCKED" : "PUZZLE", doorX + doorW / 2, doorY + doorH / 2 + 4);
          }
        }

        // Draw Side Room Door if active (Grey with Green Stripe)
        if (hasSideRoom && sideRoomDoorX !== null) {
          const srx = sideRoomDoorX;
          const sry = height - 240;
          const srw = 80;
          const srh = 160;

          // Frame
          ctx.fillStyle = '#111317';
          ctx.fillRect(srx - 6, sry - 6, srw + 12, srh + 6);

          // Door body (Grey)
          ctx.fillStyle = '#4b5563';
          ctx.fillRect(srx, sry, srw, srh);

          // Vertical Green Stripe
          ctx.fillStyle = '#10b981'; // Vivid green stripe
          ctx.fillRect(srx + srw / 2 - 8, sry, 16, srh);

          // Gold Knob
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(srx + 12, sry + srh / 2, 5, 0, Math.PI * 2);
          ctx.fill();

          // Label Plate
          ctx.fillStyle = '#111317';
          ctx.fillRect(srx + srw / 2 - 25, sry + 20, 50, 15);
          ctx.fillStyle = '#10b981';
          ctx.font = 'bold 7px monospace';
          ctx.textAlign = 'center';
          ctx.fillText("CODE ROOM", srx + srw / 2, sry + 30);

          // Interactive prompt above the side-room door
          if (Math.abs(playerPosition - srx) < 45) {
            ctx.fillStyle = '#10b981';
            ctx.font = 'bold 8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText("ENTER [E]", srx + srw / 2, sry - 15);
            ctx.beginPath();
            ctx.moveTo(srx + srw / 2, sry - 4);
            ctx.lineTo(srx + srw / 2 - 4, sry - 10);
            ctx.lineTo(srx + srw / 2 + 4, sry - 10);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
      }

      // Draw Closets (Wardrobe cabinets)
      closetX.forEach(cx => {
        const cw = 55;
        const ch = 180;
        const cy = height - 235;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(cx - 3, cy - 3, cw + 6, ch + 3);

        ctx.fillStyle = '#475569';
        ctx.fillRect(cx, cy, cw, ch);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(cx + cw / 2 - 1.5, cy, 3, ch);

        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(cx + cw / 2 - 6, cy + ch / 2 - 15, 3, 30);
        ctx.fillRect(cx + cw / 2 + 3, cy + ch / 2 - 15, 3, 30);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText("CLOSET", cx + cw / 2, cy - 8);
      });

      // Draw Player Character (Stylized Survivor)
      if (!isHiding) {
        const px = playerPosition;
        const py = height - 140;

        const isPlayerMoving = !isHiding && !showFusePuzzle && !showSwitchPuzzle && !showShop && !showIpad && !banishActiveRef.current && (
          keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA'] ||
          keysPressed.current['ArrowRight'] || keysPressed.current['KeyD']
        );
        const walkCycle = isPlayerMoving ? (Date.now() / (isSprinting ? 80 : 130)) : 0;
        const playerBob = isPlayerMoving ? Math.abs(Math.sin(walkCycle)) * 4.5 : Math.sin(Date.now() / 350) * 1.5;
        const legSwing = isPlayerMoving ? Math.sin(walkCycle) * 8 : 0;

        // Shadow under player (shrinks slightly when bobbing up)
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        const shadowWidth = 20 - (playerBob * 0.5);
        ctx.ellipse(px, height - 76, Math.max(8, shadowWidth), 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sprinting aura effects
        if (isSprinting && stamina > 0) {
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
          ctx.lineWidth = 2;
          ctx.strokeRect(px - 16, py - 4 - playerBob, 32, 64);
        }

        // Torso / Jacket
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(px - 14, py - playerBob, 28, 45);

        // Pants (swinging with the legSwing walk cycle)
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(px - 11 - (isPlayerMoving ? legSwing * 0.3 : 0), py + 45 - playerBob, 9, 15);
        ctx.fillRect(px + 2 + (isPlayerMoving ? legSwing * 0.3 : 0), py + 45 - playerBob, 9, 15);

        // Boots (swinging with the legSwing walk cycle)
        ctx.fillStyle = '#000000';
        ctx.fillRect(px - 12 - (isPlayerMoving ? legSwing * 0.5 : 0), py + 58 - playerBob, 10, 6);
        ctx.fillRect(px + 2 + (isPlayerMoving ? legSwing * 0.5 : 0), py + 58 - playerBob, 10, 6);

        // Skin Head
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(px, py - 14 - playerBob, 12, 0, Math.PI * 2);
        ctx.fill();

        // Beanie Cap
        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.arc(px, py - 16 - playerBob, 12, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(px - 12, py - 20 - playerBob, 24, 6);

        // Eyes
        ctx.fillStyle = '#ffffff';
        const eyeOffset = playerFacing === 'right' ? 4 : -7;
        ctx.fillRect(px + eyeOffset, py - 16 - playerBob, 3, 3);
        ctx.fillStyle = '#000000';
        ctx.fillRect(px + eyeOffset + (playerFacing === 'right' ? 1 : 0), py - 16 - playerBob, 2, 3);

        // If holding bandage, show it in hand
        const equippedItem = inventory[selectedItemIdx];
        if (equippedItem?.type === 'bandage') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px + (playerFacing === 'right' ? 12 : -18), py + 18 - playerBob, 6, 6);
          ctx.strokeStyle = '#ef4444';
          ctx.strokeRect(px + (playerFacing === 'right' ? 12 : -18), py + 18 - playerBob, 6, 6);
        }

        // If holding radio, show it with musical waves
        if (equippedItem?.type === 'radio') {
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(px + (playerFacing === 'right' ? 10 : -16), py + 15 - playerBob, 8, 10);
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + (playerFacing === 'right' ? 12 : -14), py + 18 - playerBob, 4, 4);

          // Spark note waves
          if (Math.random() < 0.25) {
            ctx.fillStyle = '#67e8f9';
            ctx.font = '8px Arial';
            ctx.fillText("♫", px + (playerFacing === 'right' ? 24 : -30), py + (Math.random() * 20 - 10) - playerBob);
          }
        }

        // If holding Crucifix, draw glowing hand crucifix
        if (equippedItem?.type === 'crucifix') {
          ctx.fillStyle = '#fbbf24';
          // Draw vertical crossbar
          ctx.fillRect(px + (playerFacing === 'right' ? 12 : -16), py + 10 - playerBob, 4, 12);
          // Horizontal crossbar
          ctx.fillRect(px + (playerFacing === 'right' ? 9 : -19), py + 13 - playerBob, 10, 3);
          
          // Little ambient blue light around crucifix
          const rad = ctx.createRadialGradient(px + (playerFacing === 'right' ? 14 : -14), py + 16 - playerBob, 1, px + (playerFacing === 'right' ? 14 : -14), py + 16 - playerBob, 12);
          rad.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
          rad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');
          ctx.fillStyle = rad;
          ctx.beginPath();
          ctx.arc(px + (playerFacing === 'right' ? 14 : -14), py + 16 - playerBob, 12, 0, Math.PI*2);
          ctx.fill();
        }

        // If holding speed cola
        if (equippedItem?.type === 'cola') {
          ctx.fillStyle = '#f59e0b'; // Amber soda can
          ctx.fillRect(px + (playerFacing === 'right' ? 12 : -18), py + 16 - playerBob, 5, 8);
          ctx.fillStyle = '#ef4444'; // Red stripe
          ctx.fillRect(px + (playerFacing === 'right' ? 12 : -18), py + 19 - playerBob, 5, 2);
        }

        // If holding lockpick
        if (equippedItem?.type === 'lockpick') {
          ctx.fillStyle = '#d1d5db'; // Silver metallic
          ctx.fillRect(px + (playerFacing === 'right' ? 12 : -18), py + 18 - playerBob, 6, 3);
          ctx.fillStyle = '#f59e0b'; // Golden tip
          ctx.fillRect(px + (playerFacing === 'right' ? 18 : -14), py + 18 - playerBob, 2, 2);
        }

        // If holding luck potion
        if (equippedItem?.type === 'luck_potion') {
          ctx.fillStyle = '#10b981'; // Green liquid
          ctx.beginPath();
          ctx.arc(px + (playerFacing === 'right' ? 14 : -16), py + 19 - playerBob, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#d1d5db'; // Cork neck
          ctx.fillRect(px + (playerFacing === 'right' ? 13 : -15), py + 13 - playerBob, 2, 3);
        }

        // If holding skeleton key
        if (equippedItem?.type === 'skeleton_key') {
          ctx.fillStyle = '#a78bfa'; // Purple magic key
          ctx.fillRect(px + (playerFacing === 'right' ? 12 : -18), py + 16 - playerBob, 8, 3);
          ctx.fillRect(px + (playerFacing === 'right' ? 18 : -14), py + 19 - playerBob, 2, 4);
        }

        // If holding iPad
        if (equippedItem?.type === 'ipad') {
          ctx.fillStyle = '#1e293b'; // Slate iPad casing
          ctx.fillRect(px + (playerFacing === 'right' ? 11 : -21), py + 14 - playerBob, 10, 12);
          ctx.fillStyle = '#22d3ee'; // Glowing cyan screen
          ctx.fillRect(px + (playerFacing === 'right' ? 12 : -20), py + 15 - playerBob, 8, 10);
        }

        // If holding pendant
        if (equippedItem?.type === 'pendant') {
          ctx.fillStyle = '#fb7185'; // Pink sparkling crystal
          ctx.beginPath();
          ctx.arc(px + (playerFacing === 'right' ? 14 : -16), py + 18 - playerBob, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#fb7185';
          ctx.strokeRect(px + (playerFacing === 'right' ? 12 : -18), py + 13 - playerBob, 4, 3); // chain
        }

        // If holding vitamins
        if (equippedItem?.type === 'vitamins') {
          ctx.fillStyle = '#f43f5e'; // Rose pink pill bottle
          ctx.fillRect(px + (playerFacing === 'right' ? 12 : -18), py + 15 - playerBob, 6, 9);
          ctx.fillStyle = '#ffffff'; // White cap
          ctx.fillRect(px + (playerFacing === 'right' ? 11 : -17), py + 13 - playerBob, 8, 2);
        }

        // Flashlight Cone Drawing
        const activeItem = inventory[selectedItemIdx];
        const hasFlashlightEquipped = activeItem?.type === 'flashlight';
        if (hasFlashlightEquipped) {
          const fx = px + (playerFacing === 'right' ? 12 : -12);
          const fy = py + 18 - playerBob;
          ctx.fillStyle = '#4b5563';
          ctx.fillRect(fx - (playerFacing === 'right' ? 0 : 6), fy - 3, 8, 5);
          // light glass source
          ctx.fillStyle = flashlightOn && flashlightBattery > 0 ? '#fef3c7' : '#1f2937';
          ctx.fillRect(fx + (playerFacing === 'right' ? 6 : -2), fy - 3, 2, 5);

          if (flashlightOn && flashlightBattery > 0) {
            const beamLength = 320;
            const beamWidth = 140;
            const targetX = px + (playerFacing === 'right' ? beamLength : -beamLength);

            const flashlightBeam = ctx.createLinearGradient(fx, fy, targetX, fy);
            flashlightBeam.addColorStop(0, 'rgba(254, 243, 199, 0.45)');
            flashlightBeam.addColorStop(0.3, 'rgba(254, 243, 199, 0.2)');
            flashlightBeam.addColorStop(1, 'rgba(254, 243, 199, 0.0)');

            ctx.fillStyle = flashlightBeam;
            ctx.beginPath();
            ctx.moveTo(fx, fy);
            ctx.lineTo(targetX, fy - beamWidth / 2);
            ctx.lineTo(targetX, fy + beamWidth / 2);
            ctx.closePath();
            ctx.fill();
          }
        }
      }

      // Draw Monster (Rush / Ambush) - Custom styled terrifying wide-mouthed face
      if (monsterActive) {
        const mx = monsterX;
        const my = height - 170;
        const isAmbush = activeMonsterType === 'AMBUSH';

        if (isAmbush) {
          // Ambush: Terrifying green ghost specter
          // Smokey green shadow trails
          for (let j = 0; j < 6; j++) {
            const shadowOffset = j * -32 * ambushDirRef.current;
            const size = 60 - j * 7;
            ctx.fillStyle = `rgba(16, 185, 129, ${0.8 - j * 0.14})`; // Emerald green smoke trail
            ctx.beginPath();
            ctx.arc(mx + shadowOffset, my + Math.sin(Date.now() / 80 + j) * 8, size, 0, Math.PI * 2);
            ctx.fill();
          }

          // Core head
          ctx.fillStyle = '#062016'; // Dark green-black base
          ctx.beginPath();
          ctx.arc(mx, my, 52, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#10b981'; // Bright lime border
          ctx.lineWidth = 4;
          ctx.stroke();

          // 4 Staring Creepy Multi-eyes
          ctx.fillStyle = '#ecfdf5'; // Neon white-green eye sockets
          ctx.beginPath();
          ctx.arc(mx - 18, my - 16, 12, 0, Math.PI * 2); // Eye 1
          ctx.arc(mx + 18, my - 16, 12, 0, Math.PI * 2); // Eye 2
          ctx.arc(mx - 6, my - 28, 8, 0, Math.PI * 2);   // Eye 3
          ctx.arc(mx + 6, my - 28, 8, 0, Math.PI * 2);   // Eye 4
          ctx.fill();

          // Creepy red pupils
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(mx - 18, my - 16, 4.5, 0, Math.PI * 2);
          ctx.arc(mx + 18, my - 16, 4.5, 0, Math.PI * 2);
          ctx.arc(mx - 6, my - 28, 3, 0, Math.PI * 2);
          ctx.arc(mx + 6, my - 28, 3, 0, Math.PI * 2);
          ctx.fill();

          // Slashed wide mouth
          ctx.fillStyle = '#022c22';
          ctx.beginPath();
          ctx.ellipse(mx, my + 14, 34, 20, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#34d399';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Dripping neon green fangs
          ctx.fillStyle = '#10b981';
          for (let t = 0; t < 7; t++) {
            const tx = mx - 24 + t * 8;
            ctx.beginPath();
            ctx.moveTo(tx, my + 2);
            ctx.lineTo(tx + 3, my + 15);
            ctx.lineTo(tx + 6, my + 2);
            ctx.closePath();
            ctx.fill();
          }
          for (let t = 0; t < 7; t++) {
            const tx = mx - 24 + t * 8;
            ctx.beginPath();
            ctx.moveTo(tx, my + 26);
            ctx.lineTo(tx + 3, my + 13);
            ctx.lineTo(tx + 6, my + 26);
            ctx.closePath();
            ctx.fill();
          }

          // Pulsing glow outlines
          ctx.strokeStyle = '#059669';
          ctx.lineWidth = 3;
          ctx.strokeRect(mx - 58, my - 58, 116, 116);
        } else {
          // Standard Rush styling (original)
          // Smokey shadow trails
          for (let j = 0; j < 5; j++) {
            const shadowOffset = j * -26;
            const size = 56 - j * 8;
            ctx.fillStyle = `rgba(31, 41, 55, ${0.7 - j * 0.15})`; // black/grey smoke
            ctx.beginPath();
            ctx.arc(mx + shadowOffset, my, size, 0, Math.PI * 2);
            ctx.fill();
          }

          // Giant raw black/red outline sphere (Rush face canvas)
          ctx.fillStyle = '#111827';
          ctx.beginPath();
          ctx.arc(mx, my, 48, 0, Math.PI*2);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Creepy Distorted Staring Eyes (MEME screamer style!)
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(mx - 15, my - 10, 11, 0, Math.PI * 2);
          ctx.arc(mx + 15, my - 10, 11, 0, Math.PI * 2);
          ctx.fill();

          // Tiny piercing black pupils
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(mx - 15, my - 10, 3.5, 0, Math.PI * 2);
          ctx.arc(mx + 15, my - 10, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Distorted raw grinning black screaming mouth (wide outline)
          ctx.fillStyle = '#030712';
          ctx.beginPath();
          ctx.ellipse(mx, my + 14, 28, 18, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Sharp rows of white jagged fangs / teeth (Doors game style)
          ctx.fillStyle = '#ffffff';
          for (let t = 0; t < 5; t++) {
            const tx = mx - 20 + t * 10;
            ctx.beginPath();
            ctx.moveTo(tx, my + 4);
            ctx.lineTo(tx + 4, my + 14);
            ctx.lineTo(tx + 8, my + 4);
            ctx.closePath();
            ctx.fill();
          }
          for (let t = 0; t < 5; t++) {
            const tx = mx - 20 + t * 10;
            ctx.beginPath();
            ctx.moveTo(tx, my + 24);
            ctx.lineTo(tx + 4, my + 15);
            ctx.lineTo(tx + 8, my + 24);
            ctx.closePath();
            ctx.fill();
          }

          // Extra spooky glow effect
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 2;
          ctx.strokeRect(mx - 54, my - 54, 108, 108);
        }
      }

      // Draw Crucifix Banishment Holy Animation
      if (banishActive) {
        const mx = playerPosition + 120; // In front of player where Rush is blocked
        const my = height - 170;

        // Draw glowing bright gold and blue cross centered in front of player
        ctx.strokeStyle = '#60a5fa'; // Blue rays
        ctx.lineWidth = 4;
        const beamCount = 12;
        const angleStep = (Math.PI * 2) / beamCount;
        
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 25;

        // Spinning light rays
        const spinAngle = (banishProgressRef.current * 0.05);
        for (let r = 0; r < beamCount; r++) {
          const angle = r * angleStep + spinAngle;
          ctx.beginPath();
          ctx.moveTo(mx, my);
          ctx.lineTo(mx + Math.cos(angle) * 160, my + Math.sin(angle) * 160);
          ctx.stroke();
        }

        // Giant golden glowing cross of light
        ctx.fillStyle = '#fbbf24'; // Golden
        // Vertical shaft
        ctx.fillRect(mx - 10, my - 60, 20, 120);
        // Horizontal crossbar
        ctx.fillRect(mx - 45, my - 20, 90, 20);

        // White hot core cross
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(mx - 5, my - 55, 10, 110);
        ctx.fillRect(mx - 40, my - 15, 80, 10);

        ctx.shadowBlur = 0; // reset

        // Draw trapped screaming Rush getting pulled down!
        // Rush is drawn distorted and off-center downwards based on banish progress
        const pullOffset = banishProgressRef.current * 2.2;
        const rY = my + pullOffset;
        
        ctx.fillStyle = '#111827';
        ctx.beginPath();
        ctx.arc(mx, rY, 44, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(mx - 15, rY - 10, 10, 0, Math.PI * 2);
        ctx.arc(mx + 15, rY - 10, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444'; // glowing red angry pupils
        ctx.beginPath();
        ctx.arc(mx - 15, rY - 10, 4, 0, Math.PI*2);
        ctx.arc(mx + 15, rY - 10, 4, 0, Math.PI*2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.ellipse(mx, rY + 12, 24, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        // Blue crackling lightning connecting cross to Rush
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx + (Math.random()*20-10), my + pullOffset/2);
        ctx.lineTo(mx, rY);
        ctx.stroke();
      }

      // Draw floating text particles
      floatingTextsRef.current.forEach(ft => {
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        // fade out slightly near the end of life
        if (ft.life < 30) {
          ctx.fillStyle = ft.color + '88'; // semi-transparent
        }
        ctx.fillText(ft.text, ft.x, ft.y);
      });

      // Ambient shadow / dark overlay based on flashlight status
      const hasFlashlightActive = flashlightOn && (inventory[selectedItemIdx]?.type === 'flashlight') && flashlightBattery > 0;
      if (hasFlashlightActive && !isHiding) {
        const pLocX = playerPosition;
        const pLocY = height - 120;

        const ambientLight = ctx.createRadialGradient(pLocX, pLocY, 50, pLocX, pLocY, 320);
        ambientLight.addColorStop(0, 'rgba(0, 0, 0, 0)');
        ambientLight.addColorStop(0.5, 'rgba(0, 0, 0, 0.45)');
        ambientLight.addColorStop(1, roomDarkened ? 'rgba(0, 0, 0, 0.99)' : 'rgba(0, 0, 0, 0.86)');

        ctx.fillStyle = ambientLight;
        ctx.fillRect(0, 0, width, height);
      } else {
        ctx.fillStyle = roomDarkened ? 'rgba(0, 0, 0, 0.99)' : 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, width, height);
      }

      // Restore saved canvas transformation context
      ctx.restore();
    };

    animationId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [
    gameState,
    playerPosition,
    playerFacing,
    isHiding,
    flashlightOn,
    flashlightBattery,
    currentDoor,
    closetX,
    isDoorLocked,
    isFlickering,
    roomDarkened,
    monsterActive,
    monsterX,
    switchRepaired,
    showFusePuzzle,
    showSwitchPuzzle,
    inventory,
    selectedItemIdx,
    drawers,
    health,
    stamina,
    touchSprinting,
    coins,
    showShop,
    banishActive,
    dupeActive,
    dupeDoors,
    isRoomKeyLocked,
    hasRoomKey,
    hasSkull,
    skullX,
    skullInteracted,
    amazonBoxes
  ]);

  return (
    <div ref={outerRef} className="relative w-full flex flex-col items-center">
      {/* Flying Coins overlay */}
      <AnimatePresence>
        {flyingCoins.map(coin => (
          <motion.div
            key={coin.id}
            initial={{ 
              x: coin.startX, 
              y: coin.startY, 
              scale: 0, 
              opacity: 0,
              rotate: 0
            }}
            animate={{ 
              x: coin.targetX, 
              y: coin.targetY, 
              scale: [0, 1.4, 1.1, 0.4], 
              opacity: [0, 1, 1, 0.8],
              rotate: 360 * 3
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.9, 
              delay: coin.delay,
              ease: [0.25, 1, 0.5, 1]
            }}
            onAnimationComplete={() => {
              setFlyingCoins(prev => prev.filter(c => c.id !== coin.id));
            }}
            className="absolute z-50 pointer-events-none"
            style={{ 
              left: 0, 
              top: 0,
              marginLeft: '-10px',
              marginTop: '-10px'
            }}
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-600 via-yellow-400 to-amber-300 border border-yellow-200 flex items-center justify-center shadow-[0_0_10px_rgba(250,204,21,0.6)]">
              <span className="text-[9px] font-extrabold text-amber-950 font-serif">$</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* HUD Header Bar */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 bg-zinc-950 border border-zinc-800 p-3 rounded-t-lg select-none gap-3 items-center">
        
        {/* Left Col: Door & Keys */}
        <div className="flex items-center gap-4 justify-start">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">ROOM INDEX</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-mono text-white font-bold tracking-wider">
                DOOR <span className="text-yellow-500">{currentDoor}</span>/100
              </span>
              <span className="text-[10px] font-mono text-zinc-500 font-bold tracking-wide">Cool_85™</span>
            </div>
          </div>
          <div className="h-8 w-[1px] bg-zinc-800" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-zinc-500 uppercase">BYPASS KEYS</span>
            <span className="text-xs font-mono text-zinc-300 font-bold flex items-center gap-1.5">
              <Key className="text-yellow-500 fill-yellow-500/10" size={14} />
              {keysCollected}/5
            </span>
          </div>
          {isRoomKeyLocked && (
            <>
              <div className="h-8 w-[1px] bg-zinc-800" />
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">ROOM KEY</span>
                <span className={`text-xs font-mono font-bold flex items-center gap-1.5 ${hasRoomKey ? 'text-green-500' : 'text-zinc-500'}`}>
                  <Key size={14} className={hasRoomKey ? "text-green-500 fill-green-500/10" : "text-zinc-600"} />
                  {hasRoomKey ? "ACQUIRED" : "MISSING"}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Center Col: Health & Stamina Bars (Extremely high-quality visuals!) */}
        <div className="flex flex-col gap-1.5 w-full max-w-md mx-auto">
          {/* Health Bar */}
          <div className="flex items-center gap-2">
            <Heart size={12} className="text-red-500 fill-red-500/10 shrink-0" />
            <div className="w-full bg-zinc-900 border border-zinc-800 h-2.5 rounded-full overflow-hidden relative">
              <div 
                className="bg-red-600 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                style={{ width: `${health}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-400 w-6 text-right font-bold">{health}</span>
          </div>

          {/* Stamina Bar */}
          <div className="flex items-center gap-2">
            <Zap className={colaTimer > 0 ? "text-yellow-400 fill-yellow-400/10 shrink-0 animate-pulse" : "text-cyan-400 fill-cyan-400/10 shrink-0"} size={12} />
            <div className="w-full bg-zinc-900 border border-zinc-800 h-2 rounded-full overflow-hidden relative">
              <div 
                className={`h-full rounded-full transition-all duration-100 ${colaTimer > 0 ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)] animate-pulse' : 'bg-cyan-500'}`}
                style={{ width: `${stamina}%` }}
              />
            </div>
            <span className="text-[10px] font-mono text-zinc-400 w-6 text-right font-bold">{Math.round(stamina)}</span>
          </div>
        </div>

        {/* Right Col: Coins & Sound Mute Toggle */}
        <div className="flex items-center justify-end gap-4">
          <motion.div 
            ref={coinCounterRef}
            animate={displayedCoins !== coins ? { scale: [1, 1.25, 1], rotate: [0, -3, 3, 0] } : { scale: 1 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-2.5 py-1 rounded-md text-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.1)]"
          >
            <Coins size={14} className="animate-pulse text-yellow-400" />
            <span className="text-sm font-mono font-extrabold tracking-wider">{displayedCoins} COINS</span>
          </motion.div>

          {isFlickering && (
            <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-800/60 px-2 py-0.5 rounded text-[9px] font-mono text-red-400 animate-pulse">
              <ShieldAlert size={10} />
              {activeMonsterType === 'AMBUSH' ? 'AMBUSH INCOMING!' : 'RUSH INCOMING!'}
            </div>
          )}

          <button
            onClick={() => {
              sound.playClick();
              setMuted(prev => !prev);
            }}
            className="p-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded transition-colors"
            title={muted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div 
        ref={containerRef}
        className="relative w-full aspect-[9/4] max-h-[400px] border-x border-b border-zinc-800 bg-zinc-950 overflow-hidden flex items-center justify-center rounded-b-lg"
      >
        <canvas
          ref={canvasRef}
          width={900}
          height={400}
          className="w-full h-full object-contain block bg-zinc-900"
        />

        {/* Red vignette flash upon taking damage */}
        {health < 100 && (
          <div 
            className="absolute inset-0 bg-red-600/10 pointer-events-none transition-opacity duration-500 z-10 border-4 border-red-600/30"
            style={{ opacity: (100 - health) / 100 }}
          />
        )}

        {/* Cinematic Monster Screen Blur Flash */}
        <AnimatePresence>
          {isFlickering && monsterActive && Math.abs(monsterX - playerPosition) < 180 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.45, 0] }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-700/30 pointer-events-none z-20 backdrop-blur-xs"
              transition={{ repeat: Infinity, duration: 0.12 }}
            />
          )}
        </AnimatePresence>

        {/* Dupe Jumpscare Overlay */}
        <AnimatePresence>
          {dupeJumpscare && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: [1, 1.1, 1], x: [0, -5, 5, -5, 0] }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-red-950/95 flex flex-col items-center justify-center z-50 pointer-events-none"
            >
              <div className="flex flex-col items-center gap-4 text-center select-none animate-pulse">
                {/* Scary Face Artwork using CSS/SVG or simple dramatic text & icons */}
                <div className="relative w-40 h-40 bg-black rounded-full border-4 border-red-500 flex items-center justify-center shadow-[0_0_35px_rgba(239,68,68,0.8)]">
                  {/* Demon Teeth / Claws */}
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-1">
                    <span className="text-red-600 text-3xl font-extrabold rotate-180">▲</span>
                    <span className="text-red-600 text-3xl font-extrabold rotate-180">▲</span>
                    <span className="text-red-600 text-3xl font-extrabold rotate-180">▲</span>
                    <span className="text-red-600 text-3xl font-extrabold rotate-180">▲</span>
                  </div>
                  {/* Glowing Red Eyes */}
                  <div className="flex gap-12 mt-4">
                    <div className="w-8 h-8 bg-red-600 rounded-full animate-ping flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </div>
                    <div className="w-8 h-8 bg-red-600 rounded-full animate-ping flex items-center justify-center">
                      <div className="w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
                    <span className="text-red-600 text-3xl font-extrabold">▲</span>
                    <span className="text-red-600 text-3xl font-extrabold">▲</span>
                    <span className="text-red-600 text-3xl font-extrabold">▲</span>
                    <span className="text-red-600 text-3xl font-extrabold">▲</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-mono text-white font-extrabold uppercase tracking-widest text-red-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                    DUPE ATTACKED YOU!
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400 mt-1 uppercase font-bold tracking-wide">
                    ALWAYS CHECK THE PREVIOUS DOOR INDEX!
                  </span>
                  <span className="text-sm font-mono text-red-400 font-bold mt-2 animate-bounce uppercase">
                    -25 HP DAMAGE
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alert Notifications Overlay */}
        <AnimatePresence>
          {alertMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-12 bg-zinc-950 border-2 border-red-600 text-red-500 font-mono text-xs font-bold py-1.5 px-4 rounded-md tracking-wider uppercase z-40 shadow-lg"
            >
              {alertMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 2D HUD Overlays */}
        {inventory[selectedItemIdx]?.type === 'radio' && (
          <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-11/12 max-w-md bg-zinc-950/95 border-2 border-pink-500/60 p-4 rounded-xl shadow-2xl z-30 flex flex-col gap-2 backdrop-blur-sm pointer-events-none text-center">
            <div className="flex items-center justify-center gap-2 text-pink-500 font-bold font-mono text-xs animate-pulse uppercase tracking-widest">
              <Music className="text-pink-400 animate-bounce" size={14} />
              <span>SIMULATING RADIO ENGINE</span>
              <Music className="text-pink-400 animate-bounce" size={14} />
            </div>
            <p className="text-[11px] text-zinc-300 font-mono leading-relaxed italic">
              "The heavy hotel air suddenly buzzes as you power on the retro dials. Bright red and teal equalizer waves dance across the vintage speaker mesh. The spooky, oppressive silence of the corridor is shattered as <span className="text-pink-400 font-bold not-italic">Spear of Justice (1).mp3</span> blasts out, filling the hallway with heroic determination!"
            </p>
          </div>
        )}

        {isHiding && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center pointer-events-none select-none z-30">
            <motion.div
              animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              className="flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-zinc-500 flex items-center justify-center">
                <div className="w-6 h-6 bg-red-600 rounded-full animate-ping" />
              </div>
              <span className="text-zinc-300 font-mono text-sm uppercase tracking-widest font-bold">
                You are hiding in the closet
              </span>
              <span className="text-zinc-500 font-mono text-[10px] uppercase">
                Wait until the threat passes...
              </span>
            </motion.div>
          </div>
        )}

        {/* Amazon box prompt overlay */}
        {amazonBoxes.some(box => box.door === currentDoor && !box.isOpened && !box.isOpening && Math.abs(playerPosition - box.x) < 45) && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-zinc-950/90 border border-cyan-500/40 px-3 py-1.5 rounded-md flex items-center gap-2 z-10 shadow-lg pointer-events-none animate-pulse">
            <ShoppingBag className="text-cyan-400" size={14} />
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase">
              TAP OR PRESS SPACE/E TO OPEN DELIVERY BOX
            </span>
          </div>
        )}

        {/* Drawers Prompt overlay */}
        {drawers.some(d => !d.searched && Math.abs(playerPosition - d.x) < 75) && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-zinc-950/90 border border-yellow-500/40 px-3 py-1.5 rounded-md flex items-center gap-2 z-10 shadow-lg pointer-events-none animate-pulse">
            <Search className="text-yellow-500" size={14} />
            <span className="text-xs font-mono text-yellow-500 font-bold uppercase">
              TAP OR PRESS SPACE/E TO SEARCH DRAWER
            </span>
          </div>
        )}

        {/* Jeff's Shop Counter prompt overlay */}
        {currentDoor === 40 && Math.abs(playerPosition - 450) < 60 && !showShop && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-zinc-950/90 border border-cyan-500/40 px-3 py-1.5 rounded-md flex items-center gap-2 z-10 shadow-lg pointer-events-none animate-pulse">
            <ShoppingBag className="text-cyan-400" size={14} />
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase">
              TAP OR PRESS SPACE/E TO TALK TO JEFF
            </span>
          </div>
        )}

        {/* Door 100 workbench prompt overlay */}
        {currentDoor === 100 && !hasNewSwitch && Math.abs(playerPosition - 350) < 60 && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-zinc-950/90 border border-amber-600/40 px-3 py-1.5 rounded-md flex items-center gap-2 z-10 shadow-lg pointer-events-none animate-pulse">
            <Search className="text-amber-500" size={14} />
            <span className="text-xs font-mono text-amber-500 font-bold uppercase">
              TAP OR PRESS SPACE/E TO SEARCH TOOLBOX FOR SWITCH
            </span>
          </div>
        )}

        {/* Door 100 Powerbox prompt overlay */}
        {currentDoor === 100 && hasNewSwitch && !switchRepaired && Math.abs(playerPosition - 550) < 60 && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-zinc-950/90 border border-green-600/40 px-3 py-1.5 rounded-md flex items-center gap-2 z-10 shadow-lg pointer-events-none animate-pulse">
            <Power className="text-green-500" size={14} />
            <span className="text-xs font-mono text-green-500 font-bold uppercase">
              TAP OR PRESS SPACE/E TO REPAIR POWER JUNCTION
            </span>
          </div>
        )}

        {/* Locked door prompt overlay */}
        {isDoorLocked && playerPosition >= 740 && (
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-zinc-950/90 border border-amber-600/40 px-3 py-1.5 rounded-md flex items-center gap-2 z-10 shadow-lg pointer-events-none animate-pulse">
            <Key className="text-amber-500" size={14} />
            <span className="text-xs font-mono text-amber-500 font-bold uppercase">
              {isRoomKeyLocked ? "THIS DOOR IS LOCKED. SEARCH DRAWERS FOR THE KEY!" : "TAP OR PRESS SPACE/E TO SOLVE FUSE BYPASS PUZZLE"}
            </span>
          </div>
        )}

        {/* Flashlight status HUD element */}
        <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none opacity-85 bg-zinc-950/80 p-2 rounded border border-zinc-800/50 z-20">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${flashlightOn && (inventory[selectedItemIdx]?.type === 'flashlight') && flashlightBattery > 0 ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span className="text-[10px] font-mono text-zinc-300 uppercase font-bold">
              FLASHLIGHT: {flashlightOn && (inventory[selectedItemIdx]?.type === 'flashlight') && flashlightBattery > 0 ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
          {inventory.some(item => item.type === 'flashlight') ? (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-mono text-zinc-400">BATTERY:</span>
              <div className="w-16 bg-zinc-800 h-1.5 rounded-full overflow-hidden border border-zinc-700/55">
                <div 
                  className={`h-full rounded-full ${flashlightBattery > 25 ? 'bg-cyan-500' : 'bg-red-500 animate-pulse'}`}
                  style={{ width: `${flashlightBattery}%` }}
                />
              </div>
              <span className="text-[9px] font-mono font-bold text-zinc-300">{Math.round(flashlightBattery)}%</span>
            </div>
          ) : (
            <span className="text-[8px] font-mono text-zinc-500">NO FLASHLIGHT IN HOTBAR</span>
          )}
        </div>

        {/* Active Buffs HUD element */}
        {(colaTimer > 0 || luckPotionTimer > 0) && (
          <div className="absolute top-20 left-4 flex flex-col gap-1.5 pointer-events-none opacity-90 bg-zinc-950/85 p-2 rounded border border-zinc-850 z-20">
            {colaTimer > 0 && (
              <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-yellow-400 font-bold uppercase animate-pulse">
                <Zap size={10} className="fill-yellow-400/15" />
                <span>SPEED BOOST: {Math.ceil(colaTimer)}S</span>
              </div>
            )}
            {luckPotionTimer > 0 && (
              <div className="flex items-center gap-1.5 text-[9.5px] font-mono text-emerald-400 font-bold uppercase animate-pulse">
                <Sparkles size={10} />
                <span>LUCK BOOST (+30%): {Math.ceil(luckPotionTimer)}S</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* JEFF'S COZY SHOP MODAL (Fades in beautifully) */}
      <AnimatePresence>
        {showShop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border-2 border-cyan-800 rounded-xl max-w-md w-full p-6 shadow-2xl relative"
            >
              <div className="flex justify-between items-center border-b border-cyan-900 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="text-cyan-400 animate-pulse" />
                  <span className="font-mono text-sm text-cyan-400 font-extrabold uppercase tracking-widest">
                    JEFF'S SECURE STASH
                  </span>
                </div>
                <div className="flex items-center gap-1 text-yellow-500 font-mono text-sm font-bold bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded">
                  <Coins size={14} />
                  <span>{coins} COINS</span>
                </div>
              </div>

              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-4 leading-relaxed">
                "Welcome friend... These hallways are not safe. Take some of my tools to keep yourself alive."
              </p>

              {/* Items Shelf */}
              <div className="flex flex-col gap-3 mb-6 max-h-[340px] overflow-y-auto pr-1">
                
                {/* 1. Bandage */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex justify-between items-center hover:border-cyan-900 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-white font-bold uppercase flex items-center gap-1.5">
                      <Heart className="text-red-500 fill-red-500/10" size={12} />
                      Survival Bandage
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      Instantly restores 40 health points.
                    </span>
                  </div>
                  <button
                    onClick={() => buyItem('bandage', 40, 'Bandage', 'Heals 40 Health. Press Q to use.')}
                    className="bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono text-[10px] font-bold py-1.5 px-3 rounded uppercase transition-colors shrink-0"
                  >
                    40 COINS
                  </button>
                </div>

                {/* 2. Crucifix */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex justify-between items-center hover:border-cyan-900 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-white font-bold uppercase flex items-center gap-1.5">
                      <Sparkles className="text-yellow-500 fill-yellow-500/10" size={12} />
                      Holy Crucifix
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      Blocks & banishes Rush. Equip to use!
                    </span>
                  </div>
                  <button
                    onClick={() => buyItem('crucifix', 150, 'Crucifix', 'Banish Rush. Equip to protect.')}
                    className="bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono text-[10px] font-bold py-1.5 px-3 rounded uppercase transition-colors shrink-0"
                  >
                    150 COINS
                  </button>
                </div>

                {/* 3. Radio */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex justify-between items-center hover:border-cyan-900 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-white font-bold uppercase flex items-center gap-1.5">
                      <Music className="text-cyan-400" size={12} />
                      Vintage Radio
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      Plays cozy synthetic beats when held!
                    </span>
                  </div>
                  <button
                    onClick={() => buyItem('radio', 100, 'Radio', 'Vintage electronic retro tunes.')}
                    className="bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono text-[10px] font-bold py-1.5 px-3 rounded uppercase transition-colors shrink-0"
                  >
                    100 COINS
                  </button>
                </div>

                {/* 4. Jeff's Lucky Pendant */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex justify-between items-center hover:border-cyan-900 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-white font-bold uppercase flex items-center gap-1.5">
                      <Sparkles className="text-pink-400" size={12} />
                      Jeff's Lucky Pendant
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      Protects passively from ONE fatal monster strike! Shatters upon use.
                    </span>
                  </div>
                  <button
                    onClick={() => buyItem('pendant', 120, "Jeff's Pendant", "Protects passively from one fatal strike! Shatters on use.")}
                    className="bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono text-[10px] font-bold py-1.5 px-3 rounded uppercase transition-colors shrink-0"
                  >
                    120 COINS
                  </button>
                </div>

                {/* 5. Speed Cola */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex justify-between items-center hover:border-cyan-900 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-white font-bold uppercase flex items-center gap-1.5">
                      <Sparkles className="text-amber-400" size={12} />
                      Speed Cola
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      Speed boost & infinite stamina for 11 seconds.
                    </span>
                  </div>
                  <button
                    onClick={() => buyItem('cola', 45, 'Speed Cola', 'Incredible speed & infinite stamina for 11s. Press Q to drink.')}
                    className="bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono text-[10px] font-bold py-1.5 px-3 rounded uppercase transition-colors shrink-0"
                  >
                    45 COINS
                  </button>
                </div>

                {/* 6. Golden Skeleton Key */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex justify-between items-center hover:border-cyan-900 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-white font-bold uppercase flex items-center gap-1.5">
                      <Key className="text-purple-400 animate-pulse" size={12} />
                      Golden Skeleton Key
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      Unlocks regular locked doors and chests repeatedly (not consumed).
                    </span>
                  </div>
                  <button
                    onClick={() => buyItem('skeleton_key', 180, 'Skeleton Key', 'Unlocks regular doors/chests repeatedly (not consumed).')}
                    className="bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono text-[10px] font-bold py-1.5 px-3 rounded uppercase transition-colors shrink-0"
                  >
                    180 COINS
                  </button>
                </div>

                {/* 7. Master Lockpick */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex justify-between items-center hover:border-cyan-900 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-white font-bold uppercase flex items-center gap-1.5">
                      <Key className="text-yellow-500" size={12} />
                      Master Lockpick
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      Instantly unlocks locked doors or side chests. Consumed on use.
                    </span>
                  </div>
                  <button
                    onClick={() => buyItem('lockpick', 65, 'Lockpick', 'Instantly unlocks standard locked doors or side chests.')}
                    className="bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono text-[10px] font-bold py-1.5 px-3 rounded uppercase transition-colors shrink-0"
                  >
                    65 COINS
                  </button>
                </div>

                {/* 8. Luck Potion */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex justify-between items-center hover:border-cyan-900 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-white font-bold uppercase flex items-center gap-1.5">
                      <Sparkles className="text-emerald-400 animate-pulse" size={12} />
                      Jeff's Luck Potion
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      Increases your chance of finding rare loot and stock for 44 seconds.
                    </span>
                  </div>
                  <button
                    onClick={() => buyItem('luck_potion', 60, 'Luck Potion', 'DRANK LUCK POTION: +30% CHANCE OF RARE ITEMS FOR 44 SECONDS!')}
                    className="bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono text-[10px] font-bold py-1.5 px-3 rounded uppercase transition-colors shrink-0"
                  >
                    60 COINS
                  </button>
                </div>

                {/* 9. A-90's iPad */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex justify-between items-center hover:border-cyan-900 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-white font-bold uppercase flex items-center gap-1.5">
                      <ShoppingBag className="text-cyan-400" size={12} />
                      A-90's iPad Tablet
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      Order Jeff's Express Delivery at any door! Ships via drone upon exit.
                    </span>
                  </div>
                  <button
                    onClick={() => buyItem('ipad', 110, 'iPad', "Allows ordering Jeff's Express Delivery from anywhere!")}
                    className="bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono text-[10px] font-bold py-1.5 px-3 rounded uppercase transition-colors shrink-0"
                  >
                    110 COINS
                  </button>
                </div>

                {/* 10. Energy Vitamins */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex justify-between items-center hover:border-cyan-900 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-white font-bold uppercase flex items-center gap-1.5">
                      <Heart className="text-rose-400 fill-rose-400/10 animate-pulse" size={12} />
                      Energy Vitamins
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      Restores 25 health and grants 4.5s speed/infinite stamina boost.
                    </span>
                  </div>
                  <button
                    onClick={() => buyItem('vitamins', 35, 'Vitamins', 'TOOK VITAMINS: HEALED 25 HP & GAINED SPEED FOR 4.5 SECONDS!')}
                    className="bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono text-[10px] font-bold py-1.5 px-3 rounded uppercase transition-colors shrink-0"
                  >
                    35 COINS
                  </button>
                </div>

                {/* 11. Battery Refill */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 flex justify-between items-center hover:border-cyan-900 transition-colors">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-mono text-white font-bold uppercase flex items-center gap-1.5">
                      <Power className="text-cyan-400" size={12} />
                      Flashlight Battery Refill
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">
                      Instantly recharges your flashlight battery back to 100%.
                    </span>
                  </div>
                  <button
                    onClick={() => buyItem('battery', 25, 'Battery Refill', 'Instantly recharges flashlight battery to 100%.')}
                    className="bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono text-[10px] font-bold py-1.5 px-3 rounded uppercase transition-colors shrink-0"
                  >
                    25 COINS
                  </button>
                </div>

              </div>

              {/* Close counter */}
              <button
                onClick={() => setShowShop(false)}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-mono text-xs py-2.5 rounded-lg border border-zinc-700 uppercase transition-colors cursor-pointer"
              >
                LEAVE THE COUNTER
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IPAD ELECTRONIC TABLET MODAL */}
      <AnimatePresence>
        {showIpad && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            {/* iPad Wrapper with Top Close Button */}
            <div className="relative max-w-2xl w-full flex flex-col items-center">
              {/* 3 Arrows Close Button on top of iPad */}
              <button
                onClick={() => {
                  setShowIpad(false);
                  if (!muted) sound.playClick();
                }}
                className="mb-3.5 bg-neutral-950/90 border border-neutral-800 hover:border-red-500/50 text-neutral-400 hover:text-red-400 rounded-full px-4 py-2 flex items-center justify-center gap-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.6)] cursor-pointer hover:scale-105 active:scale-95 transition-all group select-none z-50"
                title="Close iPad"
              >
                <div className="flex items-center -space-x-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={`left-${i}`}
                      animate={{ y: [0, 4, 0] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut"
                      }}
                    >
                      <ChevronDown size={16} className="text-cyan-400 group-hover:text-red-400 transition-colors" />
                    </motion.div>
                  ))}
                </div>
                
                <span className="text-[10px] font-mono font-extrabold tracking-widest text-zinc-300 group-hover:text-red-400 uppercase transition-colors">
                  CLOSE IPAD
                </span>

                <div className="flex items-center -space-x-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={`right-${i}`}
                      animate={{ y: [0, 4, 0] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: i * 0.15,
                        ease: "easeInOut"
                      }}
                    >
                      <ChevronDown size={16} className="text-cyan-400 group-hover:text-red-400 transition-colors" />
                    </motion.div>
                  ))}
                </div>
              </button>

              {/* iPad Chassis */}
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-neutral-900 border-[10px] border-neutral-950 rounded-[24px] w-full h-[450px] shadow-2xl flex flex-col overflow-hidden relative"
              >
              {/* iPad Camera lens indicator */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-neutral-800 rounded-full z-10" />

              {/* Status Bar */}
              <div className="bg-zinc-950 px-5 py-1 flex justify-between items-center text-[9px] font-mono text-zinc-400 border-b border-zinc-800/50">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-cyan-400">iPadOS</span>
                  <span className="text-zinc-600">|</span>
                  <span className="text-zinc-400 uppercase tracking-wide">JEFF EXPRESS v1.02</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>WiFi 📶</span>
                  <span className="text-zinc-600">|</span>
                  <span>99% 🔋</span>
                </div>
              </div>

              {/* Screen Content */}
              <div className="flex-1 bg-gradient-to-b from-zinc-900 to-zinc-950 p-5 flex flex-col overflow-y-auto">
                {ipadActiveApp === 'HOME' ? (
                  <div className="flex-1 flex flex-col justify-between">
                    {/* Home Grid */}
                    <div className="grid grid-cols-4 gap-4 pt-4">
                      {/* Shop Icon - Clickable */}
                      <button
                        onClick={() => {
                          setIpadActiveApp('SHOP');
                          if (!muted) sound.playClick();
                        }}
                        className="flex flex-col items-center gap-1.5 group cursor-pointer focus:outline-none"
                      >
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-cyan-600 to-cyan-400 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:shadow-cyan-500/20 active:scale-95 transition-all">
                          <ShoppingBag className="text-white w-7 h-7" />
                        </div>
                        <span className="text-[10px] font-mono font-bold text-zinc-200 tracking-wide uppercase text-center">
                          Jeff Express
                        </span>
                      </button>

                      {/* Music App (Aesthetic) */}
                      <div className="flex flex-col items-center gap-1.5 opacity-40 select-none">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-400 flex items-center justify-center shadow-lg">
                          <Music className="text-white w-7 h-7" />
                        </div>
                        <span className="text-[9px] font-mono text-zinc-400 tracking-wide uppercase text-center">
                          Music (Offline)
                        </span>
                      </div>

                      {/* System App (Aesthetic) */}
                      <div className="flex flex-col items-center gap-1.5 opacity-40 select-none">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-400 flex items-center justify-center shadow-lg">
                          <Power className="text-white w-7 h-7" />
                        </div>
                        <span className="text-[9px] font-mono text-zinc-400 tracking-wide uppercase text-center">
                          Diagnostics
                        </span>
                      </div>

                      {/* Help/Docs App (Aesthetic) */}
                      <div className="flex flex-col items-center gap-1.5 opacity-40 select-none">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg">
                          <HelpCircle className="text-white w-7 h-7" />
                        </div>
                        <span className="text-[9px] font-mono text-zinc-400 tracking-wide uppercase text-center">
                          Manual
                        </span>
                      </div>
                    </div>

                    {/* Bottom Dock */}
                    <div className="bg-zinc-900/40 border border-zinc-800/30 rounded-2xl p-2 max-w-xs mx-auto w-full flex justify-around items-center backdrop-blur-md mb-2 shadow-inner">
                      <button
                        onClick={() => {
                          setIpadActiveApp('SHOP');
                          if (!muted) sound.playClick();
                        }}
                        className="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
                      >
                        <ShoppingBag className="text-white w-5 h-5" />
                      </button>
                      <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center opacity-30">
                        <Music className="text-white w-5 h-5" />
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-zinc-800/50 flex items-center justify-center opacity-30">
                        <Power className="text-white w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  // JEFF'S EXPRESS SHOP APP
                  <div className="flex-1 flex flex-col h-full">
                    {/* Shop Header */}
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2.5 mb-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setIpadActiveApp('HOME');
                            if (!muted) sound.playClick();
                          }}
                          className="flex items-center gap-1 text-[9px] font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded hover:bg-cyan-500/20 active:scale-95 transition-all uppercase"
                        >
                          <ArrowLeft size={10} />
                          <span>Home</span>
                        </button>
                        <span className="font-mono text-xs text-cyan-400 font-extrabold uppercase tracking-wider ml-1">
                          JEFF'S EXPRESS DELIVERY
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Countdown timer */}
                        <div className="text-[8px] font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          RESTOCK IN: <span className="text-amber-400 font-bold">{Math.floor(ipadRestockTimer / 60)}:{(ipadRestockTimer % 60).toString().padStart(2, '0')}</span>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500 font-mono text-xs font-bold bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded">
                          <Coins size={12} />
                          <span>{coins}</span>
                        </div>
                      </div>
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-2 overflow-y-auto pr-0.5 max-h-[280px]">
                      {ipadItems.map((item) => {
                        const isAvailable = item.available && item.stock > 0;
                        const rarityColors = {
                          Common: 'text-zinc-400 bg-zinc-400/5 border-zinc-500/20',
                          Uncommon: 'text-emerald-400 bg-emerald-400/5 border-emerald-500/20',
                          Rare: 'text-cyan-400 bg-cyan-400/5 border-cyan-500/20',
                          Legendary: 'text-amber-400 bg-amber-400/5 border-amber-500/20'
                        };

                        const icons = {
                          bandage: <Heart className="text-red-500 fill-red-500/10" size={12} />,
                          lockpick: <Key className="text-amber-500" size={12} />,
                          cola: <Zap className="text-yellow-500" size={12} />,
                          crucifix: <Sparkles className="text-blue-400" size={12} />,
                          radio: <Music className="text-pink-400" size={12} />,
                          battery: <Power className="text-cyan-400" size={12} />,
                          luck_potion: <Sparkles className="text-emerald-400" size={12} />
                        };

                        return (
                          <div
                            key={item.id}
                            className={`bg-zinc-950 border rounded-lg p-2.5 flex flex-col justify-between transition-all ${
                              isAvailable ? 'border-zinc-800 hover:border-cyan-900' : 'border-zinc-900/60 opacity-60'
                            }`}
                          >
                            <div>
                              <div className="flex justify-between items-start gap-1.5 mb-1">
                                <span className="text-[10px] font-mono text-white font-extrabold uppercase flex items-center gap-1 truncate">
                                  {icons[item.id as keyof typeof icons]}
                                  {item.name}
                                </span>
                                <span className={`text-[7px] font-mono uppercase px-1 py-0.2 rounded border ${rarityColors[item.rarity] || 'text-zinc-500'}`}>
                                  {item.rarity}
                                </span>
                              </div>
                              <p className="text-[8px] font-mono text-zinc-500 leading-snug">
                                {item.description}
                              </p>
                            </div>

                            <div className="flex justify-between items-center mt-2 border-t border-zinc-900/80 pt-1.5">
                              {isAvailable ? (
                                <>
                                  <span className="text-[8px] font-mono text-emerald-400 font-bold">
                                    {item.stock} IN STOCK
                                  </span>
                                  <button
                                    onClick={() => {
                                      // Check if inventory + pending orders exceeds hotbar limit of 5
                                      if (inventory.length + pendingOrdersRef.current.length >= 5) {
                                        setAlertMessage("HOTBAR WILL BE FULL! CANNOT ORDER.");
                                        setTimeout(() => setAlertMessage(""), 2500);
                                        return;
                                      }

                                      if (coins < item.price) {
                                        setAlertMessage("NOT ENOUGH COINS!");
                                        setTimeout(() => setAlertMessage(""), 2000);
                                        return;
                                      }

                                      // Process purchase (Queue for Drone Delivery on iPad close)
                                      const boxId = Math.random().toString();
                                      
                                      pendingOrdersRef.current.push({
                                        id: boxId,
                                        type: item.id as ItemType,
                                        label: item.id === 'bandage' ? 'Bandage' : item.name,
                                        desc: item.description
                                      });
                                      
                                      setCoins(prev => prev - item.price);
                                      
                                      // Reduce stock in state
                                      setIpadItems(prev =>
                                        prev.map(p => (p.id === item.id ? { ...p, stock: p.stock - 1 } : p))
                                      );
                                      if (!muted) sound.playCoin();
                                      
                                      floatingTextsRef.current.push({
                                        x: playerPosition,
                                        y: 200,
                                        text: `ORDERED ${item.name.toUpperCase()}! 📦`,
                                        color: "#06b6d4",
                                        life: 100
                                      });
                                      
                                      setAlertMessage(`ORDERED! DRONE SHIPS UPON EXIT.`);
                                      setTimeout(() => setAlertMessage(""), 2500);
                                    }}
                                    className="bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-mono text-[8px] font-bold py-0.5 px-2 rounded uppercase transition-colors flex items-center gap-0.5 focus:outline-none"
                                  >
                                    <Coins size={8} />
                                    <span>{item.price} COINS</span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-[8px] font-mono text-zinc-600 font-bold uppercase tracking-wider">
                                  {item.available ? 'OUT OF STOCK' : 'UNAVAILABLE'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Close Bar */}
              <div className="bg-neutral-950 py-2.5 border-t border-neutral-900/60 flex justify-center items-center">
                <button
                  onClick={() => {
                    setShowIpad(false);
                    if (!muted) sound.playClick();
                  }}
                  className="w-16 h-1 bg-neutral-800 rounded-full hover:bg-neutral-700 transition-colors cursor-pointer"
                  title="Close iPad"
                />
              </div>
            </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ITEMS HOTBAR (Bottom Center, highly accessible) */}
      <div className="w-full flex flex-col items-center bg-zinc-950/90 border-x border-b border-zinc-800 p-3 rounded-b-lg select-none">
        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mb-1.5">
          SURVIVAL UTILITY SLOTS [1-5 TO SELECT / EQUIP]
        </span>
        <div className="flex gap-2 justify-center">
          {[0, 1, 2, 3, 4].map(idx => {
            const item = inventory[idx];
            const isSelected = selectedItemIdx === idx;
            return (
              <div
                key={idx}
                onTouchStart={(e) => {
                  e.preventDefault();
                  sound.playClick();
                  setSelectedItemIdx(idx);
                }}
                onClick={() => {
                  sound.playClick();
                  setSelectedItemIdx(idx);
                }}
                className={`w-14 h-14 rounded-lg bg-zinc-900 border flex flex-col items-center justify-center relative cursor-pointer select-none transition-all touch-none ${
                  isSelected 
                    ? 'border-yellow-500 shadow-[0_0_12px_rgba(234,179,8,0.25)] bg-zinc-850 scale-105' 
                    : 'border-zinc-800 hover:border-zinc-700'
                }`}
                title={item ? `${item.label}: ${item.description}` : 'Empty Slot'}
              >
                {/* Hotbar Key number overlay */}
                <span className="absolute top-0.5 left-1 text-[8px] font-mono text-zinc-600">
                  {idx + 1}
                </span>

                {item ? (
                  <div className="flex flex-col items-center justify-center pointer-events-none">
                    {item.type === 'bandage' && <Heart size={16} className="text-red-500 fill-red-500/15" />}
                    {item.type === 'crucifix' && <Sparkles size={16} className="text-yellow-400" />}
                    {item.type === 'radio' && <Music size={16} className="text-cyan-400" />}
                    {item.type === 'flashlight' && <Power size={16} className="text-amber-400" />}
                    {item.type === 'cola' && <Sparkles size={16} className="text-amber-500" />}
                    {item.type === 'lockpick' && <Key size={16} className="text-yellow-500" />}
                    {item.type === 'luck_potion' && <Sparkles size={16} className="text-emerald-400 animate-pulse" />}
                    {item.type === 'skeleton_key' && <Key size={16} className="text-purple-400 animate-pulse" />}
                    {item.type === 'pendant' && <Sparkles size={16} className="text-pink-400" />}
                    {item.type === 'ipad' && <ShoppingBag size={16} className="text-cyan-400" />}
                    {item.type === 'vitamins' && <Zap size={16} className="text-rose-400 animate-pulse" />}
                    <span className="text-[7.5px] font-mono text-zinc-300 font-bold truncate max-w-[50px] uppercase mt-1">
                      {item.label}
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] font-mono text-zinc-700 uppercase pointer-events-none">
                    EMPTY
                  </span>
                )}
              </div>
            );
          })}
        </div>
 
        {/* Selected Item Description text block */}
        <div className="mt-2.5 h-6 text-center">
          {inventory[selectedItemIdx] ? (
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xs font-mono text-zinc-300">
                <span className="text-yellow-500 font-bold uppercase">{inventory[selectedItemIdx].label}:</span> {inventory[selectedItemIdx].description}
              </span>
              {(inventory[selectedItemIdx].type === 'bandage' || inventory[selectedItemIdx].type === 'cola' || inventory[selectedItemIdx].type === 'lockpick' || inventory[selectedItemIdx].type === 'ipad' || inventory[selectedItemIdx].type === 'luck_potion' || inventory[selectedItemIdx].type === 'skeleton_key' || inventory[selectedItemIdx].type === 'vitamins') && (
                <button
                  onTouchStart={(e) => {
                    e.preventDefault();
                    useActiveItem();
                  }}
                  onClick={useActiveItem}
                  className="bg-yellow-950 hover:bg-yellow-900 border border-yellow-850 text-yellow-400 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer font-bold shrink-0 animate-pulse touch-none select-none"
                >
                  {inventory[selectedItemIdx].type === 'bandage' && "PRESS [Q] TO USE"}
                  {inventory[selectedItemIdx].type === 'cola' && "PRESS [Q] TO DRINK"}
                  {inventory[selectedItemIdx].type === 'lockpick' && "PRESS [Q] TO LOCKPICK"}
                  {inventory[selectedItemIdx].type === 'ipad' && "PRESS [Q] TO OPEN IPAD"}
                  {inventory[selectedItemIdx].type === 'luck_potion' && "PRESS [Q] TO DRINK"}
                  {inventory[selectedItemIdx].type === 'skeleton_key' && "PRESS [Q] TO UNLOCK"}
                  {inventory[selectedItemIdx].type === 'vitamins' && "PRESS [Q] TO TAKE"}
                </button>
              )}
            </div>
          ) : (
            <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
              Select an item to view description or hold/use
            </span>
          )}
        </div>
      </div>

      {/* Touch & Onscreen Controls Helper */}
      <div className="w-full flex flex-wrap md:flex-nowrap justify-between items-center gap-3 bg-zinc-900/60 border border-zinc-800 p-4 rounded-b-lg mt-3 select-none">
        
        {/* Left Side: Movement D-Pad */}
        {selectedDevice === 'MOBILE' && (
          <div className="flex items-center gap-2 justify-start shrink-0">
            <button
              onMouseDown={() => { keysPressed.current['KeyA'] = true; }}
              onMouseUp={() => { keysPressed.current['KeyA'] = false; }}
              onTouchStart={(e) => { e.preventDefault(); keysPressed.current['KeyA'] = true; }}
              onTouchEnd={(e) => { e.preventDefault(); keysPressed.current['KeyA'] = false; }}
              onTouchCancel={(e) => { e.preventDefault(); keysPressed.current['KeyA'] = false; }}
              className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-700 text-white rounded-lg flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer touch-none"
              title="Move Left (A)"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              onMouseDown={() => { keysPressed.current['KeyD'] = true; }}
              onMouseUp={() => { keysPressed.current['KeyD'] = false; }}
              onTouchStart={(e) => { e.preventDefault(); keysPressed.current['KeyD'] = true; }}
              onTouchEnd={(e) => { e.preventDefault(); keysPressed.current['KeyD'] = false; }}
              onTouchCancel={(e) => { e.preventDefault(); keysPressed.current['KeyD'] = false; }}
              className="w-12 h-12 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 border border-zinc-700 text-white rounded-lg flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer touch-none"
              title="Move Right (D)"
            >
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* Center Side: Interaction & Use Items */}
        {selectedDevice === 'MOBILE' && (
          <div className="flex justify-center gap-2 flex-1 max-w-xs">
            <button
              onTouchStart={(e) => {
                e.preventDefault();
                handleInteraction();
              }}
              onClick={() => {
                handleInteraction();
              }}
              className="w-full h-12 bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 border border-yellow-500 hover:border-yellow-400 text-white font-mono text-xs font-bold tracking-widest uppercase rounded-lg shadow-lg shadow-yellow-600/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer touch-none select-none"
            >
              <Sparkles size={14} />
              {isHiding ? 'EXIT CLOSET' : 'INTERACT [E]'}
            </button>

            {(inventory[selectedItemIdx]?.type === 'bandage' || inventory[selectedItemIdx]?.type === 'cola' || inventory[selectedItemIdx]?.type === 'lockpick' || inventory[selectedItemIdx]?.type === 'ipad' || inventory[selectedItemIdx]?.type === 'luck_potion' || inventory[selectedItemIdx]?.type === 'skeleton_key' || inventory[selectedItemIdx]?.type === 'vitamins') && (
              <button
                onTouchStart={(e) => {
                  e.preventDefault();
                  useActiveItem();
                }}
                onClick={useActiveItem}
                className="px-4 h-12 bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 text-white font-mono text-xs font-bold tracking-wider uppercase rounded-lg shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer animate-pulse shrink-0 touch-none select-none"
              >
                {inventory[selectedItemIdx]?.type === 'ipad' ? <ShoppingBag size={14} /> : <Heart size={14} fill="white" />}
                {inventory[selectedItemIdx]?.type === 'bandage' ? 'HEAL' : inventory[selectedItemIdx]?.type === 'cola' ? 'DRINK' : inventory[selectedItemIdx]?.type === 'lockpick' ? 'LOCKPICK' : inventory[selectedItemIdx]?.type === 'ipad' ? 'OPEN IPAD' : inventory[selectedItemIdx]?.type === 'skeleton_key' ? 'UNLOCK' : inventory[selectedItemIdx]?.type === 'vitamins' ? 'TAKE VITAMINS' : 'DRINK LUCK'}
              </button>
            )}
          </div>
        )}

        {/* Right Side: Sprint Button & Flashlight Toggle */}
        <div className={`flex gap-2 items-center ${selectedDevice === 'COMPUTER' ? 'w-full justify-center' : 'justify-end ml-auto'}`}>
          {/* Sprint Button */}
          <button
            onMouseDown={() => setTouchSprinting(true)}
            onMouseUp={() => setTouchSprinting(false)}
            onTouchStart={(e) => {
              e.preventDefault();
              setTouchSprinting(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              setTouchSprinting(false);
            }}
            onTouchCancel={(e) => {
              e.preventDefault();
              setTouchSprinting(false);
            }}
            className={`px-6 h-12 border rounded-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer font-mono text-xs font-bold uppercase select-none touch-none ${
              isSprinting && stamina > 0
                ? 'bg-cyan-600 border-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            }`}
            title="Sprint (Hold Shift / Touch)"
          >
            <Zap size={14} />
            SPRINT
          </button>

          <button
            onTouchStart={(e) => {
              e.preventDefault();
              toggleFlashlight();
            }}
            onClick={() => {
              toggleFlashlight();
            }}
            className={`w-12 h-12 border rounded-lg flex items-center justify-center transition-all shadow-md active:scale-95 cursor-pointer touch-none select-none ${
              flashlightOn && (inventory[selectedItemIdx]?.type === 'flashlight') && flashlightBattery > 0
                ? 'bg-amber-600/10 border-amber-500 text-amber-400 hover:bg-amber-600/20' 
                : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:bg-zinc-700'
            }`}
            title="Toggle Flashlight (F)"
          >
            <Power size={18} />
          </button>
        </div>
      </div>

      {/* Keyboard Controls Legend */}
      <div className="w-full flex justify-center gap-4 mt-3 font-mono text-[9px] text-zinc-500 uppercase tracking-widest select-none flex-wrap text-center">
        <span>A / D or ◄ / ► : Walk</span>
        <span>Space / E : Interact</span>
        <span>Shift : Sprint</span>
        <span>F : Flashlight</span>
        <span>Q : Heal</span>
        <span>Digit 1-5 : Slot Select</span>
      </div>

      {/* Puzzle Modal Overlay rendering */}
      <AnimatePresence>
        {showFusePuzzle && (
          <FusePuzzle
            doorNumber={currentDoor}
            keysCount={keysCollected}
            onSolve={() => {
              setKeysCollected(prev => prev + 1);
              setIsDoorLocked(false);
              setShowFusePuzzle(false);
              setStats(prev => ({ ...prev, puzzlesSolved: prev.puzzlesSolved + 1 }));
            }}
            onClose={() => setShowFusePuzzle(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSwitchPuzzle && (
          <SwitchPuzzle
            onSolve={() => {
              setSwitchRepaired(true);
              setElevatorOpened(true);
              setShowSwitchPuzzle(false);
              setStats(prev => ({ ...prev, puzzlesSolved: prev.puzzlesSolved + 1 }));
            }}
            onClose={() => setShowSwitchPuzzle(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showChestLockPuzzle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-zinc-900 border-2 border-yellow-600 rounded-xl max-w-sm w-full p-6 shadow-2xl relative flex flex-col items-center"
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Lock className="text-yellow-500 animate-pulse" size={20} />
                <span className="font-mono text-sm text-yellow-500 font-extrabold uppercase tracking-widest text-center">
                  SECURE SUPPLY CHEST
                </span>
              </div>

              <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider mb-6 text-center leading-relaxed">
                Dial the correct 3-digit combination found on chest scrolls in this room to unlock this secure cache.
              </p>

              {/* Dialers */}
              <div className="flex gap-4 mb-6 justify-center">
                {/* Digit 1 */}
                <div className="flex flex-col items-center bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <button
                    onClick={() => {
                      setDigit1(prev => (prev + 1) % 10);
                      if (!muted) sound.playClick();
                    }}
                    className="text-zinc-500 hover:text-yellow-500 p-1 font-extrabold text-sm transition-colors cursor-pointer select-none"
                  >
                    ▲
                  </button>
                  <span className="text-3xl font-mono text-white font-extrabold py-2 px-3 tracking-widest">{digit1}</span>
                  <button
                    onClick={() => {
                      setDigit1(prev => (prev + 9) % 10);
                      if (!muted) sound.playClick();
                    }}
                    className="text-zinc-500 hover:text-yellow-500 p-1 font-extrabold text-sm transition-colors cursor-pointer select-none"
                  >
                    ▼
                  </button>
                </div>

                {/* Digit 2 */}
                <div className="flex flex-col items-center bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <button
                    onClick={() => {
                      setDigit2(prev => (prev + 1) % 10);
                      if (!muted) sound.playClick();
                    }}
                    className="text-zinc-500 hover:text-yellow-500 p-1 font-extrabold text-sm transition-colors cursor-pointer select-none"
                  >
                    ▲
                  </button>
                  <span className="text-3xl font-mono text-white font-extrabold py-2 px-3 tracking-widest">{digit2}</span>
                  <button
                    onClick={() => {
                      setDigit2(prev => (prev + 9) % 10);
                      if (!muted) sound.playClick();
                    }}
                    className="text-zinc-500 hover:text-yellow-500 p-1 font-extrabold text-sm transition-colors cursor-pointer select-none"
                  >
                    ▼
                  </button>
                </div>

                {/* Digit 3 */}
                <div className="flex flex-col items-center bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                  <button
                    onClick={() => {
                      setDigit3(prev => (prev + 1) % 10);
                      if (!muted) sound.playClick();
                    }}
                    className="text-zinc-500 hover:text-yellow-500 p-1 font-extrabold text-sm transition-colors cursor-pointer select-none"
                  >
                    ▲
                  </button>
                  <span className="text-3xl font-mono text-white font-extrabold py-2 px-3 tracking-widest">{digit3}</span>
                  <button
                    onClick={() => {
                      setDigit3(prev => (prev + 9) % 10);
                      if (!muted) sound.playClick();
                    }}
                    className="text-zinc-500 hover:text-yellow-500 p-1 font-extrabold text-sm transition-colors cursor-pointer select-none"
                  >
                    ▼
                  </button>
                </div>
              </div>

              {/* Combination Code Display under the digits */}
              <div className="w-full bg-zinc-950/80 border border-yellow-600/30 rounded-lg p-3 text-center mb-6 shadow-inner">
                <div className="text-zinc-500 font-mono text-[9.5px] uppercase tracking-wider mb-1">
                  🔑 {sideRoomCodeFound ? "CURRENT SECURE COMBINATION" : "COMBINATION UNKNOWN"}
                </div>
                <div className="text-2xl font-mono text-yellow-500 font-extrabold tracking-[0.3em] pl-[0.3em] animate-pulse">
                  {sideRoomCodeFound ? sideRoomCode : "???"}
                </div>
                {!sideRoomCodeFound && (
                  <div className="text-[8.5px] font-mono text-zinc-500 mt-1 uppercase">
                    Search side-room drawers for the scroll code!
                  </div>
                )}
              </div>

              {/* Feedback Alert flash */}
              {chestErrorFlash && (
                <div className="mb-4 text-red-500 font-mono text-xs font-bold uppercase tracking-wider animate-bounce">
                  ❌ COMBINATION INCORRECT!
                </div>
              )}

              {/* Check & Close buttons */}
              <div className="flex flex-col gap-2.5 w-full">
                <button
                  onClick={() => {
                    const currentDial = `${digit1}${digit2}${digit3}`;
                    if (currentDial === sideRoomCode) {
                      setSideRoomChestUnlocked(true);
                      setShowChestLockPuzzle(false);
                      setCoins(prev => prev + 12);
                      triggerCoinAnimation(12, playerPosition);
                      addToInventory('lockpick', 'Lockpick', 'Instantly unlocks locked doors.');
                      if (!muted) sound.playUnlock();
                      floatingTextsRef.current.push({
                        x: playerPosition,
                        y: 200,
                        text: "+12 COINS & LOCKPICK",
                        color: "#fbbf24",
                        life: 120
                      });
                      setAlertMessage("SUCCESS! CHEST OPENED: FOUND LOCKPICK & 12 COINS!");
                      setTimeout(() => setAlertMessage(""), 4500);
                    } else {
                      setChestErrorFlash(true);
                      if (!muted) sound.playClick();
                      setTimeout(() => setChestErrorFlash(false), 2000);
                    }
                  }}
                  className="w-full bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 text-white font-mono text-xs font-bold py-2.5 rounded-lg border border-yellow-500 uppercase tracking-widest cursor-pointer shadow-lg shadow-yellow-600/10"
                >
                  CHECK COMBINATION
                </button>

                <button
                  onClick={() => setShowChestLockPuzzle(false)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-mono text-xs py-2 rounded-lg border border-zinc-700 uppercase transition-colors cursor-pointer"
                >
                  CANCEL
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
