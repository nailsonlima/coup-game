import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';

const GameContainer = () => {
  const { gameState, roomCode, user } = useGame();

  if (!user || !roomCode || !gameState) {
    return <Lobby />;
  }

  return <GameRoom />;
};

function App() {
  return (
    <GameProvider>
       <div className="min-h-screen bg-gray-900 text-white font-sans">
         <GameContainer />
       </div>
    </GameProvider>
  );
}

export default App;
