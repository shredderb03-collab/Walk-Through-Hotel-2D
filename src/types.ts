/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 'START' | 'PLAYING' | 'GAMEOVER' | 'VICTORY';

export type ItemType = 'bandage' | 'crucifix' | 'radio' | 'flashlight' | 'cola' | 'lockpick' | 'ipad' | 'luck_potion';

export interface InventoryItem {
  id: string;
  type: ItemType;
  label: string;
  description: string;
}

export interface GameStats {
  doorsOpened: number;
  timesHidden: number;
  puzzlesSolved: number;
  timeStarted: number;
  timeEnded: number;
  diedTo: string;
  coins: number;
}

export interface FuseWire {
  id: string;
  color: string;
  startId: string; // Left socket ID
  endId: string | null; // Right socket ID (null if not connected)
}

export interface FuseSocket {
  id: string;
  color: string;
  side: 'left' | 'right';
  x: number;
  y: number;
}

