import React, { createContext, useContext, useState, useEffect } from 'react';
import { database, auth } from '../config/firebase';
import { ref, set, onValue, update, get, remove, onDisconnect } from 'firebase/database';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { createDeck, shuffleDeck } from '../utils/gameUtils';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('coup_user')) || null);
  const [roomCode, setRoomCode] = useState(localStorage.getItem('coup_room') || null);
  const [gameState, setGameState] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  // --- 0. ANONYMOUS AUTH ---
  useEffect(() => {
      signInAnonymously(auth).catch((error) => {
          console.error("Auth Failed:", error);
      });

      const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
              console.log("Authenticated as:", currentUser.uid);
              setAuthReady(true);
              
              // If we have a stored user, update their ID to match the real Auth ID if different?
              // Actually, we should just ensure any NEW login uses this ID.
              // If there is an existing local user, we might want to preserve the NAME but update the ID?
              // For simplicity, we won't forcibly overwrite the existing local user object YET, 
              // but the 'login' function will now use auth.currentUser.uid.
              
              // Optional: Update existing user ID if it was "fake" before?
              // Let's rely on the user re-logging in or just 'login' flow.
          } else {
              setAuthReady(false);
          }
      });
      return () => unsubscribeAuth();
  }, []);

  // --- 1. FIREBASE SYNC ---

  useEffect(() => {
    if (!roomCode) {
      setGameState(null);
      return;
    }
    const roomRef = ref(database, `rooms/${roomCode}`);
    
    // --- PERSISTENCE: REMOVED AUTO-DELETE ON DISCONNECT ---
    // We want users to be able to refresh. 
    // Cleanup is now handled by 'cleanupInactiveRooms' and explicit 'leaveRoom'.
    
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        
        // --- 1.1 RECONNECTION VALIDATION ---
        // If I have a roomCode and User Local ID, I expect to be in the players list.
        // If the room exists but I am NOT in it (e.g. Host deleted me or Room was reset), 
        // I should be kicked to Lobby.
        
        // Only run this check if "user" is defined (I think I am logged in)
        if (user && data.players && !data.players[user.id]) {
            console.warn("Player not found in room. Redirecting to Lobby.");
            setGameState(null);
            setRoomCode(null);
            localStorage.removeItem('coup_room');
            return;
        }

        setGameState(data);
        


      } else {
        // Room deleted
        setRoomCode(null);
        localStorage.removeItem('coup_room');
      }
    });
    return () => unsubscribe();
  }, [roomCode, user?.id]);

  // --- 2. AUTH & ROOM MANAGEMENT ---
  const login = (name) => {
    // PREFER FIREBASE UID
    let id;
    if (auth.currentUser) {
        id = auth.currentUser.uid;
    } else {
        // Fallback (Should rarely happen if we wait for authReady)
        console.warn("Auth not ready, using temp ID");
        id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    }

    const newUser = { id, name };
    setUser(newUser);
    localStorage.setItem('coup_user', JSON.stringify(newUser));
    return newUser;
  };

  const cleanupInactiveRooms = async () => {
      // JANITOR: Delete rooms older than 10 mins inactive
      try {
          const roomsRef = ref(database, 'rooms');
          const snap = await get(roomsRef);
          if (snap.exists()) {
              const rooms = snap.val();
              const now = Date.now();
              const TIMEOUT = 10 * 60 * 1000; // 10 mins
              
              const updates = {};
              let cleanedCount = 0;
              
              Object.keys(rooms).forEach(key => {
                  const room = rooms[key];
                  const lastActive = room.lastActive || room.createdAt || 0;
                  if (now - lastActive > TIMEOUT) {
                      updates[`rooms/${key}`] = null; // Delete
                      cleanedCount++;
                  }
              });
              
              if (cleanedCount > 0) {
                  await update(ref(database), updates);
                  console.log(`[JANITOR] Cleaned ${cleanedCount} inactive rooms.`);
              }
          }
      } catch (e) {
          console.error("Janitor failed:", e);
      }
  };

  const touchRoom = async (code) => {
      // Updates lastActive
      await update(ref(database, `rooms/${code}`), { lastActive: Date.now() });
  };

  const createRoom = async () => {
    if (!user) return;
    setLoading(true);
    
    // RUN JANITOR
    cleanupInactiveRooms();

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const newRoom = {
      code,
      hostId: user.id,
      status: 'LOBBY', // PHASE_WAITING
      turnPhase: 'PHASE_WAITING',
      settings: { useInquisitor: false },
      players: {
        [user.id]: {
          id: user.id,
          name: user.name,
          coins: 0,
          cards: [],
          isAlive: true,
          isReady: true
        }
      },
      createdAt: Date.now(),
      lastActive: Date.now()
    };
    await set(ref(database, `rooms/${code}`), newRoom);
    
    // No more onDisconnect removal!

    setRoomCode(code);
    localStorage.setItem('coup_room', code);
    setLoading(false);
  };

  const joinRoom = async (code) => {
    if (!user) return;
    setLoading(true);
    const roomRef = ref(database, `rooms/${code}`);
    const snapshot = await get(roomRef);
    
    if (snapshot.exists()) {
      const room = snapshot.val();
      if (room.status !== 'LOBBY') {
        alert("Jogo já em andamento.");
        setLoading(false);
        return;
      }
      const updates = {};
      updates[`rooms/${code}/players/${user.id}`] = {
        id: user.id, name: user.name, coins: 0, cards: [], isAlive: true, isReady: true
      };
      updates[`rooms/${code}/lastActive`] = Date.now();
      
      await update(ref(database), updates);
      
      // No onDisconnect logic here.

      setRoomCode(code);
      localStorage.setItem('coup_room', code);
    } else {
      alert("Sala não encontrada.");
    }
    setLoading(false);
  };

  const leaveRoom = async () => {
    if (!roomCode || !user) return;
    const code = roomCode; // Capture before clearing state
    
    // Check if I am the last player
    const roomRef = ref(database, `rooms/${code}`);
    const playerRef = ref(database, `rooms/${code}/players/${user.id}`);
    
    try {
        const snap = await get(roomRef);
        if (snap.exists()) {
            const players = snap.val().players || {};
            const count = Object.keys(players).length;
            
            if (count <= 1) {
                // I am the last one (or logic thinks so), Nuke the room
                await remove(roomRef);
            } else {
                // I am fetching the room state via GET, so I have the latest data snapshot
                const roomData = snap.val();
                let updates = {};

                // --- 1. HOST MIGRATION ---
                // If I am the host, pass the torch
                if (roomData.hostId === user.id) {
                    const otherPlayerIds = Object.keys(players).filter(id => id !== user.id);
                    if (otherPlayerIds.length > 0) {
                        const newHostId = otherPlayerIds[0]; // Pick the first available
                        updates[`rooms/${code}/hostId`] = newHostId;
                    }
                }

                // --- 2. WIN BY ABANDONMENT (W.O.) ---
                // If the game is running, check if my departure leaves only ONE survivor
                if (roomData.status === 'PLAYING') {
                     const survivors = Object.values(players).filter(p => p.id !== user.id && p.isAlive);
                     if (survivors.length === 1) {
                         const winner = survivors[0];
                         updates[`rooms/${code}/status`] = 'FINISHED';
                         updates[`rooms/${code}/winnerId`] = winner.id;
                         updates[`rooms/${code}/logs`] = [...(roomData.logs || []), {
                             text: `FIM DE JOGO! Todos fugiram. ${winner.name} vence por W.O.!`,
                             timestamp: Date.now()
                         }].slice(-50);
                     }
                }
                
                // Commit updates first (Host migration / Game End)
                if (Object.keys(updates).length > 0) {
                    await update(ref(database), updates);
                }

                // Just remove only me
                await remove(playerRef);
            }
            }
    } catch (e) {
        console.error("Error leaving room:", e);
    }

    setRoomCode(null);
    localStorage.removeItem('coup_room');
  };

  const updateSettings = async (newSettings) => {
      if (!roomCode) return;
      await update(ref(database, `rooms/${roomCode}/settings`), newSettings);
  };

  // --- 3. GAME START LOGIC ---
  const startGame = async () => {
    if (!gameState || gameState.hostId !== user.id) return;
    
    const playerIds = Object.keys(gameState.players);
    if (playerIds.length < 2) {
      alert("Mínimo de 2 jogadores.");
      return;
    }

    // 1. Strict Deck Generation
    const deck = createDeck(playerIds.length, gameState.settings?.useInquisitor);
    
    // 2. Deal Cards
    const updates = {};
    const playersUpdate = {};
    const startCoins = 2; // Always 2 coins now

    playerIds.forEach(pid => {
      const c1 = deck.pop();
      const c2 = deck.pop();
      playersUpdate[pid] = {
        ...gameState.players[pid],
        coins: startCoins,
        cards: [
          { name: c1, faceUp: false, id: Math.random() },
          { name: c2, faceUp: false, id: Math.random() }
        ],
        isAlive: true
      };
    });

    updates[`rooms/${roomCode}/players`] = playersUpdate;
    updates[`rooms/${roomCode}/deck`] = deck;
    updates[`rooms/${roomCode}/status`] = 'PLAYING';
    updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_ACTION_SELECT'; // Game Start Phase
    updates[`rooms/${roomCode}/turn`] = playerIds[0];
    updates[`rooms/${roomCode}/timer`] = 30; // Initial timer
    updates[`rooms/${roomCode}/logs`] = [{ text: "JOGO INICIADO! Boa sorte.", timestamp: Date.now() }];
    updates[`rooms/${roomCode}/lastActive`] = Date.now();
    
    await update(ref(database), updates);
  };

  // --- 3.5. TIMER LOGIC ---
  useEffect(() => {
    if (!gameState || !user || !roomCode) return;

    // HOST ONLY: Decrement Timer
    // We only countdown in CHALLENGE_WINDOW. 
    // ACTION_SELECT loops forever until action is picked? Or strict 30s?
    // User asked focused on CHALLENGE_WINDOW hangs.
    
    let interval;
    if (gameState.hostId === user.id && gameState.turnPhase === 'PHASE_CHALLENGE_WINDOW' && (gameState.timer || 0) > 0) {
        interval = setInterval(() => {
            if (gameState.timer > 0) {
                set(ref(database, `rooms/${roomCode}/timer`), gameState.timer - 1);
            }
        }, 1000);
    }

    // AUTO-RESOLVE WATCHER
    // If timer hits 0 AND we are in Challenge Window -> Execute Action
    if (gameState.turnPhase === 'PHASE_CHALLENGE_WINDOW' && gameState.timer === 0) {
         // Only Host triggers the execution to prevent race conditions
         if (gameState.hostId === user.id) {
             console.log("Timer ended. Executing action...");
             resolveActionSuccess(gameState.currentAction);
         }
    }

    return () => {
        if (interval) clearInterval(interval);
    }
  }, [gameState?.timer, gameState?.turnPhase, gameState?.hostId]);

  const resetGame = async () => {
      if(!gameState) return;
      const updates = {};
      updates[`rooms/${roomCode}/status`] = 'LOBBY';
      updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_WAITING';
      updates[`rooms/${roomCode}/currentAction`] = null;
      updates[`rooms/${roomCode}/pendingPenalty`] = null;
      updates[`rooms/${roomCode}/pendingResumeAction`] = null;
      updates[`rooms/${roomCode}/penaltyVictimId`] = null;
      updates[`rooms/${roomCode}/logs`] = [];
      await update(ref(database), updates);
  };

  // --- 4. ACTION ENGINE ---

  const performAction = async (type, targetId = null) => {
      if (!user) return;
      
      // STRICT PHASE GUARD
      if (gameState.turnPhase !== 'PHASE_ACTION_SELECT') {
          console.warn(`Tentativa de ação ilegal fora da fase de seleção: ${gameState.turnPhase}`);
          return;
      }

      const updates = {};
      const newAction = {
          type,
          playerId: user.id,
          targetId,
          status: 'PENDING',
          timestamp: Date.now()
      };

      // Upfront Costs
      const myPlayer = gameState.players[user.id];
      let newCoins = myPlayer.coins;
      
      if (type === 'ASSASSINATE') {
          if (myPlayer.coins < 3) return; 
          newCoins -= 3;
          updates[`rooms/${roomCode}/players/${user.id}/coins`] = newCoins;
      } else if (type === 'COUP') {
          if (myPlayer.coins < 7) return;
          newCoins -= 7;
          updates[`rooms/${roomCode}/players/${user.id}/coins`] = newCoins;
      }

      // Phase Transition
      if (type === 'COUP') {
          // Unblockable -> Straight to Penalty
          updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_PENALTY';
          updates[`rooms/${roomCode}/penaltyVictimId`] = targetId; 
          // Note: Coup is technically not a "challenge", just immediate death.
          updates[`rooms/${roomCode}/logs`] = [...gameState.logs, {text: `${myPlayer.name} deu um GOLPE em ${gameState.players[targetId].name}!`, timestamp: Date.now()}].slice(-50);
          
      } else if (type === 'INCOME') {
           // Safe -> Immediate Execution
           updates[`rooms/${roomCode}/players/${user.id}/coins`] = newCoins + 1;
           updates[`rooms/${roomCode}/logs`] = [...gameState.logs, {text: `${myPlayer.name} pegou Renda.`, timestamp: Date.now()}].slice(-50);
           // Next Turn Logic needed here or generic function?
           // For Income, just rotate.
           const nextP = getNextPlayer(user.id);
           updates[`rooms/${roomCode}/turn`] = nextP;
           
      } else {
          // INTERRUPTIBLE ACTIONS (Foreign Aid, Tax, Steal, Assassinate, Exchange)
          updates[`rooms/${roomCode}/currentAction`] = newAction;
          updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_CHALLENGE_WINDOW';
          updates[`rooms/${roomCode}/timer`] = 7; // 7s to challenge (Increased from 5s)
          updates[`rooms/${roomCode}/logs`] = [...gameState.logs, {text: `${myPlayer.name} quer usar ${getActionName(type)}...`, timestamp: Date.now()}].slice(-50);
      }
      
      updates[`rooms/${roomCode}/lastActive`] = Date.now();
      await update(ref(database), updates);
  };

  // --- 5. REACTION ENGINE ---

  const blockAction = async (blockCard) => {
      // Moves to PHASE_BLOCK_RESPONSE
      if (!user || !gameState) return;
      if (!gameState.players[user.id].isAlive) return;

      const updates = {};
      updates[`rooms/${roomCode}/currentAction/status`] = 'BLOCKED';
      updates[`rooms/${roomCode}/currentAction/blockerId`] = user.id;
      updates[`rooms/${roomCode}/currentAction/blockCard`] = blockCard;
      updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_BLOCK_RESPONSE';
      updates[`rooms/${roomCode}/timer`] = 30; // Increased timer for Block Response (User requested +2s, setting to generous 30s or maybe 20s. Let's do 20s to be safe) wait, 30 is fine.
      updates[`rooms/${roomCode}/logs`] = [...gameState.logs, {text: `${gameState.players[user.id].name} bloqueou com ${blockCard}!`, timestamp: Date.now()}].slice(-50);
      
      await update(ref(database), updates);
  };

  const acceptBlock = async () => {
      // Actor accepts the block. Action is cancelled. Turn ends.
      if (!user || !gameState) return;
      if (!gameState.players[user.id].isAlive) return;
      
      const updates = {};
      const nextP = getNextPlayer(gameState.turn);
      updates[`rooms/${roomCode}/turn`] = nextP;
      updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_ACTION_SELECT';
      updates[`rooms/${roomCode}/currentAction`] = null;
      updates[`rooms/${roomCode}/timer`] = 30;
      
      updates[`rooms/${roomCode}/logs`] = [...gameState.logs, {
          text: `${gameState.players[user.id].name} aceitou o bloqueio. Vez de ${gameState.players[nextP].name}.`,
          timestamp: Date.now()
      }].slice(-50);
      
      await update(ref(database), updates);
  };

  const finalizeExchange = async (keptCards) => {
      if (!user || !gameState) return;
      const myPlayer = gameState.players[user.id];
      
      // Validation: keptCards count must match ALIVE cards (wait, rules say keep same number of influences)
      // Actually, standard Coup: You mix hand with 2 deck cards, then keep X cards where X is your current influence count.
      // So if I have 2 cards (1 dead), I have 1 influence. I draw 2. I have 3 cards total active? 
      // No, usually you keep dead cards? Or do dead cards stay dead?
      // Convention: You exchange your ALIVE cards. Dead cards stay dead and are not swapped.
      // So if I have 1 alive, 1 dead. I draw 2. I choose 1 from (1 alive + 2 drawn). 
      // The dead card remains as is.
      // SIMPLIFICATION: User picks (Alive Count) cards from (Alive + Drawn).
      
      const totalAlive = myPlayer.cards.filter(c => !c.faceUp).length;
      const isInquisitor = gameState.settings?.useInquisitor;
      const drawnCount = isInquisitor ? 1 : 2;
      const expectedKeepCount = totalAlive - drawnCount; // Logic: I have (Alive+Drawn), I keep (Alive).
      // Wait. Logic check:
      // Ambassador: Have N alive. Draw 2. Hand is N+2. Keep N. Return 2.
      // Inquisitor: Have N alive. Draw 1. Hand is N+1. Keep N. Return 1.
      
      if (keptCards.length !== expectedKeepCount) {
          alert(`Você deve escolher exatamente ${expectedKeepCount} cartas.`);
          return;
      }
      
      const updates = {};
      const deckSnap = await get(ref(database, `rooms/${roomCode}/deck`));
      let deck = deckSnap.val() || [];
      
      // Calculate Returned Cards
      // Current "Hand" in DB includes drawn cards? No, we haven't saved drawn cards to DB yet?
      // Wait, resolveActionSuccess needs to save them to DB for the UI to see them?
      // Yes, updating player cards in DB is safest for synchronization.
      
      const currentCards = myPlayer.cards; // These should include the extra 2 from PHASE_EXCHANGE
      
      // Find cards that were NOT kept
      const keepIds = keptCards.map(c => c.id);
      const returnedCards = currentCards.filter(c => !c.faceUp && !keepIds.includes(c.id)); 
      
      // Push returned names to deck
      returnedCards.forEach(c => deck.push(c.name));
      deck = shuffleDeck(deck);
      
      // Construct new hand
      // Dead cards + Kept cards
      const deadCards = currentCards.filter(c => c.faceUp);
      const newHand = [...deadCards, ...keptCards];
      
      updates[`rooms/${roomCode}/players/${user.id}/cards`] = newHand;
      updates[`rooms/${roomCode}/deck`] = deck;
      
      // End Turn
      const nextP = getNextPlayer(gameState.turn);
      updates[`rooms/${roomCode}/turn`] = nextP;
      updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_ACTION_SELECT';
      updates[`rooms/${roomCode}/currentAction`] = null;
      updates[`rooms/${roomCode}/timer`] = 30;
      
      updates[`rooms/${roomCode}/logs`] = [...gameState.logs, {
          text: `${myPlayer.name} realizou a Troca. Vez de ${gameState.players[nextP].name}.`,
          timestamp: Date.now()
      }].slice(-50);
      
      await update(ref(database), updates);
  };

  const submitInvestigationCard = async (cardId) => {
      // Victim reveals card to Inquisitor
      const updates = {};
      const victimId = gameState.penaltyVictimId;
      const victim = gameState.players[victimId];
      // Fix: Use find by ID, because index assumes filtered array match which is risky
      const card = victim.cards.find(c => c.id === cardId);
      
      if (!card) {
          console.error("Card not found for investigation", cardId);
          return;
      }
      
      updates[`rooms/${roomCode}/investigatedCard`] = card; // Store full card object
      updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_INQUISITOR_DECISION';
      // Logs visible to all? "Fulano mostrou uma carta ao Inquisidor"
      updates[`rooms/${roomCode}/logs`] = [...gameState.logs, {
          text: `${victim.name} mostrou uma carta ao Inquisidor.`,
          timestamp: Date.now()
      }].slice(-50);
      
      await update(ref(database), updates);
  };

  const finalizeInvestigation = async (decision) => {
      // decision: 'KEEP' or 'SWAP'
      const updates = {};
      const victimId = gameState.penaltyVictimId; // Target
      const victim = gameState.players[victimId];
      
      if (decision === 'SWAP') {
           const deckSnap = await get(ref(database, `rooms/${roomCode}/deck`));
           let deck = deckSnap.val() || [];
           
           // Return old card to deck
           const oldCard = gameState.investigatedCard;
           deck.push(oldCard.name);
           deck = shuffleDeck(deck);
           
           // Draw new card
           const newCardName = deck.pop();
           
           // Update victim hand (find card by ID to swap effectively)
           const newCards = victim.cards.map(c => {
               if (c.id === oldCard.id) {
                   return { name: newCardName, faceUp: false, id: Math.random() };
               }
               return c;
           });
           
           updates[`rooms/${roomCode}/players/${victimId}/cards`] = newCards;
           updates[`rooms/${roomCode}/deck`] = deck;
           
           updates[`rooms/${roomCode}/logs`] = [...gameState.logs, {
               text: `O Inquisidor forçou uma troca de carta!`,
               timestamp: Date.now()
           }].slice(-50);
      } else {
           updates[`rooms/${roomCode}/logs`] = [...gameState.logs, {
               text: `O Inquisidor permitiu que a carta fosse mantida.`,
               timestamp: Date.now()
           }].slice(-50);
      }
      
      // End Turn
      const nextP = getNextPlayer(gameState.turn);
      updates[`rooms/${roomCode}/turn`] = nextP;
      updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_ACTION_SELECT';
      updates[`rooms/${roomCode}/penaltyVictimId`] = null;
      updates[`rooms/${roomCode}/investigatedCard`] = null;
      updates[`rooms/${roomCode}/timer`] = 30;
      
      await update(ref(database), updates);
  };

  const acceptAction = async () => {
      if (!user || !gameState) return;
      if (!gameState.players[user.id].isAlive) return;

      // Target accepts fate (e.g. Steal or Assassination)
      // Execute the pending action immediately
      await resolveActionSuccess(gameState.currentAction);
  };

  // --- 6. CHALLENGE & RESOLUTION ENGINE ---

  const contestAction = async () => {
      if (!user || !gameState) return;
      if (!gameState.players[user.id].isAlive) return;

      // Moves to PHASE_RESOLVE_CHALLENGE (Auto-Run)
      const updates = {};
      updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_RESOLVE_CHALLENGE';
      updates[`rooms/${roomCode}/logs`] = [...gameState.logs, {text: `${gameState.players[user.id].name} CONTESTOU!`, timestamp: Date.now()}].slice(-50);
      await update(ref(database), updates);
      
      // Trigger Robot Judge
      await runAutomatedJudge();
  };

  const runAutomatedJudge = async () => {
      const act = gameState.currentAction;
      const isBlockChallenge = (act.status === 'BLOCKED');
      
      // Who is being accused?
      // If Blocked: Actor contestou o Blocker. Accused = Blocker.
      // If Pending: Challenger contestou o Actor. Accused = Actor.
      const accusedId = isBlockChallenge ? act.blockerId : act.playerId;
      const challengerId = user.id; // User who clicked 'Contestar'

      // Determine Card to Check
      const requiredCard = isBlockChallenge ? act.blockCard : getRequiredCard(act.type);

      // READ DB
      const accusedRef = ref(database, `rooms/${roomCode}/players/${accusedId}`);
      const snap = await get(accusedRef);
      const accusedPlayer = snap.val();
      
      const hasCard = accusedPlayer.cards.some(c => !c.faceUp && c.name === requiredCard);

      const updates = {};
      const newLogs = [...gameState.logs];

      if (hasCard) {
          // --- TRUTH (Accused wins) ---
          newLogs.push({text: `[JUÍZ] ${accusedPlayer.name} provou que tinha ${requiredCard}!`, timestamp: Date.now()});
          
          // 1. Swap the exposed card
          const cardIdx = accusedPlayer.cards.findIndex(c => !c.faceUp && c.name === requiredCard);
          const oldCard = accusedPlayer.cards[cardIdx];
          
          const deckSnap = await get(ref(database, `rooms/${roomCode}/deck`));
          let deck = deckSnap.val() || [];
          deck.push(oldCard.name);
          deck = shuffleDeck(deck);
          const newCardName = deck.pop();
          
          const newCards = [...accusedPlayer.cards];
          newCards[cardIdx] = { name: newCardName, faceUp: false, id: Math.random() };
          
          updates[`rooms/${roomCode}/players/${accusedId}/cards`] = newCards;
          updates[`rooms/${roomCode}/deck`] = deck;

          // 2. Punish Challenger
          updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_PENALTY';
          updates[`rooms/${roomCode}/penaltyVictimId`] = challengerId;

          // 3. Queue Original Action Effect (if it wasn't a block challenge)
          // If I challenged an Action and failed, the Action executes AND I lose a life.
          if (!isBlockChallenge) {
              // Queue side effects logic? Or execute immediately?
              // Issue: If Assassination, target needs to lose life too.
              if (act.type === 'ASSASSINATE') {
                  updates[`rooms/${roomCode}/pendingPenalty`] = {
                      nextPhase: 'PHASE_PENALTY',
                      targetId: act.targetId,
                      reason: 'ASSASSINATION'
                  };
              } else if (act.type === 'STEAL') {
                  updates[`rooms/${roomCode}/pendingAction`] = 'EXECUTE_STEAL'; // Defers coin move
              } else if (act.type === 'TAX') {
                   // Just give money now
                   updates[`rooms/${roomCode}/players/${act.playerId}/coins`] = (gameState.players[act.playerId].coins) + 3;
              } else if (act.type === 'EXCHANGE') {
                   // Queue Exchange to happen after penalty
                   updates[`rooms/${roomCode}/pendingResumeAction`] = act;
              }
          }
          
          // NOTE: If this WAS a Block Challenge, and Accused (Blocker) TOLD THE TRUTH:
          // The Action (Steal/Assassinate) is successfully BLOCKED.
          // So we DO NOT queue EXECUTE_STEAL or ASSASSINATION.
          // The Challenger loses a life (handled above), and the turn ends (after penalty).

      } else {
          // --- LIE (Accused loses) ---
          newLogs.push({text: `[JUÍZ] ${accusedPlayer.name} foi pego blefando!`, timestamp: Date.now()});
          
          // 1. Punish Accused
          updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_PENALTY';
          updates[`rooms/${roomCode}/penaltyVictimId`] = accusedId;

          // 2. Void Action?
          // If Block was a Lie -> Action proceeds!
           if (isBlockChallenge) {
                if (act.type === 'ASSASSINATE') {
                    // Block failed (Lied about Condessa), so Assassination proceeds!
                    updates[`rooms/${roomCode}/pendingPenalty`] = {
                       nextPhase: 'PHASE_PENALTY',
                       targetId: act.blockerId, // Target (Blocker) loses ANOTHER life for the assassination itself
                       reason: 'ASSASSINATION'
                   };
                } else if (act.type === 'STEAL') {
                   // Block failed, Steal proceeds!
                   updates[`rooms/${roomCode}/pendingAction`] = 'EXECUTE_STEAL';
                }
           }
          // If Action was a Lie -> Action cancelled. 
      }

      updates[`rooms/${roomCode}/logs`] = newLogs.slice(-50);
      updates[`rooms/${roomCode}/currentAction`] = null; // Clear action reference
      await update(ref(database), updates);
      
      // NOTE: pendingAction execution needs to happen inside loseLife logic or separate resolver
      if (updates[`rooms/${roomCode}/pendingAction`] === 'EXECUTE_STEAL') {
          await executeSteal(act.playerId, act.targetId);
      }
  };

  // --- 7. PENALTY EXECUTION ---

  const loseLife = async (cardIndex) => {
      const victimId = gameState.penaltyVictimId;
      if (victimId !== user.id) return;
      
      const player = gameState.players[user.id];
      const newCards = [...player.cards];
      newCards[cardIndex].faceUp = true;
      
      const updates = {};
      updates[`rooms/${roomCode}/players/${user.id}/cards`] = newCards;
      
      const aliveCount = newCards.filter(c => !c.faceUp).length;
      if (aliveCount === 0) {
          updates[`rooms/${roomCode}/players/${user.id}/isAlive`] = false;
      }

      // --- CRITICAL: WIN CHECK ---
      const allPlayers = Object.values(gameState.players);
      const survivors = allPlayers.filter(p => {
          if (p.id === user.id) return aliveCount > 0;
          return p.isAlive;
      });

      if (survivors.length === 1) {
          updates[`rooms/${roomCode}/status`] = 'FINISHED';
          updates[`rooms/${roomCode}/winner`] = survivors[0].name;
          updates[`rooms/${roomCode}/turnPhase`] = 'GAME_OVER';
          const newLogs = [...(gameState.logs||[]), { text: `🏆 FIM DE JOGO! A família de ${survivors[0].name} controla a corte!`, timestamp: Date.now() }];
          updates[`rooms/${roomCode}/logs`] = newLogs.slice(-50);
          await update(ref(database), updates);
          return; // STOP EXECUTION (Game Over)
      }
      
      // CHECK PENDING QUEUE (Double Death)
      const pending = gameState.pendingPenalty;
      
      if (pending) {
          // Load next penalty (Double Assassination)
          updates[`rooms/${roomCode}/turnPhase`] = pending.nextPhase;
          updates[`rooms/${roomCode}/penaltyVictimId`] = pending.targetId;
          updates[`rooms/${roomCode}/pendingPenalty`] = null; // Clear queue
          
          updates[`rooms/${roomCode}/logs`] = [...gameState.logs, {text: `Ainda há contas a acertar (Assassino)!`, timestamp: Date.now()}].slice(-50);
      } else if (gameState.pendingResumeAction) {
          // Resume deferred action (Exchange) after challenge penalty
          const actionToResume = gameState.pendingResumeAction;
          updates[`rooms/${roomCode}/pendingResumeAction`] = null;
          await update(ref(database), updates);
          
          await resolveActionSuccess(actionToResume);
          return; // STOP HERE, don't rotate turn yet
      } else {
          // ALL CLEAN - NEXT TURN
          const nextPlayer = getNextPlayer(gameState.turn, updates[`rooms/${roomCode}/players/${user.id}/isAlive`] === false ? user.id : null);
          updates[`rooms/${roomCode}/turn`] = nextPlayer;
          updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_ACTION_SELECT';
          updates[`rooms/${roomCode}/penaltyVictimId`] = null;
      }

      await update(ref(database), updates);
  };

  // --- HELPERS ---
  
  const getNextPlayer = (currentId, justDiedId = null) => {
      const ids = Object.keys(gameState.players);
      let idx = ids.indexOf(currentId);
      let loop = 0;
      while(loop < ids.length) {
          idx = (idx + 1) % ids.length;
          const pid = ids[idx];
          const p = gameState.players[pid];
          // If checking the player who just died locally, assume they are dead
          if (pid === justDiedId) continue; 
          if (p.isAlive) return pid;
          loop++;
      }
      return currentId; // Should imply game over
  };

  const executeSteal = async (thiefId, victimId) => {
       const vRef = ref(database, `rooms/${roomCode}/players/${victimId}`);
       const vSnap = await get(vRef);
       const tRef = ref(database, `rooms/${roomCode}/players/${thiefId}`);
       const tSnap = await get(tRef);
       
       if (vSnap.exists() && tSnap.exists()) {
           const vCoins = vSnap.val().coins;
           const stolen = Math.min(2, vCoins);
           const updates = {};
           updates[`rooms/${roomCode}/players/${victimId}/coins`] = vCoins - stolen;
           updates[`rooms/${roomCode}/players/${thiefId}/coins`] = tSnap.val().coins + stolen;
           // Remove pending flag? Assumed handled.
           await update(ref(database), updates);
       }
  };

  const resolveActionSuccess = async (act) => {
      // Auto-executes actions that were NOT contested/blocked
      const updates = {};
      const actor = gameState.players[act.playerId];
      
      if (act.type === 'INCOME') { /* Handled immediate */ }
      else if (act.type === 'FOREIGN_AID') {
          updates[`rooms/${roomCode}/players/${act.playerId}/coins`] = actor.coins + 2;
      }
      else if (act.type === 'TAX') {
          updates[`rooms/${roomCode}/players/${act.playerId}/coins`] = actor.coins + 3;
      }
      else if (act.type === 'STEAL') {
          await executeSteal(act.playerId, act.targetId);
          // Return early as executeSteal does separate update? No, we should batch.
          // For simplicity call executeSteal separately or merge logic.
      }
      else if (act.type === 'ASSASSINATE') {
           updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_PENALTY';
           updates[`rooms/${roomCode}/penaltyVictimId`] = act.targetId;
           updates[`rooms/${roomCode}/currentAction`] = null;
           await update(ref(database), updates);
           return; // Stop here, wait for penalty
      }
      else if (act.type === 'EXCHANGE') {
           // Draw 1 or 2 cards depending on Inquisitor
           const isInquisitor = gameState.settings?.useInquisitor;
           const drawCount = isInquisitor ? 1 : 2;
           
           const deckSnap = await get(ref(database, `rooms/${roomCode}/deck`));
           let deck = deckSnap.val() || [];
           
           if (deck.length < drawCount) {
               console.warn("Deck insuficente para troca.");
           }
           
           const newCards = [...actor.cards];
           for(let i=0; i<drawCount; i++) {
               if(deck.length > 0) {
                 newCards.push({ name: deck.pop(), faceUp: false, id: Math.random() });
               }
           }
           
           updates[`rooms/${roomCode}/players/${act.playerId}/cards`] = newCards;
           updates[`rooms/${roomCode}/deck`] = deck;
           updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_EXCHANGE';
           updates[`rooms/${roomCode}/currentAction`] = null; 
           
           await update(ref(database), updates);
           return; // Wait for finalizeExchange
      }
      else if (act.type === 'INVESTIGATE') {
           updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_INQUISITOR_VICTIM_SELECT';
           updates[`rooms/${roomCode}/penaltyVictimId`] = act.targetId; // Target selects card to show
           updates[`rooms/${roomCode}/currentAction`] = null;
           await update(ref(database), updates);
           return;
      }
      
      // Default Rotation for non-penalty actions
      const nextP = getNextPlayer(gameState.turn);
      updates[`rooms/${roomCode}/turn`] = nextP;
      updates[`rooms/${roomCode}/turnPhase`] = 'PHASE_ACTION_SELECT';
      updates[`rooms/${roomCode}/currentAction`] = null;
      updates[`rooms/${roomCode}/timer`] = 30; // Reset
      
      // Additional logs
      updates[`rooms/${roomCode}/logs`] = [...(gameState.logs || []), {
          text: `Ação ${getActionName(act.type)} concluída. Vez de ${gameState.players[nextP].name}.`,
          timestamp: Date.now()
      }].slice(-50);
      
      await update(ref(database), updates);
  };


  
  const getRequiredCard = (type) => {
      // Dynamic check for Inquisitor mode
      if (type === 'EXCHANGE' && gameState.settings?.useInquisitor) {
          return 'Inquisidor';
      }

      const map = {
           'TAX': 'Duque', 'STEAL': 'Capitão', 'ASSASSINATE': 'Assassino', 
           'EXCHANGE': 'Embaixador', 'FOREIGN_AID': 'blocks_ForeignAid',
           'INVESTIGATE': 'Inquisidor'
      };
      return map[type];
  };

   const getActionName = (type) => {
        const map = {'TAX':'Taxa','STEAL':'Extorsão','ASSASSINATE':'Assassinato',
            'EXCHANGE': gameState.settings?.useInquisitor ? 'Troca (Inq)' : 'Troca',
            'FOREIGN_AID':'Ajuda Externa', 'INVESTIGATE': 'Investigar'};
        return map[type] || type;
   };

  return (
    <GameContext.Provider value={{ 
      user, roomCode, gameState, loading,
      login, createRoom, joinRoom, updateSettings, startGame, leaveRoom, resetGame,
      performAction, blockAction, contestAction, acceptAction, acceptBlock, loseLife,
      resolveActionSuccess, finalizeExchange, submitInvestigationCard, finalizeInvestigation
    }}>
      {children}
    </GameContext.Provider>
  );
};

export default GameContext;
