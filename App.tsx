
import React, { useState, useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import Shop from './components/Shop';
import MainMenu from './components/MainMenu';
import { Player, Boss, GameState, PlayerStats, Projectile, FloatingText } from './types';
import { INITIAL_PLAYER_STATS, BOSS_CONFIGS, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [level, setLevel] = useState(1);
  const [boss, setBoss] = useState<Boss | null>(null);
  
  // React State for players (for HUD/Shop persistence)
  const [players, setPlayers] = useState<Player[]>([
    {
      id: 1,
      pos: { x: 100, y: 300 },
      width: 55, // Adjusted for bulky armor sprite
      height: 60,
      color: '#22d3ee', // Cyan
      stats: { ...INITIAL_PLAYER_STATS },
      cooldown: 0,
      isDead: false,
      damageDealtThisRound: 0,
      direction: 'right',
      lastMoveDir: { x: 1, y: 0 },
      invincibility: 0,
      dashCooldown: 0
    },
    {
      id: 2,
      pos: { x: 150, y: 300 },
      width: 55, // Adjusted for bulky armor sprite
      height: 60,
      color: '#ef4444', // Red
      stats: { ...INITIAL_PLAYER_STATS },
      cooldown: 0,
      isDead: false,
      damageDealtThisRound: 0,
      direction: 'right',
      lastMoveDir: { x: 1, y: 0 },
      invincibility: 0,
      dashCooldown: 0
    }
  ]);

  const [endMessage, setEndMessage] = useState('');

  const initLevel = (lvl: number) => {
    const config = BOSS_CONFIGS[lvl];
    if (!config) return;

    // Reset players for new round
    // - FULL HEAL (hp = maxHp)
    // - Reset Position
    // - Reset Cooldowns/Invincibility
    setPlayers(prev => prev.map((p, idx) => ({
      ...p,
      pos: { x: idx === 0 ? 100 : 150, y: CANVAS_HEIGHT / 2 },
      isDead: false,
      stats: {
        ...p.stats,
        hp: p.stats.maxHp // Full heal on new level
      },
      damageDealtThisRound: 0,
      invincibility: 60, // 1 sec invincibility on spawn
      dashCooldown: 0
    })));

    setBoss({
      type: config.type!,
      name: config.name!,
      pos: { x: CANVAS_WIDTH - 150, y: CANVAS_HEIGHT / 2 - (config.height || 100) / 2 },
      width: config.width!,
      height: config.height!,
      maxHp: config.maxHp!,
      hp: config.maxHp!,
      color: config.color!,
      speed: config.speed!,
      phase: 1,
      cooldown: 60,
      attackPattern: 0,
    });
    
    setGameState(GameState.PLAYING);
  };

  const startGame = () => {
    // Reset Everything
    setLevel(1);
    setPlayers(prev => prev.map(p => ({
      ...p,
      stats: { ...INITIAL_PLAYER_STATS, gold: 0, hasReviveItem: false, usedRevive: false }, // Full Reset
      isDead: false,
      damageDealtThisRound: 0,
      dashCooldown: 0
    })));
    initLevel(1);
  };

  const handleGameOver = (won: boolean, finalPlayers?: Player[]) => {
    if (won) {
      // Use the final player state passed from canvas to ensure we have the latest damageDealtThisRound
      const currentPlayers = finalPlayers || players;
      
      setPlayers(currentPlayers.map(p => {
        // EARNING SYSTEM
        const missionReward = 200; // Base completion reward
        const damageBonus = Math.floor(p.damageDealtThisRound * 0.5); // Performance reward
        const survivalBonus = p.isDead ? 0 : 150; // Survival reward
        
        const totalEarned = missionReward + damageBonus + survivalBonus;

        return {
          ...p,
          stats: {
            ...p.stats,
            gold: p.stats.gold + totalEarned
          }
        };
      }));

      setGameState(GameState.SHOP);
    } else {
      setEndMessage(`DEFEAT AT LEVEL ${level}`);
      setGameState(GameState.GAME_OVER);
    }
  };

  const handleNextLevel = () => {
    if (level >= 5) {
      setEndMessage("VICTORY! THE RIFT IS CLOSED.");
      setGameState(GameState.VICTORY);
    } else {
      setLevel(l => l + 1);
      initLevel(level + 1);
    }
  };

  const handleBuyItem = (playerId: 1 | 2, itemId: string, cost: number, itemType: string, value: number) => {
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      
      const newStats = { ...p.stats, gold: p.stats.gold - cost };
      
      if (itemType === 'consumable') {
        if (itemId === 'heal') newStats.hp = Math.min(newStats.maxHp, newStats.hp + value);
      } else if (itemType === 'permanent') {
        // @ts-ignore - dynamic key access
        newStats[itemId === 'spd' ? 'attackSpeed' : itemId === 'mov' ? 'speed' : itemId === 'arm' ? 'armor' : 'damage'] += value;
        // Clamp Attack Speed (lower is faster)
        if (itemId === 'spd' && newStats.attackSpeed < 5) newStats.attackSpeed = 5;
      } else if (itemType === 'unique') {
        if (itemId === 'revive') newStats.hasReviveItem = true;
      }

      return { ...p, stats: newStats };
    }));
  };

  const handleCanvasUpdate = (updatedPlayers: Player[], updatedBoss: Boss | null) => {
    setPlayers(updatedPlayers); 
    if (updatedBoss) setBoss(updatedBoss);
  };

  return (
    <div className="relative w-full h-screen bg-gray-950 flex flex-col items-center justify-center p-4">
      {/* HUD */}
      {gameState !== GameState.MENU && (
        <div className="absolute top-4 left-0 right-0 px-8 flex justify-between items-start pointer-events-none">
          {/* P1 HUD */}
          <div className="flex flex-col gap-1">
             <div className="text-cyan-400 font-bold text-2xl">P1</div>
             <div className="text-white text-sm">HP: {Math.floor(players[0].stats.hp)}/{players[0].stats.maxHp}</div>
             <div className="text-yellow-400 text-sm">CREDITS: {players[0].stats.gold}</div>
             <div className={players[0].dashCooldown <= 0 ? "text-green-400 text-sm font-bold" : "text-gray-500 text-sm"}>
                DASH: {players[0].dashCooldown <= 0 ? "READY [SHIFT]" : Math.ceil(players[0].dashCooldown / 60) + "s"}
             </div>
             {players[0].stats.hasReviveItem && <div className="text-purple-400 text-xs animate-pulse">IMMORTAL</div>}
          </div>

          <div className="text-center">
             <div className="text-gray-500 font-bold text-lg">LEVEL {level}</div>
             {boss && (
                 <div className="text-red-500 text-2xl font-black uppercase tracking-widest">{boss.name}</div>
             )}
          </div>

          {/* P2 HUD */}
          <div className="flex flex-col gap-1 text-right">
             <div className="text-red-500 font-bold text-2xl">P2</div>
             <div className="text-white text-sm">HP: {Math.floor(players[1].stats.hp)}/{players[1].stats.maxHp}</div>
             <div className="text-yellow-400 text-sm">CREDITS: {players[1].stats.gold}</div>
             <div className={players[1].dashCooldown <= 0 ? "text-green-400 text-sm font-bold" : "text-gray-500 text-sm"}>
                DASH: {players[1].dashCooldown <= 0 ? "READY [SHIFT]" : Math.ceil(players[1].dashCooldown / 60) + "s"}
             </div>
             {players[1].stats.hasReviveItem && <div className="text-purple-400 text-xs animate-pulse">IMMORTAL</div>}
          </div>
        </div>
      )}

      {/* Main Game Layer */}
      <GameCanvas 
        players={players} 
        boss={boss} 
        gameState={gameState} 
        onUpdate={handleCanvasUpdate}
        onGameOver={handleGameOver}
      />

      {/* Overlays */}
      {gameState === GameState.MENU && <MainMenu onStart={startGame} />}
      {gameState === GameState.GAME_OVER && <MainMenu onStart={startGame} message={endMessage} />}
      {gameState === GameState.VICTORY && <MainMenu onStart={startGame} message="VICTORY! THE RIFT IS CLOSED." />}
      {gameState === GameState.SHOP && (
        <Shop 
          players={players} 
          onClose={handleNextLevel} 
          onBuy={handleBuyItem}
          level={level}
        />
      )}
    </div>
  );
};

export default App;
