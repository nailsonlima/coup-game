import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Users, LogIn, Plus } from 'lucide-react';

const Lobby = () => {
  const { login, createRoom, joinRoom, loading } = useGame();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState('join'); // 'join' or 'create'

  const handleLogin = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    login(name);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    joinRoom(code);
  };

  const handleCreate = () => {
    createRoom();
  };

  // If user is not logged in (no name)
  const user = JSON.parse(localStorage.getItem('coup_user'));

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-screen w-full max-w-md mx-auto">
        <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-500 mb-8 tracking-tighter">
          COUP
        </h1>
        <form onSubmit={handleLogin} className="w-full space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">CODENOME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
              placeholder="Digite seu nome"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/20 transition-all transform hover:scale-105"
          >
            ENTRAR NO COUP
          </button>
        </form>
      </div>
    );
  }

  if (user) {
      if(activeTab === 'create' || code) {
          // If we are in lobby view (either just created or joined, logic in App.jsx switches to GameRoom usually)
          // But wait, App.jsx switches to GameRoom if roomCode is set.
          // Yet Lobby.jsx also handles the "Join/Create" form.
          // Once roomCode is set, this component unmounts.
          // So the "Settings" panel must actually be in GameRoom (Lobby State)
      }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 min-h-screen w-full max-w-md mx-auto">
      <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-pink-500 mb-8 tracking-tighter">
        COUP
      </h1>
      
      <div className="w-full bg-gray-800 rounded-2xl p-1 shadow-2xl border border-gray-700 mb-6">
        <div className="flex">
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'join' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            ENTRAR
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'create' ? 'bg-gray-700 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            CRIAR SALA
          </button>
        </div>
      </div>

      <div className="w-full bg-gray-800/50 backdrop-blur-sm p-6 rounded-2xl border border-gray-700">
        {activeTab === 'join' ? (
          <form onSubmit={handleJoin} className="space-y-4">
             <div>
              <label className="block text-gray-400 text-sm mb-1">CÓDIGO DA SALA</label>
              <input
                type="number"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white outline-none focus:border-pink-500 transition-colors text-center text-2xl tracking-widest"
                placeholder="0000"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-pink-500/20 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? 'CONECTANDO...' : <><LogIn size={20} /> ENTRAR</>}
            </button>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-gray-400 text-sm">Hospede um novo jogo e convide amigos.</p>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 rounded-lg shadow-lg shadow-cyan-500/20 transition-colors flex items-center justify-center gap-2"
            >
               {loading ? 'CRIANDO...' : <><Plus size={20} /> CRIAR SALA</>}
            </button>
          </div>
        )}
      </div>
      
      <p className="mt-8 text-gray-500 text-xs text-center w-full">
          Logado como <span className="text-cyan-400 font-bold">{user.name}</span>
          <br/>
          <button 
            onClick={() => { localStorage.removeItem('coup_user'); window.location.reload(); }}
            className="text-red-500 hover:text-red-400 underline mt-2"
          >
              Sair / Trocar Nome
          </button>
      </p>
    </div>
  );
};

export default Lobby;
