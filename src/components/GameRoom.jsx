import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BookOpen } from 'lucide-react';
import RuleBook from './RuleBook';
import OpponentList from './OpponentList';
import GameLog from './GameLog';
import PlayerDashboard from './PlayerDashboard';
import ChallengeTimer from './ChallengeTimer';
import LobbyView from './LobbyView';
import VictoryView from './VictoryView';
import JudgmentView from './JudgmentView';

import GameHeader from './GameHeader';

const GameRoom = () => {
    const { roomCode, leaveRoom, gameState, user } = useGame();
    const [showRules, setShowRules] = useState(false);
    
    // SAFE HOOK USAGE: Always called
    const isLobby = gameState.status === 'LOBBY';
    const isFinished = gameState.status === 'FINISHED';
    const isPenalty = gameState.turnPhase === 'PHASE_PENALTY';
    const amIVictim = gameState.penaltyVictimId === user.id;

    // Content Selection
    let content = null;

    if (isLobby) {
        content = <LobbyView />;
    } else if (isFinished) {
        content = <VictoryView />;
    } else if (isPenalty && !amIVictim) {
        const victimName = gameState.players[gameState.penaltyVictimId]?.name || 'Alguém';
        content = <JudgmentView victimName={victimName} />;
    } else {
        content = (
            <div className="h-full flex flex-col overflow-hidden">
                 {/* Split Screen Layout */}
                <OpponentList />
                <GameLog />
                <ChallengeTimer />
                <PlayerDashboard />
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-gray-900 overflow-hidden flex flex-col">
            <GameHeader onOpenRules={() => setShowRules(true)} />
            <RuleBook isOpen={showRules} onClose={() => setShowRules(false)} />
            
            {/* Main Content Area - Padded top for header */}
            <main className="flex-1 pt-20 relative h-full w-full overflow-hidden">
                {content}
            </main>
        </div>
    );
};

export default GameRoom;
