export const CARDS = [
  'Duke',
  'Assassin',
  'Captain',
  'Ambassador',
  'Contessa'
];

export const createDeck = (playerCount, useInquisitor = false) => {
  let deck = [];
  
  // Dynamic Sizing Rules
  // 3-6 players: 3 copies (15 cards)
  // 7-8 players: 4 copies (20 cards)
  // 9-10 players: 5 copies (25 cards)
  let copies = 3;
  if (playerCount >= 7 && playerCount <= 8) copies = 4;
  if (playerCount >= 9) copies = 5;

  const roles = [
      'Duque',
      'Assassino',
      'Capitão',
      useInquisitor ? 'Inquisidor' : 'Embaixador',
      'Condessa'
  ];

  roles.forEach(card => {
    for (let i = 0; i < copies; i++) {
      deck.push(card);
    }
  });

  return shuffleDeck(deck);
};

export const shuffleDeck = (deck) => {
  let newDeck = [...deck];
  for (let i = newDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
  }
  return newDeck;
};

export const INITIAL_COINS = 2;
