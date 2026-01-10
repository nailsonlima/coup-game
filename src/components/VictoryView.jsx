import React from 'react';
import { useGame } from '../context/GameContext';

const VictoryView = () => {
    const { gameState, user, resetGame } = useGame();
    const isHost = gameState.hostId === user.id;
    const winnerName = gameState.winner || 'Alguém';

    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-900 p-6 text-center space-y-8 animate-in zoom-in">
                <div className="text-6xl mb-4 animate-bounce">🏆</div>
                <h1 className="text-4xl font-bold text-yellow-500 mb-2">VENCEDOR!</h1>
                <div className="text-5xl text-white font-extrabold tracking-wider drop-shadow-lg">{winnerName}</div>
                
                {isHost ? (
                    <button 
                    onClick={resetGame}
                    className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold py-4 px-10 rounded-xl shadow-lg shadow-yellow-500/30 transition-all hover:scale-105"
                    >
                    REINICIAR PARTIDA
                    </button>
                ) : (
                    <div className="text-gray-400 animate-pulse">Aguardando o host reiniciar...</div>
                )}
        </div>
    );
};

export default VictoryView;
