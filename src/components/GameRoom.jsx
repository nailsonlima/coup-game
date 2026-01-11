import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import OpponentList from './OpponentList';
import GameLog from './GameLog';
import PlayerDashboard from './PlayerDashboard';
import ChallengeTimer from './ChallengeTimer';
import LobbyView from './LobbyView';
import VictoryView from './VictoryView';
import JudgmentView from './JudgmentView';



const GameRoom = () => {
    const { roomCode, leaveRoom, gameState, user } = useGame();
    
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
        <div className="h-full w-full overflow-hidden flex flex-col">
            {/* Main Content Area - Padding handled by App Wrapper */}
            <main className="flex-1 relative h-full w-full overflow-hidden">
                {content}
            </main>
        </div>
    );
};

export default GameRoom;
