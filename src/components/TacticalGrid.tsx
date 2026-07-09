import React from 'react';
import { ArrowLeft, ShieldAlert, Sparkles, Gamepad2, Volume2, Info } from 'lucide-react';
import { sound } from '../utils/audio';

interface TacticalGridProps {
  onBack: () => void;
}

export default function TacticalGrid({ onBack }: TacticalGridProps) {
  const handleBack = () => {
    sound.playClick();
    onBack();
  };

  // Inline full HTML source of Tactical Grid: Overdrive Engine
  const gameHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tactical Grid: Overdrive Engine</title>
    <style>
        :root {
            --bg-dark: #07080c;
            --panel-bg: rgba(15, 18, 25, 0.9);
            --border-glow: rgba(0, 255, 200, 0.15);
            --cyber-cyan: #00f3ff;
            --cyber-green: #39ff14;
            --cyber-purple: #bd00ff;
            --cyber-orange: #ff7b00;
            --cyber-red: #ff3366;
            --text-main: #e2e8f0;
            --card-bg: rgba(30, 41, 59, 0.7);
        }

        body {
            background-color: var(--bg-dark);
            background-image: 
                radial-gradient(at 50% 0%, rgba(0, 243, 255, 0.08) 0px, transparent 50%),
                radial-gradient(at 0% 100%, rgba(189, 0, 255, 0.05) 0px, transparent 50%);
            color: var(--text-main);
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
            margin: 0;
            padding: 10px;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow-x: hidden;
        }

        h1 {
            margin: 0 0 15px 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: 2px;
            text-transform: uppercase;
            color: #fff;
            text-shadow: 0 0 20px rgba(0, 243, 255, 0.6);
            display: flex;
            align-items: center;
            gap: 10px;
            text-align: center;
            justify-content: center;
        }

        h1 span {
            font-size: 11px;
            padding: 3px 6px;
            background: rgba(0, 243, 255, 0.15);
            border: 1px solid var(--cyber-cyan);
            border-radius: 4px;
            letter-spacing: 1px;
            vertical-align: middle;
            color: var(--cyber-cyan);
            text-shadow: none;
        }

        #game-container {
            position: relative;
            display: flex;
            gap: 20px;
            background: var(--panel-bg);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
            padding: 15px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), inset 0 0 30px rgba(0, 243, 255, 0.03);
            max-width: 1150px;
            width: 100%;
            box-sizing: border-box;
            justify-content: center;
            align-items: flex-start;
        }

        @media (max-width: 1024px) {
            #game-container {
                flex-direction: column;
                align-items: center;
            }
            #sidebar {
                width: 100% !important;
                max-width: 800px;
            }
        }

        .canvas-wrapper {
            position: relative;
            border-radius: 12px;
            overflow: hidden;
            border: 2px solid rgba(255, 255, 255, 0.05);
            box-shadow: 0 0 30px rgba(0, 0, 0, 0.8);
            max-width: 100%;
        }

        canvas {
            background: #11141a;
            display: block;
            cursor: crosshair;
            max-width: 100%;
            height: auto;
        }

        #sidebar {
            width: 320px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            shrink-0;
        }

        .panel {
            background: rgba(10, 13, 18, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 10px;
            padding: 12px;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
        }

        .stat-item {
            padding: 8px;
            background: var(--card-bg);
            border-radius: 6px;
            font-size: 13px;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }

        .stat-item.cash { border-bottom-color: var(--cyber-cyan); color: #fff; }
        .stat-item.lives { border-bottom-color: var(--cyber-red); color: #fff; }
        .stat-item.wave { grid-column: span 2; border-bottom-color: var(--cyber-purple); justify-content: center; gap: 8px; font-size: 13px; }

        .stat-val {
            font-family: 'Courier New', Courier, monospace;
            font-size: 15px;
            color: #fff;
        }

        .buff-timer {
            grid-column: span 2;
            background: rgba(255, 51, 102, 0.15);
            border: 1px solid var(--cyber-red);
            padding: 6px;
            font-size: 11px;
            font-weight: bold;
            text-align: center;
            display: none;
            border-radius: 6px;
            color: #ff99bb;
            animation: pulse 2s infinite;
        }

        .system-controls {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
        }
        
        .sys-btn {
            background: #1e293b;
            color: #94a3b8;
            border: 1px solid rgba(255, 255, 255, 0.05);
            text-align: center;
            font-size: 11px;
            font-weight: 600;
            padding: 8px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .sys-btn:hover {
            background: #334155;
            color: #fff;
        }

        .sys-btn.active-toggle {
            background: rgba(57, 255, 20, 0.1) !important;
            border-color: var(--cyber-green) !important;
            color: var(--cyber-green) !important;
            text-shadow: 0 0 8px rgba(57, 255, 20, 0.5);
        }

        .wave-btn {
            grid-column: span 2;
            background: linear-gradient(135deg, #00b4db, #0083b0);
            color: white;
            border: none;
            font-size: 13px;
            font-weight: 800;
            letter-spacing: 1px;
            padding: 10px;
            border-radius: 6px;
            cursor: pointer;
            text-transform: uppercase;
            box-shadow: 0 4px 15px rgba(0, 180, 219, 0.3);
            transition: all 0.2s ease;
            text-align: center;
        }

        .wave-btn:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(0, 180, 219, 0.5);
            filter: brightness(1.1);
        }

        .wave-btn:disabled {
            background: #1e293b;
            color: #475569;
            box-shadow: none;
            cursor: not-allowed;
            transform: none;
        }

        .menu-tabs {
            display: flex;
            background: rgba(0,0,0,0.2);
            padding: 3px;
            border-radius: 6px;
            margin-bottom: 10px;
            border: 1px solid rgba(255,255,255,0.03);
        }

        .tab-trigger {
            flex: 1;
            background: transparent;
            border: none;
            color: #64748b;
            padding: 6px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            border-radius: 5px;
            transition: all 0.2s;
            text-align: center;
        }

        .tab-trigger.active {
            background: #1e293b;
            color: var(--cyber-cyan);
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }

        .tab-content {
            display: none;
            flex-direction: column;
            gap: 6px;
            max-height: 200px; 
            overflow-y: auto;
            padding-right: 2px;
        }

        .tab-content.active { display: flex; }
        .tab-content::-webkit-scrollbar { width: 4px; }
        .tab-content::-webkit-scrollbar-thumb { background: #334155; border-radius: 4px; }

        .shop-card {
            background: var(--card-bg);
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 6px;
            padding: 8px 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .shop-card:hover {
            background: rgba(51, 65, 85, 0.8);
            border-color: rgba(255, 255, 255, 0.1);
            transform: translateX(2px);
        }

        .shop-card.selected {
            background: rgba(0, 243, 255, 0.08) !important;
            border-color: var(--cyber-cyan) !important;
            box-shadow: 0 0 10px rgba(0, 243, 255, 0.2);
        }

        .card-info {
            display: flex;
            flex-direction: column;
            gap: 1px;
        }

        .card-title {
            font-weight: 700;
            font-size: 12px;
            color: #f1f5f9;
        }

        .card-desc {
            font-size: 10px;
            color: #64748b;
        }

        .card-cost {
            font-family: 'Courier New', Courier, monospace;
            font-weight: 800;
            font-size: 13px;
            color: #fff;
            background: rgba(0, 0, 0, 0.3);
            padding: 3px 6px;
            border-radius: 4px;
            border-left: 3px solid var(--cyber-cyan);
        }

        .card-spike .card-cost { border-left-color: #cbd5e1; }
        .card-sniper .card-cost { border-left-color: #38bdf8; }
        .card-slime .card-cost { border-left-color: var(--cyber-green); }
        .card-minigun .card-cost { border-left-color: #f59e0b; }
        .card-flamethrower .card-cost { border-left-color: #ef4444; }
        .card-ability .card-cost { border-left-color: var(--cyber-orange); }

        #upgrade-panel {
            display: none;
            background: linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.5) 100%);
            border: 1px solid rgba(0, 243, 255, 0.2);
            box-shadow: 0 4px 20px rgba(0, 243, 255, 0.05);
        }

        #upgrade-tower-name {
            margin: 0 0 2px 0;
            font-size: 13px;
            color: #fff;
            font-weight: 800;
        }

        .upgrade-row {
            margin-top: 8px;
        }

        .upgrade-title {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-bottom: 3px;
            font-weight: 700;
        }

        .upgrade-btn {
            width: 100%;
            background: #1e293b;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 6px;
            padding: 6px 10px;
            color: #fff;
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-align: left;
            transition: all 0.2s ease;
        }

        .upgrade-btn:hover:not(:disabled) {
            background: #2d3748;
            border-color: var(--cyber-green);
        }

        .upgrade-btn:disabled {
            opacity: 0.3;
            cursor: not-allowed;
            background: #0f172a;
        }

        .sell-btn {
            margin-top: 10px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #f87171;
            width: 100%;
            padding: 6px;
            border-radius: 6px;
            font-weight: 700;
            cursor: pointer;
            text-align: center;
            font-size: 11px;
            transition: all 0.2s;
        }

        .sell-btn:hover {
            background: rgba(239, 68, 68, 0.25);
            color: #fff;
            border-color: #ef4444;
        }

        #game-over-overlay {
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(7, 8, 12, 0.9);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 100;
            border-radius: 12px;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            gap: 15px;
        }

        .game-over-title {
            color: var(--cyber-red);
            font-size: 32px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 3px;
            text-shadow: 0 0 20px rgba(255, 51, 102, 0.6);
            margin: 0;
        }

        .game-over-desc {
            color: #94a3b8;
            font-size: 14px;
            margin: 0 0 10px 0;
            text-align: center;
            max-width: 80%;
        }

        .restart-btn {
            background: linear-gradient(135deg, #39ff14, #00aa00);
            color: #000;
            border: none;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 1px;
            padding: 12px 30px;
            border-radius: 8px;
            cursor: pointer;
            text-transform: uppercase;
            box-shadow: 0 0 20px rgba(57, 255, 20, 0.4);
            transition: all 0.2s ease;
        }

        .restart-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 0 30px rgba(57, 255, 20, 0.7);
            filter: brightness(1.1);
        }

        @keyframes pulse {
            0% { opacity: 0.8; }
            50% { opacity: 1; box-shadow: 0 0 10px rgba(255, 51, 102, 0.3); }
            100% { opacity: 0.8; }
        }
    </style>
</head>
<body>

    <h1 id="game-title">Tactical Defense Grid <span>Normal Engine</span></h1>
    
    <div id="game-container">
        <div id="game-over-overlay">
            <h2 class="game-over-title">GRID COMPROMISED</h2>
            <p class="game-over-desc">Defense array offline. Sector overrun by hostile creeps.</p>
            <button class="restart-btn" onclick="restartGame()">Re-initialize Engine Node</button>
        </div>

        <div class="canvas-wrapper">
            <canvas id="gameCanvas" width="800" height="600"></canvas>
        </div>
        
        <div id="sidebar">
            <div class="panel stats-grid">
                <div class="stat-item cash">💰 Cash <span class="stat-val" id="stat-money">500</span></div>
                <div class="stat-item lives">❤️ Lives <span class="stat-val" id="stat-lives">20</span></div>
                <div class="stat-item wave">🌊 Sector Run: <span class="stat-val" id="stat-wave">0/20</span></div>
                <div class="buff-timer" id="buff-damage-timer">🔥 MATRIX OVERDRIVE (2X DMG): <span id="buff-time-left">60</span>s</div>
            </div>

            <div class="panel system-controls">
                <button class="sys-btn" id="btn-auto" onclick="toggleAutoStart()">Auto-Start: OFF</button>
                <button class="sys-btn" id="btn-speed" onclick="toggleGameSpeed()">Speed: 1x</button>
                <button class="wave-btn" id="btn-wave" onclick="startNextWave()">Initialize Sector Defense</button>
            </div>

            <div class="panel" style="display: flex; flex-direction: column;">
                <div class="menu-tabs">
                    <button class="tab-trigger active" id="tab-build-trigger" onclick="switchTab('build')">Defense Core</button>
                    <button class="tab-trigger" id="tab-abilities-trigger" onclick="switchTab('abilities')">Tactical Modifiers</button>
                </div>

                <div class="tab-content active" id="tab-build">
                    <div class="shop-card card-spike" id="btn-spike" onclick="selectTowerType('spike')">
                        <div class="card-info">
                            <span class="card-title">📍 Spike Factory</span>
                            <span class="card-desc">Drops hazard items directly onto track maps.</span>
                        </div>
                        <span class="card-cost">$150</span>
                    </div>
                    <div class="shop-card card-sniper" id="btn-sniper" onclick="selectTowerType('sniper')">
                        <div class="card-info">
                            <span class="card-title">🎯 Sniper Tower</span>
                            <span class="card-desc">Infinite map range heavy target tracking lock.</span>
                        </div>
                        <span class="card-cost">$220</span>
                    </div>
                    <div class="shop-card card-slime" id="btn-slime" onclick="selectTowerType('slime')">
                        <div class="card-info">
                            <span class="card-title">🧪 Slime Dispenser</span>
                            <span class="card-desc">Spawns moving vanguard units onto layout frames.</span>
                        </div>
                        <span class="card-cost">$300</span>
                    </div>
                    <div class="shop-card card-minigun" id="btn-minigun" style="display:none;" onclick="selectTowerType('minigun')">
                        <div class="card-info">
                            <span class="card-title">⚡ Mini-Gun Turret</span>
                            <span class="card-desc">Accelerating spin tracking loop heavy damage outputs.</span>
                        </div>
                        <span class="card-cost">$450</span>
                    </div>
                    <div class="shop-card card-flamethrower" id="btn-flamethrower" style="display:none;" onclick="selectTowerType('flamethrower')">
                        <div class="card-info">
                            <span class="card-title">🔥 Flamethrower</span>
                            <span class="card-desc">Sustained splash damage-over-time fire fields.</span>
                        </div>
                        <span class="card-cost">$380</span>
                    </div>
                </div>

                <div class="tab-content" id="tab-abilities">
                    <div class="shop-card card-ability" onclick="buyAbility('doubleDamage')">
                        <div class="card-info">
                            <span class="card-title">🔥 Matrix 2x Overdrive Boost</span>
                            <span class="card-desc">Doubles entire grid output damage specs for 60s.</span>
                        </div>
                        <span class="card-cost">$500</span>
                    </div>
                    <div class="shop-card card-ability" onclick="buyAbility('reinforcements')">
                        <div class="card-info">
                            <span class="card-title">💪 Allied Tactical Vanguard Drops</span>
                            <span class="card-desc">Deploys 4 high-health mobile slime defenders instantly.</span>
                        </div>
                        <span class="card-cost">$350</span>
                    </div>
                </div>
            </div>

            <div class="panel" id="upgrade-panel">
                <h3 id="upgrade-tower-name">Structure Node Select</h3>
                <p id="upgrade-tower-stats" style="font-size: 11px; color: #64748b; margin: 0 0 10px 0;"></p>
                
                <div class="upgrade-row">
                    <div class="upgrade-title">Path Alpha Matrix (Utility/Cadence)</div>
                    <button class="upgrade-btn" id="btn-up-a" onclick="upgradeSelected('A')">Upgrade Node</button>
                </div>
                <div class="upgrade-row">
                    <div class="upgrade-title">Path Beta Matrix (Yield/Radius)</div>
                    <button class="upgrade-btn" id="btn-up-b" onclick="upgradeSelected('B')">Upgrade Node</button>
                </div>
                <button class="sell-btn" onclick="sellSelected()">Decommission Structure Node</button>
            </div>
        </div>
    </div>

<script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let money = 500;
    let lives = 20;
    let wave = 0;
    let gameMode = 'normal'; 
    let mediumModeUnlocked = false;
    let hardModeUnlocked = false;
    let waveInProgress = false;
    let totalCreepsToSpawn = 0;
    let currentSpawnedCount = 0;
    let activeSpawnQueue = [];
    let isGameOver = false;
    
    let towers = [];
    let enemies = [];
    let projectiles = [];
    let spikes = [];
    let friendlySlimes = [];
    
    let selectedTowerType = null;
    let selectedTowerInstance = null;
    let isAutoStart = false;
    let gameSpeed = 1;

    let globalDamageMultiplier = 1.0;
    let doubleDamageTimer = 0;

    const path = [
        {x: -20, y: 150},
        {x: 250, y: 150},
        {x: 250, y: 450},
        {x: 550, y: 450},
        {x: 550, y: 100},
        {x: 820, y: 100}
    ];

    const TOWER_CONFIGS = {
        spike: { price: 150, range: 90, name: "Spike Factory" },
        sniper: { price: 220, range: 9999, name: "Sniper Tower" },
        slime: { price: 300, range: 120, name: "Slime Dispenser" },
        minigun: { price: 450, range: 160, name: "Mini-Gun Turret" },
        flamethrower: { price: 380, range: 110, name: "Flamethrower" }
    };

    const UPGRADES = {
        spike: {
            A: [{ name: "Faster Production", cost: 100, desc: "Drops spikes 30% faster" }, { name: "Longer Lasting Spikes", cost: 180, desc: "Spikes last longer on track" }, { name: "Spike Carpeting", cost: 350, desc: "Produces pairs of spikes" }, { name: "Factory Overdrive", cost: 600, desc: "Insane production speed" }],
            B: [{ name: "Thicker Steel", cost: 120, desc: "Each spike pile gets +2 max pierce" }, { name: "Barbed Hooks", cost: 200, desc: "Deals double damage per hit" }, { name: "Mogul Spikes", cost: 400, desc: "Traps multiple enemies permanently until dead" }, { name: "Spike Storm Core", cost: 850, desc: "Spikes deal explosive shatter damage" }]
        },
        sniper: {
            A: [{ name: "Rapid Refit", cost: 150, desc: "Reduces reload delay significantly" }, { name: "Night Vision Scope", cost: 250, desc: "Prioritizes targets with weaknesses" }, { name: "Semi-Automatic", cost: 500, desc: "Shoots 3x faster" }, { name: "Elite Sniper Elite", cost: 1100, desc: "Hyper-velocity fire rate" }],
            B: [{ name: "Heavy Caliber", cost: 180, desc: "+15 Base damage per shot" }, { name: "Deadly Shot", cost: 300, desc: "+40 damage, pierces first shield" }, { name: "Cripple MOAB", cost: 600, desc: "Stuns strongest enemy for 1.5s" }, { name: "The Big One", cost: 1500, desc: "Deals 500 massive chunk damage" }]
        },
        slime: {
            A: [{ name: "Acid Puddle", cost: 150, desc: "Slimes leave tiny corrosive tracks" }, { name: "Corrosive Spit", cost: 280, desc: "Slimes gain dynamic mid-range spit" }, { name: "Volatile Serum", cost: 450, desc: "Spit melts armor, dealing DOT" }, { name: "Slime Dragon Spit", cost: 900, desc: "Slimes breathe wide plasma spit" }],
            B: [{ name: "Healthy Growth", cost: 130, desc: "Spawned slimes gain +30 Max Health" }, { name: "Elastic Core", cost: 240, desc: "Slimes rebound, reducing damage by half" }, { name: "Goliath Slimes", cost: 500, desc: "Massive slimes capable of trapping up to 3 enemies" }, { name: "Regenerative Overlord", cost: 1200, desc: "Slimes regenerate full health in combat" }]
        },
        minigun: {
            A: [{ name: "Motor Tuning", cost: 200, desc: "Reduces fire cycle delay by 1 frame" }, { name: "Titanium Barrels", cost: 350, desc: "Reduces fire delay by another frame" }, { name: "Laser Sight", cost: 550, desc: "Increases tower tracking range by 60" }, { name: "Apex Gatling Core", cost: 1200, desc: "Fires double projectiles every frame" }],
            B: [{ name: "Depleted Uranium", cost: 250, desc: "+2 damage per heavy bullet" }, { name: "Armor Piercing", cost: 400, desc: "Bullets pierce through up to 2 targets" }, { name: "High Caliber Rounds", cost: 650, desc: "+5 damage and micro stuns targets" }, { name: "Doomsday Shredder", cost: 1400, desc: "Shreds absolute armor layers off targets" }]
        },
        flamethrower: {
            A: [{ name: "High Pressure Pump", cost: 180, desc: "Increases flame fire sweep range" }, { name: "Thermite Additives", cost: 300, desc: "Increases burn time durations" }, { name: "Supercharger Fuel", cost: 500, desc: "Flame hits lock targets down in place" }, { name: "Sun God Firestorms", cost: 1100, desc: "Massive fire wall ranges" }],
            B: [{ name: "Blue Flames", cost: 150, desc: "Increases fire damage over time ticks" }, { name: "Sticky Napalm", cost: 320, desc: "Burn ticks hit twice as fast" }, { name: "Oxidizer Mix", cost: 550, desc: "Fire damage ticks explode into clusters" }, { name: "Magma Fusion Core", cost: 1300, desc: "Melts target health arrays instantly" }]
        }
    };

    function switchTab(tabId) {
        if(isGameOver) return;
        document.querySelectorAll('.tab-trigger').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        document.getElementById('tab-' + tabId + '-trigger').classList.add('active');
        document.getElementById('tab-' + tabId).classList.add('active');
    }

    canvas.addEventListener('click', function(e) {
        if(isGameOver) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
        const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

        let clickedTower = null;
        for (let t of towers) {
            let dist = Math.hypot(t.x - mouseX, t.y - mouseY);
            if (dist < 22) { clickedTower = t; break; }
        }

        if (clickedTower) {
            selectedTowerInstance = clickedTower;
            selectedTowerType = null;
            clearShopSelection();
            showUpgradePanel();
            return;
        }

        if (selectedTowerType) {
            let cost = TOWER_CONFIGS[selectedTowerType].price;
            if (money >= cost) {
                if (isCloseToPath(mouseX, mouseY, 30)) {
                    alert("Cannot build inside the track pathways!");
                    return;
                }
                
                towers.push({
                    id: Date.now(),
                    type: selectedTowerType,
                    x: mouseX,
                    y: mouseY,
                    range: TOWER_CONFIGS[selectedTowerType].range,
                    pathA: 0,
                    pathB: 0,
                    cooldown: 0,
                    minigunInterval: 30,
                    level: 1
                });
                money -= cost;
                selectedTowerType = null;
                clearShopSelection();
                updateUI();
            }
        } else {
            selectedTowerInstance = null;
            hideUpgradePanel();
        }
    });

    function selectTowerType(type) {
        if(isGameOver) return;
        selectedTowerInstance = null;
        hideUpgradePanel();
        clearShopSelection();
        selectedTowerType = type;
        document.getElementById('btn-' + type).classList.add('selected');
    }

    function clearShopSelection() {
        ['spike', 'sniper', 'slime', 'minigun', 'flamethrower'].forEach(t => {
            const el = document.getElementById('btn-' + t);
            if (el) el.classList.remove('selected');
        });
    }

    function isCloseToPath(x, y, maxDist) {
        for (let i = 0; i < path.length - 1; i++) {
            let p1 = path[i]; let p2 = path[i+1];
            let A = x - p1.x; let B = y - p1.y;
            let C = p2.x - p1.x; let D = p2.y - p1.y;
            let dot = A * C + B * D;
            let lenSq = C * C + D * D;
            let param = -1;
            if (lenSq !== 0) param = dot / lenSq;
            
            let xx, yy;
            if (param < 0) { xx = p1.x; yy = p1.y; }
            else if (param > 1) { xx = p2.x; yy = p2.y; }
            else { xx = p1.x + param * C; yy = p1.y + param * D; }
            
            if (Math.hypot(x - xx, y - yy) < maxDist) return true;
        }
        return false;
    }

    function toggleAutoStart() {
        if(isGameOver) return;
        isAutoStart = !isAutoStart;
        const el = document.getElementById('btn-auto');
        if(isAutoStart) {
            el.innerText = "Auto-Start: ON";
            el.classList.add('active-toggle');
            if(!waveInProgress) startNextWave();
        } else {
            el.innerText = "Auto-Start: OFF";
            el.classList.remove('active-toggle');
        }
    }

    function toggleGameSpeed() {
        if(isGameOver) return;
        gameSpeed = gameSpeed === 1 ? 2 : 1;
        const el = document.getElementById('btn-speed');
        if(gameSpeed === 2) {
            el.innerText = "Speed: 2x";
            el.classList.add('active-toggle');
        } else {
            el.innerText = "Speed: 1x";
            el.classList.remove('active-toggle');
        }
    }

    function buyAbility(id) {
        if(isGameOver) return;
        if (id === 'doubleDamage') {
            if (money >= 500) {
                money -= 500;
                globalDamageMultiplier = 2.0;
                doubleDamageTimer = 1800; 
                updateUI();
            } else { alert("Insufficient funds for 2x Damage Buff!"); }
        } else if (id === 'reinforcements') {
            if (money >= 350) {
                money -= 350;
                for (let i = 0; i < 4; i++) {
                    friendlySlimes.push({
                        parentID: 'tactical_reinforcement',
                        x: path[2].x + (Math.random()*40 - 20),
                        y: path[2].y + (Math.random()*40 - 20),
                        distanceWalked: 250 + (i * 20), 
                        hp: 300, maxHp: 300, spitCooldown: 0, pathA: 2, pathB: 2
                    });
                }
                updateUI();
            } else { alert("Insufficient funds for Tactical Reinforcements!"); }
        }
    }

    function showUpgradePanel() {
        let t = selectedTowerInstance;
        if (!t) return;

        document.getElementById('upgrade-panel').style.display = 'block';
        document.getElementById('upgrade-tower-name').innerText = TOWER_CONFIGS[t.type].name;
        document.getElementById('upgrade-tower-stats').innerText = "Matrix Integration: Path A [Tier " + t.pathA + "/4] | Path B [Tier " + t.pathB + "/4]";

        let btnA = document.getElementById('btn-up-a');
        let btnB = document.getElementById('btn-up-b');

        btnA.disabled = false;
        btnB.disabled = false;

        if (t.pathA >= 4) { 
            btnA.innerHTML = "<span>MAXED OUT TIER</span>"; 
            btnA.disabled = true; 
        } else if (t.pathB >= 3 && t.pathA >= 2) { 
            btnA.innerHTML = "<span>PATH MATRIX LOCKED</span>"; 
            btnA.disabled = true; 
        } else { 
            let upA = UPGRADES[t.type].A[t.pathA];
            btnA.innerHTML = "<div><strong>" + upA.name + "</strong><br><span style='font-size:10px;color:#aaa;'>" + upA.desc + "</span></div><span class='card-cost'>$" + upA.cost + "</span>"; 
            if (money < upA.cost) btnA.disabled = true;
        }

        if (t.pathB >= 4) { 
            btnB.innerHTML = "<span>MAXED OUT TIER</span>"; 
            btnB.disabled = true; 
        } else if (t.pathA >= 3 && t.pathB >= 2) { 
            btnB.innerHTML = "<span>PATH MATRIX LOCKED</span>"; 
            btnB.disabled = true; 
        } else { 
            let upB = UPGRADES[t.type].B[t.pathB];
            btnB.innerHTML = "<div><strong>" + upB.name + "</strong><br><span style='font-size:10px;color:#aaa;'>" + upB.desc + "</span></div><span class='card-cost'>$" + upB.cost + "</span>"; 
            if (money < upB.cost) btnB.disabled = true;
        }
    }

    function hideUpgradePanel() { document.getElementById('upgrade-panel').style.display = 'none'; }

    function upgradeSelected(pathLine) {
        if(isGameOver) return;
        let t = selectedTowerInstance;
        if (!t) return;

        if (pathLine === 'A' && t.pathA < 4) {
            let cost = UPGRADES[t.type].A[t.pathA].cost;
            if (money >= cost) { money -= cost; t.pathA++; }
        } else if (pathLine === 'B' && t.pathB < 4) {
            let cost = UPGRADES[t.type].B[t.pathB].cost;
            if (money >= cost) { money -= cost; t.pathB++; }
        }
        
        updateUI();
    }

    function sellSelected() {
        if(isGameOver) return;
        if (!selectedTowerInstance) return;
        money += Math.floor(TOWER_CONFIGS[selectedTowerInstance.type].price * 0.7);
        towers = towers.filter(t => t.id !== selectedTowerInstance.id);
        selectedTowerInstance = null;
        hideUpgradePanel();
        updateUI();
    }

    function updateUI() {
        document.getElementById('stat-money').innerText = money;
        document.getElementById('stat-lives').innerText = Math.max(0, lives);
        
        let runtimeTag = '/20';
        if (gameMode === 'medium') runtimeTag = ' (Medium Master Run)';
        if (gameMode === 'hard') runtimeTag = ' (⚠️ HARD CRITICAL ENGAGEMENT)';
        document.getElementById('stat-wave').innerText = wave + runtimeTag;
        
        document.getElementById('btn-wave').disabled = waveInProgress || isGameOver;
        
        if (mediumModeUnlocked || hardModeUnlocked) {
            document.getElementById('btn-minigun').style.display = 'flex';
            document.getElementById('btn-flamethrower').style.display = 'flex';
        }
        
        if (selectedTowerInstance) showUpgradePanel();
    }

    function buildWaveQueue(wNum) {
        let queue = [];
        let HP_Mult = 1.0;
        if (gameMode === 'medium') HP_Mult = 1.8;
        if (gameMode === 'hard') HP_Mult = 3.2; 

        if (wNum === 10) {
            for(let i = 0; i < 11; i++) {
                queue.push({type: 'speedy', hp: (12 + wNum * 4) * HP_Mult, speed: 2.5, size: 8, shield: 0.35});
            }
            queue.push({type: 'necromancer', hp: 350 * HP_Mult, speed: 0.8, size: 15, shield: 0.0});
            queue.push({type: 'necromancer', hp: 350 * HP_Mult, speed: 0.8, size: 15, shield: 0.0});
            return queue;
        }

        if (wNum >= 1 && wNum <= 9) {
            let count = 4 + wNum * 2;
            for(let i=0; i<count; i++) queue.push({type: 'basic', hp: (16 + wNum * 6)*HP_Mult, speed: 1.2, size: 10, shield: 0.0});
        }
        if (wNum === 4) {
            for(let i=0; i<6; i++) queue.push({type: 'speedy', hp: (12 + wNum * 4)*HP_Mult, speed: 2.5, size: 8, shield: 0.0});
        }
        if (wNum >= 11 && wNum <= 12) {
            for(let i=0; i<8; i++) queue.push({type: 'rusher', hp: (20 + wNum * 5)*HP_Mult, speed: 2.1, size: 9, shield: 0.25});
        }
        if (wNum >= 13 && wNum <= 20) {
            let count = (wNum - 12) * 2;
            for(let i=0; i<count; i++) queue.push({type: 'tanky', hp: (180 + wNum * 20)*HP_Mult, speed: 0.7, size: 16, shield: 0.0});
        }
        if (wNum === 20) {
            queue.push({type: 'final_boss', hp: 4500*HP_Mult, speed: 0.5, size: 24, shield: 0.0});
        }

        if (queue.length === 0) {
            let count = 10 + wNum;
            for(let i=0; i<count; i++) queue.push({type: 'basic', hp: (50 + wNum * 15)*HP_Mult, speed: 1.4, size: 11, shield: 0.0});
        }
        return queue;
    }

    function startNextWave() {
        if (waveInProgress || isGameOver) return;
        wave++;
        waveInProgress = true;
        
        activeSpawnQueue = buildWaveQueue(wave);
        totalCreepsToSpawn = activeSpawnQueue.length;
        currentSpawnedCount = 0;
        updateUI();
        towers.spawnTicker = 0;
    }

    function findTrackCoordinateForSpike(tower) {
        for (let attempt = 0; attempt < 100; attempt++) {
            let randAngle = Math.random() * Math.PI * 2;
            let randRadius = Math.random() * tower.range;
            let targetX = tower.x + Math.cos(randAngle) * randRadius;
            let targetY = tower.y + Math.sin(randAngle) * randRadius;
            if (isCloseToPath(targetX, targetY, 15)) return { x: targetX, y: targetY };
        }
        return null;
    }

    function getPositionOnTrackBackward(dist) {
        let totalLen = 0; let segments = [];
        for (let i = path.length - 1; i > 0; i--) {
            let d = Math.hypot(path[i].x - path[i-1].x, path[i].y - path[i-1].y);
            segments.push({ p1: path[i], p2: path[i-1], length: d });
            totalLen += d;
        }
        if (dist >= totalLen) return { x: path[0].x, y: path[0].y };
        let accumulated = 0;
        for (let seg of segments) {
            if (accumulated + seg.length >= dist) {
                let rem = dist - accumulated; let ratio = rem / seg.length;
                return { x: seg.p1.x + (seg.p2.x - seg.p1.x) * ratio, y: seg.p1.y + (seg.p2.y - seg.p1.y) * ratio };
            }
            accumulated += seg.length;
        }
        return { x: path[path.length-1].x, y: path[path.length-1].y };
    }

    function damageEnemy(enemy, rawAmount) {
        let reduction = enemy.shield || 0.0;
        let finalDamage = rawAmount * (1.0 - reduction);
        enemy.hp -= finalDamage;
    }

    function singleSimulationTick() {
        if (isGameOver) return;

        if (doubleDamageTimer > 0) {
            doubleDamageTimer--;
            document.getElementById('buff-damage-timer').style.display = 'block';
            document.getElementById('buff-time-left').innerText = Math.ceil(doubleDamageTimer / 30);
            if (doubleDamageTimer <= 0) {
                globalDamageMultiplier = 1.0;
                document.getElementById('buff-damage-timer').style.display = 'none';
            }
        }

        if (waveInProgress && activeSpawnQueue.length > 0) {
            if (!towers.spawnTicker) towers.spawnTicker = 0;
            towers.spawnTicker++;
            let cadence = (gameMode === 'normal') ? 15 : 10; 
            
            if (towers.spawnTicker >= cadence) {
                towers.spawnTicker = 0;
                let template = activeSpawnQueue.shift();
                enemies.push({
                    type: template.type, x: path[0].x, y: path[0].y, hp: template.hp, maxHp: template.hp,
                    speed: template.speed, currentNode: 0, trappedTimer: 0, fireTimer: 0, fireDamage: 0,
                    distanceTraveled: 0, size: template.size, necroCD: 0, shield: template.shield || 0.0
                });
                currentSpawnedCount++;
            }
        }

        towers.forEach(t => {
            if (t.cooldown > 0) t.cooldown--;

            if (t.type === 'spike' && t.cooldown <= 0) {
                let spawnCount = (t.pathA >= 3) ? 2 : 1;
                let baseCD = (t.pathA === 1) ? 90 : (t.pathA === 2) ? 70 : (t.pathA === 4) ? 25 : 130;
                for (let c = 0; c < spawnCount; c++) {
                    let coord = findTrackCoordinateForSpike(t);
                    if (coord) {
                        let hp = (t.pathB === 1) ? 5 : (t.pathB === 2) ? 8 : (t.pathB >= 3) ? 15 : 3;
                        spikes.push({
                            x: coord.x, y: coord.y, hp: hp, maxHp: hp,
                            damage: ((t.pathB >= 2) ? 4 : 1),
                            mogul: (t.pathB >= 3), deathStorm: (t.pathB === 4), duration: (t.pathA >= 2) ? 900 : 500
                        });
                    }
                }
                t.cooldown = baseCD;
            }

            if (t.type === 'sniper' && t.cooldown <= 0 && enemies.length > 0) {
                enemies.sort((a, b) => b.hp - a.hp);
                let target = enemies[0];
                let baseDmg = (t.pathB === 1) ? 25 : (t.pathB === 2) ? 65 : (t.pathB === 3) ? 120 : (t.pathB === 4) ? 600 : 10;
                let cdRate = (t.pathA === 1) ? 45 : (t.pathA === 2) ? 35 : (t.pathA === 3) ? 12 : (t.pathA === 4) ? 3 : 75;

                damageEnemy(target, baseDmg * globalDamageMultiplier);
                if (t.pathB >= 3) target.trappedTimer = 45; 
                projectiles.push({ type: 'laser', x1: t.x, y1: t.y, x2: target.x, y2: target.y, life: 6 });
                t.cooldown = cdRate;
            }

            if (t.type === 'slime' && t.cooldown <= 0) {
                if (friendlySlimes.filter(s => s.parentID === t.id).length < 4) {
                    let hp = (t.pathB === 1) ? 60 : (t.pathB === 2) ? 120 : (t.pathB === 3) ? 250 : (t.pathB === 4) ? 700 : 35;
                    friendlySlimes.push({
                        parentID: t.id, x: path[path.length - 1].x, y: path[path.length - 1].y,
                        distanceWalked: 0, hp: hp, maxHp: hp, spitCooldown: 0, pathA: t.pathA, pathB: t.pathB
                    });
                }
                t.cooldown = 160;
            }

            if (t.type === 'minigun') {
                let actualRange = t.pathA === 3 ? t.range + 60 : t.range;
                let inRangeEnemies = enemies.filter(e => Math.hypot(e.x - t.x, e.y - t.y) < actualRange);
                
                if (inRangeEnemies.length > 0) {
                    if (t.cooldown <= 0) {
                        inRangeEnemies.sort((a,b) => b.distanceTraveled - a.distanceTraveled);
                        let target = inRangeEnemies[0];
                        let dmg = (t.pathB === 1) ? 3 : (t.pathB === 2) ? 5 : (t.pathB === 3) ? 10 : (t.pathB === 4) ? 22 : 1;
                        damageEnemy(target, dmg * globalDamageMultiplier);
                        
                        if (t.pathB >= 3 && Math.random() < 0.15) target.trappedTimer = 10; 
                        projectiles.push({ type: 'bullet', x1: t.x, y1: t.y, x2: target.x, y2: target.y, life: 3 });
                        
                        if (t.pathA === 4) { 
                            let secondary = inRangeEnemies[1] || target;
                            damageEnemy(secondary, dmg * globalDamageMultiplier);
                            projectiles.push({ type: 'bullet', x1: t.x, y1: t.y, x2: secondary.x, y2: secondary.y, life: 3 });
                        }
                        t.minigunInterval = Math.max((t.pathA === 4 ? 2 : t.pathA === 2 ? 4 : 6), t.minigunInterval - 2);
                        t.cooldown = t.minigunInterval;
                    }
                } else {
                    t.minigunInterval = Math.min(30, t.minigunInterval + 1);
                }
            }

            if (t.type === 'flamethrower') {
                let actualRange = t.pathA >= 1 ? t.range + 30 : t.range;
                if (t.cooldown <= 0) {
                    let targets = enemies.filter(e => Math.hypot(e.x - t.x, e.y - t.y) < actualRange);
                    if (targets.length > 0) {
                        targets.forEach(e => {
                            let duration = (t.pathA >= 2) ? 300 : 120;
                            let baseDmgTick = (t.pathB === 1) ? 0.3 : (t.pathB === 2) ? 0.6 : (t.pathB === 3) ? 1.5 : (t.pathB === 4) ? 4.0 : 0.15;
                            e.fireTimer = duration;
                            e.fireDamage = baseDmgTick * globalDamageMultiplier;
                            if (t.pathA >= 3) e.trappedTimer = 4; 
                        });
                        projectiles.push({ type: 'fire_blast', x: t.x, y: t.y, r: actualRange, life: 8 });
                        t.cooldown = (t.pathB === 2) ? 12 : 24; 
                    }
                }
            }
        });

        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i];
            if (e.fireTimer > 0) {
                damageEnemy(e, e.fireDamage); e.fireTimer--;
                if (e.pathB === 3 && e.fireTimer % 20 === 0) { 
                    projectiles.push({ type: 'aoe', x: e.x, y: e.y, r: 30, life: 6 });
                    enemies.forEach(other => { if (Math.hypot(other.x - e.x, other.y - e.y) < 35) damageEnemy(other, 8 * globalDamageMultiplier); });
                }
            }

            if (e.type === 'necromancer') {
                e.necroCD++;
                if (e.necroCD % 140 === 0) {
                    let HP_Mult = (gameMode === 'medium') ? 1.8 : (gameMode === 'hard') ? 3.2 : 1.0;
                    if (gameMode === 'hard') {
                        activeSpawnQueue.unshift({ type: 'rusher', hp: 45 * HP_Mult, speed: 2.1, size: 9, shield: 0.25 });
                        activeSpawnQueue.unshift({ type: 'rusher', hp: 45 * HP_Mult, speed: 2.1, size: 9, shield: 0.25 });
                    } else {
                        activeSpawnQueue.unshift({ type: 'basic', hp: 40 * HP_Mult, speed: 1.5, size: 8, shield: 0.0 });
                        activeSpawnQueue.unshift({ type: 'basic', hp: 40 * HP_Mult, speed: 1.5, size: 8, shield: 0.0 });
                    }
                    currentSpawnedCount -= 2; 
                }
            }

            if (e.trappedTimer > 0) {
                e.trappedTimer--;
            } else {
                let targetNode = path[e.currentNode + 1];
                let angle = Math.atan2(targetNode.y - e.y, targetNode.x - e.x);
                e.x += Math.cos(angle) * e.speed; e.y += Math.sin(angle) * e.speed;
                e.distanceTraveled += e.speed;

                if (Math.hypot(targetNode.x - e.x, targetNode.y - e.y) < 5) {
                    e.currentNode++;
                    if (e.currentNode >= path.length - 1) {
                        lives -= (e.type === 'final_boss' ? 20 : e.type === 'tanky' ? 3 : 1);
                        enemies.splice(i, 1);
                        updateUI();
                    }
                }
            }
        }

        for (let i = spikes.length - 1; i >= 0; i--) {
            let s = spikes[i]; s.duration--;
            if (s.duration <= 0) { spikes.splice(i, 1); continue; }

            for (let j = enemies.length - 1; j >= 0; j--) {
                let e = enemies[j];
                if (Math.hypot(e.x - s.x, e.y - s.y) < e.size + 10) {
                    if (s.hp > 0 && e.hp > 0) {
                        damageEnemy(e, s.damage * globalDamageMultiplier); s.hp--;
                        e.trappedTimer = s.mogul ? 45 : 15;
                        if (s.hp <= 0 && s.deathStorm) {
                            projectiles.push({type: 'aoe', x: s.x, y: s.y, r: 40, life: 10});
                            enemies.forEach(subE => { if (Math.hypot(subE.x - s.x, subE.y - s.y) < 50) damageEnemy(subE, 40 * globalDamageMultiplier); });
                        }
                    }
                }
            }
            if (s.hp <= 0) spikes.splice(i, 1);
        }

        for (let i = friendlySlimes.length - 1; i >= 0; i--) {
            let s = friendlySlimes[i]; s.distanceWalked += 0.7; 
            let pos = getPositionOnTrackBackward(s.distanceWalked);
            s.x = pos.x; s.y = pos.y;

            if (s.pathA >= 2) {
                if (s.spitCooldown > 0) s.spitCooldown--;
                if (s.spitCooldown <= 0 && enemies.length > 0) {
                    for (let e of enemies) {
                        if (Math.hypot(e.x - s.x, e.y - s.y) < 140) {
                            let spitDmg = (s.pathA === 2) ? 6 : (s.pathA === 3) ? 14 : 35;
                            projectiles.push({ type: 'spit', x: s.x, y: s.y, tx: e.x, ty: e.y, speed: 6, damage: spitDmg * globalDamageMultiplier, splash: (s.pathA === 4) });
                            s.spitCooldown = (s.pathA === 4) ? 25 : 55;
                            break;
                        }
                    }
                }
            }

            enemies.forEach(e => {
                if (Math.hypot(e.x - s.x, e.y - s.y) < e.size + 12) {
                    let factor = (s.pathB >= 2) ? 0.5 : 1.0;
                    s.hp -= 0.5 * factor; 
                    damageEnemy(e, ((s.pathB >= 3) ? 1.5 : 0.4) * globalDamageMultiplier);
                    e.trappedTimer = 2; 
                }
            });
            if (s.hp <= 0 || s.x <= path[0].x + 10) friendlySlimes.splice(i, 1);
        }

        for (let i = projectiles.length - 1; i >= 0; i--) {
            let p = projectiles[i];
            if (['laser', 'aoe', 'bullet', 'fire_blast'].includes(p.type)) {
                p.life--; if (p.life <= 0) projectiles.splice(i, 1);
            }
            if (p.type === 'spit') {
                let angle = Math.atan2(p.ty - p.y, p.tx - p.x);
                p.x += Math.cos(angle) * p.speed; p.y += Math.sin(angle) * p.speed;
                if (Math.hypot(p.tx - p.x, p.ty - p.y) < 8) {
                    enemies.forEach(e => {
                        if (Math.hypot(e.x - p.x, e.y - p.y) < 25) { damageEnemy(e, p.damage); if (p.splash) e.trappedTimer = 20; }
                    });
                    projectiles.splice(i, 1);
                }
            }
        }

        for (let i = enemies.length - 1; i >= 0; i--) {
            if (enemies[i].hp <= 0) {
                let prize = 6 + Math.floor(wave * 0.4); 
                if (enemies[i].type === 'final_boss') prize = 800;
                if (enemies[i].type === 'necromancer') prize = 75;
                if (enemies[i].type === 'rusher') prize = 14;
                money += prize;
                
                if (enemies[i].type === 'final_boss') {
                    if (gameMode === 'normal') triggerMediumModeUnlock();
                    else if (gameMode === 'medium') triggerHardModeUnlock();
                }
                enemies.splice(i, 1);
                updateUI();
            }
        }

        if (waveInProgress && enemies.length === 0 && activeSpawnQueue.length === 0 && currentSpawnedCount >= totalCreepsToSpawn) {
            waveInProgress = false; 
            money += 60 + wave * 6; 
            
            if (wave === 20) {
                if (gameMode === 'normal' && !mediumModeUnlocked) triggerMediumModeUnlock();
                else if (gameMode === 'medium' && !hardModeUnlocked) triggerHardModeUnlock();
                else if (gameMode === 'hard') {
                    alert("👑 ABSOLUTE CONQUEST! You have cleared Hard Critical Engagement Mode!");
                }
            }
            updateUI();
            if (isAutoStart && lives > 0) startNextWave();
        }

        if (lives <= 0) {
            isGameOver = true;
            selectedTowerInstance = null;
            hideUpgradePanel();
            document.getElementById('game-over-overlay').style.display = 'flex';
            updateUI();
        }
    }

    function restartGame() {
        money = 500;
        lives = 20;
        wave = 0;
        waveInProgress = false;
        totalCreepsToSpawn = 0;
        currentSpawnedCount = 0;
        isGameOver = false;
        
        towers = [];
        enemies = [];
        projectiles = [];
        spikes = [];
        friendlySlimes = [];
        
        selectedTowerType = null;
        selectedTowerInstance = null;
        clearShopSelection();
        hideUpgradePanel();

        globalDamageMultiplier = 1.0;
        doubleDamageTimer = 0;
        document.getElementById('buff-damage-timer').style.display = 'none';
        document.getElementById('game-over-overlay').style.display = 'none';
        
        updateUI();
    }

    function triggerMediumModeUnlock() {
        mediumModeUnlocked = true; gameMode = 'medium'; wave = 0; money += 500; 
        document.getElementById('game-title').innerHTML = "Tactical Defense Grid <span>MEDIUM SECTOR OVERDRIVE ACTIVE</span>";
        alert("🎉 VICTORY! Normal Engine Cleared!\\n\\nYou have unlocked the Mini-Gun Turret & Flamethrower!\\nWelcome to Medium Mode: Enemy units have scaled up by 1.8x health multipliers!");
    }

    function triggerHardModeUnlock() {
        hardModeUnlocked = true; gameMode = 'hard'; wave = 0; money += 600;
        const titleEl = document.getElementById('game-title');
        titleEl.innerHTML = "Tactical Defense Grid <span style='background:rgba(239,68,68,0.25);border-color:#ff3366;color:#ff3366;text-shadow:0 0 10px rgba(239,68,68,0.5);'>⚠️ HARD MODE ENGAGED</span>";
        alert("💀 COGNITIVE HAZARD UNLOCKED!\\n\\nMedium Sector Cleared. Entering Hard Mode.\\nEnemy profiles have scaled to a massive 3.2x health baseline. Necromancers summon Rushers now.");
    }

    function update() {
        for (let i = 0; i < gameSpeed; i++) { singleSimulationTick(); }
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#0a0d14'; ctx.lineWidth = 44; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath(); path.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); }); ctx.stroke();
        ctx.strokeStyle = '#141a29'; ctx.lineWidth = 36; ctx.stroke();
        ctx.strokeStyle = 'rgba(0, 243, 255, 0.15)'; ctx.lineWidth = 2; ctx.stroke();

        spikes.forEach(s => {
            ctx.fillStyle = s.mogul ? varProp('--cyber-orange') : (s.damage > 1) ? varProp('--cyber-red') : '#cbd5e1';
            ctx.shadowBlur = 4; ctx.shadowColor = ctx.fillStyle;
            ctx.beginPath(); ctx.arc(s.x, s.y, 6, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
        });

        friendlySlimes.forEach(s => {
            ctx.fillStyle = s.parentID === 'tactical_reinforcement' ? varProp('--cyber-orange') : s.pathB >= 3 ? varProp('--cyber-purple') : s.pathA >= 2 ? '#10b981' : varProp('--cyber-green');
            ctx.shadowBlur = 6; ctx.shadowColor = ctx.fillStyle;
            let r = s.parentID === 'tactical_reinforcement' ? 12 : s.pathB === 3 ? 14 : 9;
            ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
        });

        enemies.forEach(e => {
            if (e.type === 'final_boss') ctx.fillStyle = '#ef4444';
            else if (e.type === 'tanky' || e.type === 'necromancer') ctx.fillStyle = varProp('--cyber-purple');
            else if (e.type === 'speedy') ctx.fillStyle = '#fbbf24';
            else if (e.type === 'rusher') ctx.fillStyle = '#eab308'; 
            else ctx.fillStyle = '#f87171';

            ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI*2); ctx.fill();

            if (e.shield > 0) {
                ctx.strokeStyle = 'rgba(57, 255, 20, 0.6)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(e.x, e.y, e.size + 4, 0, Math.PI * 2);
                ctx.stroke();
            }

            if (e.fireTimer > 0) {
                ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
                ctx.beginPath(); ctx.arc(e.x, e.y, e.size + 4, 0, Math.PI*2); ctx.fill();
            }
            if (e.trappedTimer > 0) {
                ctx.strokeStyle = varProp('--cyber-cyan'); ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(e.x, e.y, e.size + 2, 0, Math.PI*2); ctx.stroke();
            }
        });

        towers.forEach(t => {
            if (selectedTowerInstance && selectedTowerInstance.id === t.id) {
                ctx.strokeStyle = 'rgba(0, 243, 255, 0.3)'; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.arc(t.x, t.y, t.type==='minigun' && t.pathA===3 ? t.range+60 : t.range===9999 ? 150 : t.range, 0, Math.PI*2); ctx.stroke();
            }
            
            ctx.fillStyle = '#212936';
            ctx.fillRect(t.x - 16, t.y - 16, 32, 32);
            ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.strokeRect(t.x - 16, t.y - 16, 32, 32);

            if (t.type === 'minigun') {
                ctx.fillStyle = '#fbbf24'; ctx.fillRect(t.x-4, t.y-14, 8, 12);
            } else if (t.type === 'flamethrower') {
                ctx.fillStyle = '#ef4444'; ctx.beginPath(); ctx.arc(t.x, t.y, 8, 0, Math.PI*2); ctx.fill();
            } else if (t.type === 'spike') {
                ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.arc(t.x, t.y, 9, 0, Math.PI*2); ctx.fill();
            } else if (t.type === 'sniper') {
                ctx.fillStyle = '#38bdf8'; ctx.fillRect(t.x - 5, t.y - 12, 10, 24);
            } else if (t.type === 'slime') {
                ctx.fillStyle = '#34d399'; ctx.beginPath(); ctx.arc(t.x, t.y - 2, 7, 0, Math.PI*2); ctx.fill();
            }
        });

        projectiles.forEach(p => {
            if (p.type === 'laser') {
                ctx.strokeStyle = 'rgba(0, 243, 255, ' + (p.life / 6) + ')'; ctx.lineWidth = p.life / 2;
                ctx.beginPath(); ctx.moveTo(p.x1, p.y1); ctx.lineTo(p.x2, p.y2); ctx.stroke();
            }
            if (p.type === 'bullet') {
                ctx.strokeStyle = 'rgba(251, 191, 36, 0.8)'; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.moveTo(p.x1, p.y1); ctx.lineTo(p.x2, p.y2); ctx.stroke();
            }
            if (p.type === 'fire_blast') {
                ctx.fillStyle = 'rgba(239, 68, 68, ' + (p.life / 20) + ')';
                ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
            }
            if (p.type === 'spit') {
                ctx.fillStyle = '#34d399'; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, Math.PI*2); ctx.fill();
            }
            if (p.type === 'aoe') {
                ctx.fillStyle = 'rgba(245, 158, 11, ' + (p.life / 10) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
            }
        });
    }

    function varProp(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
    function loop() { update(); draw(); requestAnimationFrame(loop); }
    updateUI();
    loop();
</script>
</body>
</html>`;

  return (
    <div className="flex-1 w-full bg-[#07080c] text-zinc-150 p-4 md:p-6 flex flex-col relative min-h-[92vh] z-10 selection:bg-cyan-500/20">
      {/* Immersive Tech Grid Background */}
      <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(0,243,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,243,255,0.1)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none z-0" />

      {/* Cyberpunk Tech Header */}
      <div className="w-full max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-800/80 pb-4 mb-6 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-xs font-mono font-bold text-zinc-400 hover:text-cyan-400 bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-xl transition-all cursor-pointer hover:border-cyan-500/40 hover:shadow-[0_0_15px_rgba(0,243,255,0.1)] active:scale-95 uppercase"
          >
            <ArrowLeft size={14} />
            <span>Return to Hub</span>
          </button>
          
          <div className="h-6 w-[1px] bg-zinc-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <Gamepad2 className="text-cyan-400 animate-pulse" size={20} />
            <h2 className="text-sm font-mono text-white font-extrabold tracking-widest uppercase">
              Retro Arcade Module
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-950/20 border border-cyan-500/30 rounded-lg text-cyan-400 font-mono text-[10px] tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            Active Matrix Sandbox
          </div>
          <div className="text-[10px] font-mono text-zinc-500 hidden md:block">
            STABILIZED VERSION 2.05A
          </div>
        </div>
      </div>

      {/* Game Stage Wrapper */}
      <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3 sm:p-5 shadow-2xl relative overflow-hidden backdrop-blur-sm z-10 min-h-[660px]">
        {/* Scanning scanlines effect overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[size:100%_4px] pointer-events-none z-20" />
        
        {/* Iframe Hosting the Game Sandbox */}
        <iframe
          srcDoc={gameHtml}
          title="Tactical Grid: Overdrive Engine"
          className="w-full flex-1 border-0 rounded-xl bg-[#07080c] shadow-[inset_0_0_20px_rgba(0,0,0,0.9)] min-h-[620px] z-10"
          sandbox="allow-scripts"
        />
      </div>

      {/* Instruction Card below the Game */}
      <div className="w-full max-w-6xl mx-auto mt-6 bg-zinc-900/20 border border-zinc-800/40 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-zinc-400 font-mono text-xs z-10">
        <div className="flex gap-2.5 items-start">
          <Info className="text-cyan-500 shrink-0 mt-0.5" size={16} />
          <div>
            <span className="text-zinc-200 font-bold uppercase block mb-1">
              Tactical Grid: Overdrive Engine Manual
            </span>
            <span>
              Prevent enemy grid creeps from completing the track segment. Place Spike Factories, heavy Snipers, allied Slime Dispensers, rapid Mini-Guns, and sweeping Flamethrowers. Accumulate funds, upgrade matrix lines, and toggle speed/auto-start loops.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
