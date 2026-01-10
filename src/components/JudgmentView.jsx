import React from 'react';

const JudgmentView = ({ victimName }) => {
    return (
        <div className="h-screen flex flex-col items-center justify-center bg-gray-900 p-6 text-center space-y-6">
            <div className="w-24 h-24 bg-red-900/20 rounded-full flex items-center justify-center border-4 border-red-600 animate-pulse">
                    <span className="text-4xl">⚖️</span>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white mb-2">JULGAMENTO EM ANDAMENTO</h2>
                <p className="text-gray-400">Aguardando <span className="text-red-500 font-bold">{victimName}</span> pagar o preço...</p>
            </div>
        </div>
    );
};

export default JudgmentView;
