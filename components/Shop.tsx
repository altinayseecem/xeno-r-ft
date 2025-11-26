import React from 'react';
import { ShoppingCart, Shield, Sword, Zap, Heart, Footprints, Skull } from 'lucide-react';
import { Player, PlayerStats } from '../types';
import { SHOP_ITEMS } from '../constants';

interface ShopProps {
  players: Player[];
  onClose: () => void;
  onBuy: (playerId: 1 | 2, itemId: string, cost: number, itemType: string, value: number) => void;
  level: number;
}

const Shop: React.FC<ShopProps> = ({ players, onClose, onBuy, level }) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'heal': return <Heart className="w-6 h-6 text-red-500" />;
      case 'dmg': return <Sword className="w-6 h-6 text-blue-500" />;
      case 'spd': return <Zap className="w-6 h-6 text-yellow-500" />;
      case 'mov': return <Footprints className="w-6 h-6 text-green-500" />;
      case 'arm': return <Shield className="w-6 h-6 text-slate-500" />;
      case 'revive': return <Skull className="w-6 h-6 text-purple-500" />;
      default: return <ShoppingCart className="w-6 h-6" />;
    }
  };

  return (
    <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center text-white p-8">
      <h2 className="text-4xl text-yellow-400 mb-2 font-bold uppercase tracking-widest">Merchant</h2>
      <p className="mb-8 text-gray-400">Prepare for Level {level + 1}...</p>

      <div className="grid grid-cols-2 gap-12 w-full max-w-6xl">
        {players.map((player) => (
          <div key={player.id} className={`bg-gray-800 border-4 rounded-lg p-6 flex flex-col ${player.id === 1 ? 'border-cyan-500' : 'border-lime-500'}`}>
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
              <h3 className={`text-2xl font-bold ${player.id === 1 ? 'text-cyan-400' : 'text-lime-400'}`}>Player {player.id}</h3>
              <div className="flex items-center gap-2 text-yellow-400">
                <span className="text-xl font-mono">{player.stats.gold} G</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 overflow-y-auto">
              {SHOP_ITEMS.map((item) => {
                const canAfford = player.stats.gold >= item.cost;
                const isRevive = item.id === 'revive';
                const alreadyHasRevive = isRevive && (player.stats.hasReviveItem || player.stats.usedRevive);
                
                return (
                  <button
                    key={item.id}
                    disabled={!canAfford || alreadyHasRevive}
                    onClick={() => onBuy(player.id, item.id, item.cost, item.type, item.value)}
                    className={`flex flex-col gap-2 p-3 rounded border-2 transition-all text-left group relative
                      ${!canAfford || alreadyHasRevive 
                        ? 'opacity-40 cursor-not-allowed border-gray-700 bg-gray-900' 
                        : 'hover:bg-gray-700 border-gray-600 hover:border-white cursor-pointer bg-gray-800'
                      }`}
                  >
                    <div className="flex justify-between w-full">
                      <div className="flex items-center gap-2">
                        {getIcon(item.id)}
                        <span className="font-bold">{item.name}</span>
                      </div>
                      <span className="text-yellow-400 text-sm">{item.cost}G</span>
                    </div>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                    {alreadyHasRevive && <span className="absolute inset-0 flex items-center justify-center bg-black/60 text-red-500 font-bold rotate-12">SOLD OUT</span>}
                  </button>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-700 grid grid-cols-3 gap-2 text-xs text-gray-300">
                <div>HP: {player.stats.hp}/{player.stats.maxHp}</div>
                <div>DMG: {player.stats.damage}</div>
                <div>SPD: {Math.floor(60/player.stats.attackSpeed * 10) / 10}/s</div>
                <div>DEF: {player.stats.armor}</div>
                <div>MOVE: {player.stats.speed}</div>
                <div className={player.stats.hasReviveItem ? "text-purple-400" : "text-gray-600"}>
                  REVIVE: {player.stats.hasReviveItem ? "YES" : "NO"}
                </div>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={onClose}
        className="mt-12 px-12 py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded text-xl shadow-lg border-b-4 border-green-800 active:border-b-0 active:translate-y-1 transition-all"
      >
        NEXT BATTLE
      </button>
    </div>
  );
};

export default Shop;
