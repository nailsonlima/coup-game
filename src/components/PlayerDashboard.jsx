import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Eye, EyeOff, Coins, Sword, Shield, Repeat, Landmark, HandCoins } from 'lucide-react';

const ACTIONS = [
  { id: 'INCOME', label: 'Renda', icon: Coins, color: 'bg-green-600', cost: 0 },
  { id: 'FOREIGN_AID', label: 'Ajuda', icon: HandCoins, color: 'bg-green-600', cost: 0 },
  { id: 'TAX', label: 'Taxa', icon: Landmark, color: 'bg-purple-600', cost: 0 },
  { id: 'STEAL', label: 'Extorquir', icon: Sword, color: 'bg-yellow-600', cost: 0, target: true },
  { id: 'EXCHANGE', label: 'Trocar', icon: Repeat, color: 'bg-blue-600', cost: 0 },
  { id: 'INVESTIGATE', label: 'Investigar', icon: Eye, color: 'bg-blue-500', cost: 0, target: true }, // Added for Inquisitor
  { id: 'ASSASSINATE', label: 'Assassinar', icon: Sword, color: 'bg-red-600', cost: 3, target: true },
  { id: 'COUP', label: 'Golpe', icon: SkullIcon, color: 'bg-red-800', cost: 7, target: true },
];

function SkullIcon(props) {
    return <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="M12.5 17l-.5-4"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>
}

const PlayerDashboard = () => {
  const { gameState, user, performAction, loseLife, finalizeExchange, submitInvestigationCard, finalizeInvestigation } = useGame();
  const [peeking, setPeeking] = useState(false);
  const [targetAction, setTargetAction] = useState(null);
  const [selectedForExchange, setSelectedForExchange] = useState([]);

  const myself = gameState.players[user.id];
  const myCards = myself.cards || [];
  const isMyTurn = gameState.turn === user.id;

  const handleActionClick = (action) => {
    if (!isMyTurn) return;
    if (myself.coins < action.cost) {
      alert("Moedas insuficientes!");
      return;
    }

    if (action.target) {
      setTargetAction(action.id);
    } else {
      performAction(action.id);
    }
  };

  const handleTargetSelect = (targetId) => {
    performAction(targetAction, targetId);
    setTargetAction(null);
  };

  if (!myself.isAlive) {
    return (
        <div className="bg-gray-900 border-t border-gray-800 p-6 flex flex-col items-center justify-center text-gray-500 h-64">
            <SkullIcon className="w-12 h-12 mb-2 opacity-50" />
            <h2 className="text-xl font-bold">Você Morreu</h2>
            <p className="text-sm">Aguarde o próximo jogo...</p>
        </div>
    );
  }

  // Target Selection Overlay
  if (targetAction) {
    // Filter targets
    const targets = Object.values(gameState.players).filter(p => {
        if (p.id === user.id || !p.isAlive) return false;
        // STEAL CHECK: Must have at least 2 coins (per user request)
        if (targetAction === 'STEAL' && p.coins < 2) return false;
        return true;
    });
    const getActionLabel = (id) => ACTIONS.find(a => a.id === id)?.label || id;

    return (
      <div className="absolute inset-x-0 bottom-0 top-32 bg-gray-900/90 backdrop-blur-md p-6 z-50 flex flex-col animate-in slide-in-from-bottom">
        <h3 className="text-center text-white font-bold mb-4">SELECIONE O ALVO PARA {getActionLabel(targetAction).toUpperCase()}</h3>
        <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-20">
            {targets.map(t => (
                <button 
                    key={t.id}
                    onClick={() => handleTargetSelect(t.id)}
                    className="p-4 bg-gray-800 hover:bg-red-900/40 border border-gray-700 hover:border-red-500 rounded-xl text-left transition-all"
                >
                    <div className="font-bold text-gray-200">{t.name}</div>
                    <div className="text-sm text-yellow-500 flex items-center gap-1"><Coins size={12}/> {t.coins}</div>
                </button>
            ))}
        </div>
        <button 
            onClick={() => setTargetAction(null)}
            className="mt-auto w-full py-4 bg-gray-800 text-gray-400 font-bold rounded-xl"
        >
            CANCELAR
        </button>
      </div>
    );
  }

  // EXCHANGE UI
  if (gameState.turnPhase === 'PHASE_EXCHANGE' && isMyTurn) {
      const aliveCount = myCards.filter(c => !c.faceUp).length;
      // Note: myCards includes the 2 drawn cards now.
      // aliveCount will be (OriginalAlive + 2).
      // Logic: I had N alive. I drew 2 (Ambassador) or 1 (Inquisitor).
      // Now I have N+2 or N+1 alive. I must keep N.
      // So I must select N = aliveCount - drawnCount.
      
      const isInquisitor = gameState.settings?.useInquisitor;
      const drawnCount = isInquisitor ? 1 : 2;
      const cardsToKeepCount = aliveCount - drawnCount;
      
      const toggleSelection = (card) => {
          if (selectedForExchange.find(c => c.id === card.id)) {
              setSelectedForExchange(selectedForExchange.filter(c => c.id !== card.id));
          } else {
              if (selectedForExchange.length < cardsToKeepCount) {
                  setSelectedForExchange([...selectedForExchange, card]);
              }
          }
      };

      return (
        <div className="absolute inset-x-0 bottom-0 min-h-[50vh] bg-gray-900/95 backdrop-blur-md p-6 z-50 flex flex-col animate-in slide-in-from-bottom border-t border-cyan-500/30">
            <h3 className="text-center text-white font-bold mb-2">TROCA DE INFLUÊNCIAS</h3>
            <p className="text-center text-cyan-400 text-sm mb-6">
                Escolha <span className="font-bold text-white">{cardsToKeepCount}</span> cartas para ficar.
            </p>

            <div className="flex justify-center gap-4 mb-8 flex-wrap">
                {myCards.filter(c => !c.faceUp).map(card => {
                    const isSelected = selectedForExchange.find(c => c.id === card.id);
                    return (
                        <div 
                            key={card.id}
                            onClick={() => toggleSelection(card)}
                            className={`
                                w-24 h-36 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 flex flex-col items-center justify-center relative
                                ${isSelected ? 'border-cyan-400 bg-cyan-900/30 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 'border-gray-600 bg-gray-800 text-gray-400'}
                            `}
                        >
                            <span className="font-bold text-sm text-center px-1">{card.name}</span>
                            {isSelected && <div className="absolute top-2 right-2 w-4 h-4 bg-cyan-400 rounded-full shadow-lg" />}
                        </div>
                    )
                })}
            </div>

            <button 
                onClick={() => finalizeExchange(selectedForExchange)}
                disabled={selectedForExchange.length !== cardsToKeepCount}
                className="mt-auto w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg tracking-widest"
            >
                CONFIRMAR TROCA
            </button>
        </div>
      );
  }

  // INQUISITOR: VICTIM SELECTS CARD
  if (gameState.turnPhase === 'PHASE_INQUISITOR_VICTIM_SELECT' && gameState.penaltyVictimId === user.id) {
       return (
        <div className="absolute inset-x-0 bottom-0 top-32 bg-gray-900/90 backdrop-blur-md p-6 z-50 flex flex-col animate-in slide-in-from-bottom border-t border-blue-500/30">
            <h3 className="text-center text-white font-bold mb-2">INVESTIGAÇÃO!</h3>
            <p className="text-center text-blue-300 text-sm mb-6">
                O Inquisidor quer ver uma carta sua. Escolha qual mostrar:
            </p>
            <div className="flex justify-center gap-4 mb-8">
                {myCards.filter(c => !c.faceUp).map((card) => (
                    <div 
                        key={card.id}
                        onClick={() => { if(window.confirm(`Mostrar ${card.name} ao Inquisidor?`)) submitInvestigationCard(card.id); }}
                        className="w-24 h-36 bg-gray-800 border-2 border-gray-600 rounded-xl cursor-pointer hover:border-blue-500 transition-all flex flex-col items-center justify-center relative transform hover:scale-105"
                    >
                         <span className="text-gray-200 font-bold text-sm text-center px-1">{card.name}</span>
                         <span className="text-blue-500 text-[10px] mt-1">Clique p/ Revelar</span>
                    </div>
                ))}
            </div>
        </div>
       )
  }

  // INQUISITOR: DECISION (KEEP OR SWAP)
  if (gameState.turnPhase === 'PHASE_INQUISITOR_DECISION' && isMyTurn) {
      const card = gameState.investigatedCard;
      return (
        <div className="absolute inset-x-0 bottom-0 top-32 bg-gray-900/90 backdrop-blur-md p-6 z-50 flex flex-col animate-in slide-in-from-bottom border-t border-blue-500/30">
            <h3 className="text-center text-white font-bold mb-2">RESULTADO DA INVESTIGAÇÃO</h3>
            <p className="text-center text-gray-400 text-sm mb-4">
                A vítima mostrou esta carta:
            </p>
            
            <div className="flex justify-center mb-6">
                 <div className="w-32 h-48 bg-gray-800 border-2 border-blue-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                     <span className="text-xl font-bold text-white">{card?.name}</span>
                 </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={() => finalizeInvestigation('KEEP')}
                    className="py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl"
                >
                    DEVOLVER (MANTÉM)
                </button>
                <button 
                    onClick={() => finalizeInvestigation('SWAP')}
                    className="py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg border border-blue-400"
                >
                    FORÇAR TROCA
                </button>
            </div>
        </div>
      )
  }

  return (
    <div className="bg-gray-900 border-t border-gray-800 flex flex-col shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      {/* Stats & Cards */}
      <div className="flex justify-between items-center p-4 pb-2">
        <div className="flex items-center gap-2">
           <div className="bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
             <span className="text-2xl font-bold text-yellow-500 flex items-center gap-2">
                <Coins className="fill-yellow-500/20" /> {myself.coins}
             </span>
           </div>
        </div>
        
        {/* Cards */}
        <div 
            className="flex gap-2"
            onMouseDown={() => setPeeking(true)}
            onMouseUp={() => setPeeking(false)}
            onTouchStart={() => setPeeking(true)}
            onTouchEnd={() => setPeeking(false)}
        >
            {myCards.map((card, idx) => (
                <div 
                    key={idx} 
                    className={`
                        w-16 h-24 rounded-lg border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 relative overflow-hidden cursor-pointer select-none
                        ${card.faceUp ? 'bg-gray-800 border-gray-600 text-gray-500 grayscale' : 
                          peeking ? 'bg-gradient-to-br from-cyan-900 to-blue-900 border-cyan-400 text-cyan-100 shadow-[0_0_15px_rgba(34,211,238,0.5)]' : 
                          'bg-gray-800 border-gray-700 text-transparent hover:border-gray-500'}
                    `}
                >
                   {card.faceUp ? (
                       <div className="flex flex-col items-center">
                           <span className="text-[10px] uppercase">MORTA</span>
                           {card.name}
                       </div>
                   ) : peeking ? (
                       <span className="text-center px-1">{card.name}</span>
                   ) : (
                       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                   )}
                   
                   {/* Manual Lose Life Button (Small corner button) */}
                   {!card.faceUp && (
                       <button 
                        onClick={(e) => { e.stopPropagation(); if(window.confirm('Revelar esta carta? (Perder Vida)')) loseLife(idx); }}
                        className="absolute bottom-0 right-0 p-1 bg-red-900/50 hover:bg-red-600 text-white rounded-tl-lg"
                       >
                           <SkullIcon size={12} />
                       </button>
                   )}
                </div>
            ))}
        </div>
        {/* Hint */}
        {myCards.some(c => !c.faceUp) && (
            <div className="absolute bottom-24 right-4 text-[10px] text-gray-600 animate-pulse pointer-events-none">
                SEGURE P/ ESPIAR
            </div>
        )}
      </div>

      {/* Action Grid - STRICTLY HIDDEN DURING PENALTY OR IF NOT ACTIVE */}
      {(!isMyTurn || gameState.turnPhase !== 'PHASE_ACTION_SELECT') ? (
            <div className="p-4 text-center">
                {gameState.turnPhase === 'PHASE_PENALTY' && gameState.penaltyVictimId === user.id ? (
                    <div className="animate-pulse text-red-500 font-bold border-2 border-red-600 p-4 rounded-xl bg-red-900/20">
                        ⚠️ PUNIÇÃO: CLIQUE EM UMA CARTA PARA PERDER ⚠️
                    </div>
                ) : (
                    <div className="text-gray-600 text-xs uppercase tracking-widest">
                        {gameState.turnPhase === 'PHASE_PENALTY' ? 'RESOLVENDO PUNIÇÃO...' : 'AGUARDE SUA VEZ'}
                    </div>
                )}
            </div>
      ) : (
      <div className="grid grid-cols-4 gap-2 p-3 pb-6">
        {ACTIONS.filter(action => {
            if (action.id === 'INVESTIGATE') return gameState.settings?.useInquisitor;
            if (action.id === 'EXCHANGE') return true; // Always show exchange (Ambassador or Inquisitor version)
            return true; 
        }).map((action) => {
           const isCoup = action.id === 'COUP';
           const mustCoup = myself.coins >= 10;
           // Explicitly allow Coup if forced. Disable others.
           const disabled = !isMyTurn || (mustCoup && !isCoup);
           const opacity = disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 active:scale-95';
           
           // Dynamic Label for Exchange
           let label = action.label;
           if (action.id === 'EXCHANGE' && gameState.settings?.useInquisitor) label = 'Troca (Inq)';

           return (
            <button
                key={action.id}
                onClick={() => !disabled && handleActionClick(action)}
                disabled={disabled}
                className={`
                    flex flex-col items-center justify-center p-2 rounded-xl transition-all
                    ${isMyTurn && !disabled ? `${action.color} text-white shadow-lg` : 'bg-gray-800 text-gray-500'}
                    ${opacity}
                `}
            >
                <action.icon size={20} className="mb-1" />
                <span className="text-[10px] font-bold uppercase">{label}</span>
                {action.cost > 0 && <span className="text-[9px] opacity-80">-{action.cost}</span>}
            </button>
           );
        })}
      </div>
      )}
    </div>
  );
};

export default PlayerDashboard;
