import React from 'react';
import { useGame } from '../context/GameContext';

import { Share2, ArrowLeft, BookOpen } from 'lucide-react';

const LobbyView = ({ onOpenRules }) => {
    const { roomCode, leaveRoom, gameState, user, startGame, updateSettings } = useGame();
    const isHost = gameState.hostId === user.id;

    return (
        <div className="h-screen flex flex-col bg-gray-900 pb-safe">


            <main className="flex-1 p-6 flex flex-col items-center justify-center space-y-6">
                <div className="text-center space-y-2">
                    <div className="text-6xl font-bold font-mono text-gray-800 select-all">{roomCode}</div>
                    <p className="text-gray-500">Compartilhe este código com seus amigos</p>
                </div>

                <div className="w-full max-w-sm bg-gray-800 rounded-xl p-4">
                    <h3 className="text-gray-400 text-xs font-bold uppercase mb-3">Jogadores na Sala</h3>
                    <div className="space-y-2">
                        {Object.values(gameState.players || {}).map(p => (
                            <div key={p.id} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold">
                                    {p.name.charAt(0)}
                                </div>
                                <span className="font-bold text-gray-200">{p.name} {p.id === gameState.hostId && '(Host)'}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {isHost && (
                    <div className="w-full max-w-sm bg-gray-800 rounded-xl p-4">
                            <h3 className="text-gray-400 text-xs font-bold uppercase mb-3">Configurações</h3>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg cursor-pointer hover:bg-gray-700/50 transition">
                                    <input 
                                    type="checkbox" 
                                    checked={gameState.settings?.useInquisitor || false}
                                    onChange={(e) => updateSettings({...gameState.settings, useInquisitor: e.target.checked})}
                                    className="w-5 h-5 rounded border-gray-600 text-cyan-500 focus:ring-cyan-500 bg-gray-700"
                                    />
                                    <div>
                                        <div className="font-bold text-sm text-gray-200">Modo Inquisidor</div>
                                        <div className="text-xs text-gray-500">Substitui Embaixador pelo Inquisidor</div>
                                    </div>
                                </label>
                                
                            </div>
                    </div>
                )}

                {isHost ? (
                        <button 
                        onClick={startGame}
                        className="w-full max-w-sm bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-500/20 text-lg tracking-widest transition-all"
                        >
                        INICIAR PARTIDA
                        </button>
                ) : (
                    <div className="flex items-center gap-2 text-cyan-500 animate-pulse">
                        <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                        Aguardando o host iniciar...
                    </div>
                )}
            </main>
        </div>
    );
};

export default LobbyView;
