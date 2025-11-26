import React from 'react';
import { Swords } from 'lucide-react';

interface MainMenuProps {
  onStart: () => void;
  message?: string;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart, message }) => {
  return (
    <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center z-50">
      <div className="mb-8 animate-pulse text-purple-500">
        <Swords size={120} />
      </div>
      <h1 className="text-6xl font-black text-white mb-4 tracking-tighter text-center">
        XENO<br/><span className="text-purple-500">RIFT</span>
      </h1>
      {message && <p className="text-yellow-400 mb-8 text-xl text-center max-w-md">{message}</p>}
      
      <div className="grid grid-cols-2 gap-12 text-gray-400 mb-12 border border-gray-700 p-8 rounded-xl bg-gray-800/50">
        <div className="text-center">
          <h3 className="text-cyan-400 font-bold mb-4 text-xl">PLAYER 1</h3>
          <p>WASD to Move</p>
          <p>SPACE to Attack</p>
        </div>
        <div className="text-center">
          <h3 className="text-orange-400 font-bold mb-4 text-xl">PLAYER 2</h3>
          <p>ARROWS to Move</p>
          <p>ENTER to Attack</p>
        </div>
      </div>

      <button 
        onClick={onStart}
        className="px-8 py-4 bg-purple-600 text-white font-bold rounded-lg text-2xl hover:bg-purple-500 hover:scale-105 transition-all shadow-[0_0_20px_rgba(168,85,247,0.5)]"
      >
        ENTER THE RIFT
      </button>
    </div>
  );
};

export default MainMenu;