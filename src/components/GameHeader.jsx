import React, { useState } from 'react';
import { BookOpen, LogOut, AlertTriangle, X, Check } from 'lucide-react';
import { useGame } from '../context/GameContext';

const GameHeader = ({ onOpenRules }) => {
    const { roomCode, leaveRoom } = useGame();
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    const handleExit = () => {
        leaveRoom();
        setShowExitConfirm(false);
    };

    return (
        <>
            <header className="fixed top-0 left-0 w-full z-[10000] flex justify-between items-center p-4 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800 shadow-lg">
                {/* Left: Rules */}
                <button 
                    onClick={onOpenRules} 
                    className="flex items-center gap-2 text-cyan-400 hover:text-white transition-colors"
                    aria-label="Regras"
                >
                    <BookOpen size={28} />
                    <span className="hidden sm:inline font-bold text-sm">REGRAS</span>
                </button>

                {/* Center: Room Code */}
                <div className="font-mono font-bold text-gray-500 tracking-widest hidden md:block select-all">
                    {roomCode}
                </div>

                {/* Right: Exit */}
                <button 
                    onClick={() => setShowExitConfirm(true)} 
                    className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Sair"
                >
                    <span className="hidden sm:inline font-bold text-sm">SAIR</span>
                    <LogOut size={28} />
                </button>
            </header>

            {/* EXIT CONFIRMATION MODAL */}
            {showExitConfirm && (
                <div className="fixed inset-0 z-[10001] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-gray-800 border-2 border-red-500/50 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
                        
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
                                <AlertTriangle className="text-red-500 w-8 h-8" />
                            </div>
                            
                            <h2 className="text-xl font-bold text-white">Sair da Partida?</h2>
                            <p className="text-gray-400">
                                Você será desconectado da sala. Se o jogo estiver em andamento, você perderá sua vaga.
                            </p>

                            <div className="grid grid-cols-2 gap-3 w-full mt-4">
                                <button
                                    onClick={() => setShowExitConfirm(false)}
                                    className="flex items-center justify-center gap-2 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-all"
                                >
                                    <X size={20} />
                                    CANCELAR
                                </button>
                                <button
                                    onClick={handleExit}
                                    className="flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 transition-all"
                                >
                                    <LogOut size={20} />
                                    SAIR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default GameHeader;
