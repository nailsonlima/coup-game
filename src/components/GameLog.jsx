import React, { useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';

const GameLog = () => {
  const { gameState } = useGame();
  const logs = gameState.logs || [];
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="h-32 bg-gray-950 border-y border-gray-800 p-3 overflow-y-auto scrollbar-hide font-mono text-sm">
      <div className="space-y-1">
        {logs.map((log, i) => (
          <div key={i} className="text-gray-400 border-l-2 border-gray-800 pl-2 py-0.5">
            <span className="text-gray-600 text-[10px] mr-2">
              {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
            </span>
            <span className={log.text.includes('lost a life') ? 'text-red-400' : 'text-gray-300'}>
              {log.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default GameLog;
