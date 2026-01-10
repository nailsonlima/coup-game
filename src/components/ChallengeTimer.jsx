import React from 'react';
import { useGame } from '../context/GameContext';
import { ShieldAlert, CheckCircle, XCircle, Shield } from 'lucide-react';

const ChallengeTimer = () => {
    const { gameState, user, contestAction, blockAction, acceptAction, acceptBlock } = useGame();
    const { currentAction, timer } = gameState;
    
    // Server-side timer handles logic now. 
    // We just visualize 'timer' from gameState.
    // Default max time is 15s (set in GameContext).
    
    if (!currentAction) return null;

    if (!currentAction) return null;

    const isMyAction = currentAction.playerId === user.id;
    const isMyTarget = currentAction.targetId === user.id;
    const isPending = currentAction.status === 'PENDING';
    const isBlocked = currentAction.status === 'BLOCKED';
    const isChallenged = currentAction.status === 'CHALLENGED';
    
    // Helper to get Portuguese Action Name
     const getActionName = (type) => {
        const map = {
            'INCOME': 'Renda',
            'FOREIGN_AID': 'Ajuda Externa',
            'TAX': 'Taxa',
            'STEAL': 'Extorquir',
            'ASSASSINATE': 'Assassinar',
            'COUP': 'Golpe',
            'EXCHANGE': 'Trocar Cartas'
        };
        return map[type] || type;
    };
    
    const getBlockCard = (type) => {
        if (type === 'ASSASSINATE') return 'Condessa';
        if (type === 'STEAL') return 'Capitão/Embaixador';
        // INVESTIGATE cannot be blocked, so we don't return anything for it.
        // EXCHANGE cannot be blocked.
        // COUP cannot be blocked.
        if (type === 'FOREIGN_AID') return 'Duque';
        return null;
    };


    if (isPending) {
        return (
            <div className="fixed inset-x-0 bottom-24 z-40 mx-auto w-full max-w-md p-4 animate-in slide-in-from-bottom">
                <div className="bg-gray-800/90 backdrop-blur border border-cyan-500/30 rounded-xl p-4 shadow-2xl">
                     <div className="h-1 bg-gray-700 rounded-full overflow-hidden mb-3">
                        <div 
                            className="h-full bg-cyan-400 transition-all duration-1000 ease-linear"
                            style={{ width: `${((timer || 0) / 5) * 100}%` }}
                        />
                    </div>
                    
                    <div className="flex flex-col gap-3">
                         <div className="text-white text-center">
                             <span className="font-bold text-cyan-400">{isMyAction ? 'VOCÊ' : gameState.players[currentAction.playerId].name}</span>
                             <span className="text-sm text-gray-400 ml-2">está usando {getActionName(currentAction.type)}</span>
                             {currentAction.targetId && (
                                 <span className="text-sm text-red-400 block">Alvo: {gameState.players[currentAction.targetId].name}</span>
                             )}
                         </div>
                         
                         {/* Controls for TARGET or ANYONE for Foreign Aid */}
                         {((isMyTarget) || (!isMyAction && currentAction.type === 'FOREIGN_AID')) && (
                             <div className="flex gap-2 justify-center mt-2">
                                {isMyTarget && (
                                <button 
                                    onClick={acceptAction}
                                    className="bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-500 px-4 py-2 rounded-lg text-sm font-bold"
                                >
                                    {currentAction.type === 'ASSASSINATE' ? 'ACEITAR MORTE' : 'ACEITAR'}
                                </button>
                                )}
                                
                                {currentAction.type === 'STEAL' ? (
                                    <>
                                        <button 
                                            onClick={() => blockAction('Capitão')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1"
                                        >
                                            <Shield size={14}/>
                                            BLOQUEAR (Capitão)
                                        </button>
                                        <button 
                                            onClick={() => blockAction(gameState.settings?.useInquisitor ? 'Inquisidor' : 'Embaixador')}
                                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1"
                                        >
                                            <Shield size={14}/>
                                            BLOQUEAR ({gameState.settings?.useInquisitor ? 'Inquisidor' : 'Embaixador'})
                                        </button>
                                    </>
                                ) : (
                                    getBlockCard(currentAction.type) && (
                                        <button 
                                            onClick={() => blockAction(getBlockCard(currentAction.type))}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                                        >
                                            <Shield size={16}/>
                                            BLOQUEAR ({getBlockCard(currentAction.type)})
                                        </button>
                                    )
                                )}
                             </div>
                         )}

                         {/* Controls for OTHERS (Challenge) */}
                         {!isMyAction && currentAction.type !== 'FOREIGN_AID' && (
                             <button 
                                onClick={contestAction}
                                className="w-full bg-yellow-600/20 hover:bg-yellow-600/40 border border-yellow-500 text-yellow-500 font-bold px-4 py-2 rounded-lg flex items-center justify-center gap-2 mt-2"
                             >
                                <ShieldAlert size={18} />
                                CONTESTAR AÇÃO
                             </button>
                         )}
                         
                         {isMyAction && <div className="text-center text-xs text-gray-500">Aguardando reação...</div>}
                    </div>
                </div>
            </div>
        );
    }
    
    if (isBlocked) {
         return (
            <div className="fixed inset-x-0 bottom-24 z-40 mx-auto w-full max-w-md p-4 animate-in slide-in-from-bottom">
                <div className="bg-gray-800/90 backdrop-blur border border-yellow-500/30 rounded-xl p-4 shadow-2xl text-center">
                    <h3 className="text-yellow-500 font-bold mb-2">AÇÃO BLOQUEADA!</h3>
                    <p className="text-gray-300 text-sm mb-4">
                        {gameState.players[currentAction.blockerId].name} bloqueou com {currentAction.blockCard}.
                    </p>
                    
                    {isMyAction ? (
                        <div className="flex gap-2 justify-center">
                            <button 
                                onClick={acceptBlock} 
                                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-bold"
                            >
                                ACEITAR (Passar Vez)
                            </button>
                        
                        <button 
                            onClick={contestAction}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                        >
                            <ShieldAlert size={16}/>
                            CONTESTAR BLOQUEIO
                        </button>
                    </div>
                    ) : (
                        <div className="text-sm text-gray-500">Aguardando {gameState.players[currentAction.playerId].name} decidir...</div>
                    )}
                </div>
            </div>
         );
    }

    if (isChallenged) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
                 {/* Standard Challenge Screen (Already Implemented visually in previous versions, simplified here) */}
                 <div className="text-white font-bold text-2xl animate-pulse">VERIFICANDO EVIDÊNCIAS...</div>
            </div>
        );
    }

    return null;
};

export default ChallengeTimer;
