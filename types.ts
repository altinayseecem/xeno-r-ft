
export type Point = { x: number; y: number };

export enum GameState {
  MENU,
  PLAYING,
  SHOP,
  GAME_OVER,
  VICTORY,
}

export type PlayerStats = {
  maxHp: number;
  hp: number;
  damage: number;
  attackSpeed: number; // Cooldown in frames
  speed: number;
  armor: number;
  gold: number;
  hasReviveItem: boolean; // "Immortality Sword"
  usedRevive: boolean; // To ensure it can't be bought/used again if strictly one-time per game or just consumed
};

export type Player = {
  id: 1 | 2;
  pos: Point;
  width: number;
  height: number;
  color: string;
  stats: PlayerStats;
  cooldown: number; // Current cooldown frames
  isDead: boolean;
  damageDealtThisRound: number;
  direction: 'left' | 'right';
  lastMoveDir: Point;
  invincibility: number;
  dashCooldown: number;
};

export type BossType = 'SLIME' | 'GOLEM' | 'WIZARD' | 'ROGUE' | 'DEMON_KING';

export type Boss = {
  type: BossType;
  name: string;
  pos: Point;
  width: number;
  height: number;
  maxHp: number;
  hp: number;
  color: string;
  speed: number;
  phase: number;
  cooldown: number;
  attackPattern: number; // Used for timers/phases
};

export type Projectile = {
  id: number;
  ownerId?: 1 | 2;
  pos: Point;
  velocity: Point;
  radius: number;
  damage: number;
  color: string;
  isHostile: boolean; // true = hurts players, false = hurts boss
  lifetime: number;
};

export type FloatingText = {
  id: number;
  text: string;
  pos: Point;
  color: string;
  lifetime: number;
  velocity: Point;
};
