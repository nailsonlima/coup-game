import React from 'react';
import { useGame } from '../context/GameContext';
import { User, Coins, Skull } from 'lucide-react';

const OpponentList = () => {
  const { gameState, roomCode, user } = useGame();
  const players = gameState.players || {};
  const playerIds = Object.keys(players).filter(id => id !== user.id);
  const currentTurn = gameState.turn;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900/50">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-500 text-xs font-mono">SALA: {roomCode}</span>
        <span className="text-gray-500 text-xs font-mono">OPONENTES ({playerIds.length})</span>
      </div>
      
      {playerIds.map(pid => {
        const p = players[pid];
        const isTurn = currentTurn === pid;
        const revealedCards = p.cards ? p.cards.filter(c => c.faceUp) : [];
        const hiddenCount = p.cards ? p.cards.filter(c => !c.faceUp).length : 0;

        return (
          <div 
            key={pid} 
            className={`relative p-3 rounded-xl border transition-all ${
              !p.isAlive ? 'bg-gray-800/50 border-gray-800 opacity-60 grayscale' :
              isTurn ? 'bg-gray-800 border-cyan-500 shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)]' : 'bg-gray-800 border-gray-700'
            }`}
          >
            <div className="flex justify-between items-center bg-transparent">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-full ${isTurn ? 'bg-cyan-500/10 text-cyan-400' : 'bg-gray-700 text-gray-400'}`}>
                    {p.isAlive ? <User size={20} /> : <Skull size={20} />}
                 </div>
                 <div>
                    <h3 className={`font-bold ${isTurn ? 'text-cyan-400' : 'text-gray-200'}`}>
                        {p.name} {isTurn && <span className="text-[10px] ml-2 text-cyan-500 animate-pulse">JOGANDO...</span>}
                    </h3>
                    <div className="flex gap-2 text-xs mt-1">
                        <span className="flex items-center text-yellow-500"><Coins size={12} className="mr-1"/> {p.coins}</span>
                        <span className="text-gray-400">{hiddenCount} Cartas Ocultas</span>
                    </div>
                 </div>
              </div>
            </div>

            {/* Revealed Cards */}
            {revealedCards.length > 0 && (
                <div className="mt-3 pt-2 border-t border-gray-700 flex gap-2">
                    {revealedCards.map((card, idx) => (
                        <span key={idx} className="px-2 py-1 bg-red-900/30 border border-red-500/50 text-red-200 text-xs rounded uppercase font-bold">
                            {card.name}
                        </span>
                    ))}
                </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default OpponentList;
