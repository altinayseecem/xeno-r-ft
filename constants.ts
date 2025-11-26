
import { Boss, BossType, PlayerStats } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const INITIAL_PLAYER_STATS: PlayerStats = {
  maxHp: 100,
  hp: 100,
  damage: 20, 
  attackSpeed: 30, // Frames between attacks (60fps)
  speed: 5,
  armor: 0,
  gold: 0,
  hasReviveItem: false,
  usedRevive: false,
};

export const BOSS_CONFIGS: Record<number, Partial<Boss>> = {
  1: { // Level 1
    type: 'SLIME' as BossType,
    name: "Giant Slime",
    maxHp: 300, 
    width: 80,
    height: 80,
    speed: 1.0, 
    color: '#a3e635', // Lime
  },
  2: { // Level 2
    type: 'GOLEM' as BossType,
    name: "Iron Golem",
    maxHp: 800,
    width: 90,
    height: 100,
    speed: 1.8,
    color: '#94a3b8', // Slate
  },
  3: { // Level 3
    type: 'WIZARD' as BossType,
    name: "Void Wizard",
    maxHp: 600,
    width: 60,
    height: 90,
    speed: 3,
    color: '#8b5cf6', // Violet
  },
  4: { // Level 4
    type: 'ROGUE' as BossType,
    name: "Shadow Assassin",
    maxHp: 700,
    width: 50,
    height: 50,
    speed: 6,
    color: '#f43f5e', // Rose
  },
  5: { // Level 5
    type: 'DEMON_KING' as BossType,
    name: "Demon Overlord",
    maxHp: 2000,
    width: 120,
    height: 140,
    speed: 2.5,
    color: '#dc2626', // Red
  },
};

export const SHOP_ITEMS = [
  { id: 'heal', name: 'Potion', cost: 50, desc: 'Heal 50 HP', stat: 'hp', value: 50, type: 'consumable' },
  { id: 'dmg', name: 'Plasma Blade', cost: 100, desc: '+5 Damage', stat: 'damage', value: 5, type: 'permanent' },
  { id: 'spd', name: 'Accelerator', cost: 120, desc: '+10% Fire Rate', stat: 'attackSpeed', value: -3, type: 'permanent' }, // Lower cooldown
  { id: 'mov', name: 'Thrusters', cost: 80, desc: '+1 Move Spd', stat: 'speed', value: 1, type: 'permanent' },
  { id: 'arm', name: 'Energy Shield', cost: 150, desc: '+2 Armor', stat: 'armor', value: 2, type: 'permanent' },
  { id: 'revive', name: 'Phoenix Chip', cost: 500, desc: 'Revive once on death', stat: 'revive', value: 1, type: 'unique' },
];

export const PLAYER_SPRITES = {
  P1: {
    IDLE: 'blue_idle.png',
    RUN: 'blue_run.png',
  },
  P2: {
    IDLE: 'red_idle.png',
    RUN: 'red_run.png',
  }
};
