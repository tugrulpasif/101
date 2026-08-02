import { GameState, Player, Tile, Meld, RoomSettings } from '../../types/okey';
import { setupGameDeck } from './deck';
import { validateOpeningAttempt, validateSingleMeld, getEffectiveTile } from './validator';

export function initializeGame(roomCode: string, hostId: string, players: Player[], settings: RoomSettings): GameState {
  // Randomize starting seat
  const startingSeat = Math.floor(Math.random() * 4);
  const deckSetup = setupGameDeck(startingSeat);

  // Initialize player status for new game round
  const updatedPlayers = players.map(p => {
    const hand = deckSetup.hands[p.seatIndex];
    return {
      ...p,
      hand,
      rack: formatHandToRack(hand),
      hasOpened: false,
      openedType: null as ('melds' | 'pairs' | null),
      totalPenalty: p.totalPenalty || settings.startingPenalty,
      isEliminated: false,
    };
  });

  const discardPiles: { [seatIndex: number]: Tile[] } = {
    0: [], 1: [], 2: [], 3: []
  };

  return {
    status: 'playing',
    roomCode,
    hostId,
    settings,
    players: updatedPlayers,
    deckCount: deckSetup.deck.length,
    discardPiles,
    lastDiscard: null,
    indicatorTile: deckSetup.indicatorTile,
    okeyTile: deckSetup.okeyTile,
    tableMelds: [],
    turn: {
      currentSeat: startingSeat,
      hasDrawn: true, // Starting player gets 22 tiles (already drawn)
      turnStartTime: Date.now(),
    },
    roundNumber: 1,
    turnCount: 0,
    lastRoundResult: null,
    history: [],
    _internalDeck: deckSetup.deck, // Real deck array
  } as any;
}

/**
 * Arranges a hand of tiles into a 30-slot rack (2 rows of 15)
 */
export function formatHandToRack(hand: Tile[]): (Tile | null)[] {
  const rack: (Tile | null)[] = new Array(30).fill(null);
  for (let i = 0; i < Math.min(hand.length, 30); i++) {
    rack[i] = hand[i];
  }
  return rack;
}

/**
 * Auto-sort helper for sorting hand by Runs (Seri)
 */
export function sortHandByRuns(tiles: Tile[]): Tile[] {
  const colorOrder: { [key: string]: number } = { red: 1, black: 2, blue: 3, yellow: 4, fake: 5 };
  return [...tiles].sort((a, b) => {
    if (a.color !== b.color) {
      return colorOrder[a.color] - colorOrder[b.color];
    }
    return a.number - b.number;
  });
}

/**
 * Auto-sort helper for sorting hand by Sets / Groups (Takım)
 */
export function sortHandBySets(tiles: Tile[]): Tile[] {
  const colorOrder: { [key: string]: number } = { red: 1, black: 2, blue: 3, yellow: 4, fake: 5 };
  return [...tiles].sort((a, b) => {
    if (a.number !== b.number) {
      return a.number - b.number;
    }
    return colorOrder[a.color] - colorOrder[b.color];
  });
}

/**
 * Auto-sort helper for sorting hand by Pairs (Çift)
 */
export function sortHandByPairs(tiles: Tile[]): Tile[] {
  const pairs: Tile[] = [];
  const singles: Tile[] = [];
  const remaining = [...tiles];

  while (remaining.length > 0) {
    const tile = remaining.shift()!;
    const matchIdx = remaining.findIndex(
      t => (t.color === tile.color && t.number === tile.number) || t.isOkey || tile.isOkey
    );

    if (matchIdx !== -1) {
      const matchTile = remaining.splice(matchIdx, 1)[0];
      pairs.push(tile, matchTile);
    } else {
      singles.push(tile);
    }
  }

  return [...pairs, ...singles];
}
