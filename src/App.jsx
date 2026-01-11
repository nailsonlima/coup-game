import React from 'react';
import { GameProvider, useGame } from './context/GameContext';
import Lobby from './components/Lobby';
import GameRoom from './components/GameRoom';
import GameHeader from './components/GameHeader';
import RuleBook from './components/RuleBook';

// Internal wrapper to use context
const GlobalGameWrapper = () => {
    const { gameState, roomCode, user } = useGame();
    const [isRulesOpen, setIsRulesOpen] = React.useState(false);

    return (
        <div className="fixed inset-0 bg-gray-900 text-white font-sans flex flex-col overflow-hidden">
          {/* GLOBAL HEADER (Visible Everywhere) */}
          <GameHeader onOpenRules={() => setIsRulesOpen(true)} />

          {/* GLOBAL RULE BOOK COMPONENT */}
          <RuleBook isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 w-full h-full pt-16 md:pt-20 overflow-hidden relative"> 
             {(!user || !roomCode || !gameState) ? <Lobby /> : <GameRoom />}
          </div>
        </div>
    );
};

function App() {
  return (
    <GameProvider>
       <GlobalGameWrapper />
    </GameProvider>
  );
}

export default App;
