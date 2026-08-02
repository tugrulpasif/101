import { Tile, TileColor } from '../../types/okey';

export function createDeck(): Tile[] {
  const colors: TileColor[] = ['red', 'black', 'blue', 'yellow'];
  const tiles: Tile[] = [];
  let idCounter = 1;

  // Create 2 of each number (1-13) for each of 4 colors (104 tiles)
  for (const color of colors) {
    for (let set = 1; set <= 2; set++) {
      for (let num = 1; num <= 13; num++) {
        tiles.push({
          id: `tile_${idCounter++}`,
          color,
          number: num,
        });
      }
    }
  }

  // Add 2 Fake Okeys
  tiles.push({ id: `tile_${idCounter++}`, color: 'fake', number: 0, isFake: true });
  tiles.push({ id: `tile_${idCounter++}`, color: 'fake', number: 0, isFake: true });

  return tiles;
}

export function shuffleDeck(deck: Tile[]): Tile[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export interface DeckSetupResult {
  deck: Tile[];
  indicatorTile: Tile;
  okeyTile: Tile;
  hands: Tile[][];
}

export function setupGameDeck(startingSeatIndex: number): DeckSetupResult {
  let deck = shuffleDeck(createDeck());

  // Pick indicator tile (cannot be fake okey for clean game play)
  let indicatorIndex = deck.findIndex(t => !t.isFake);
  if (indicatorIndex === -1) indicatorIndex = 0;
  
  const [indicatorTile] = deck.splice(indicatorIndex, 1);

  // Determine Okey tile
  // Same color as indicator, number = (indicator.number % 13) + 1
  const okeyColor = indicatorTile.color;
  const okeyNumber = (indicatorTile.number % 13) + 1;

  const okeyTile: Tile = {
    id: 'okey_reference',
    color: okeyColor,
    number: okeyNumber,
    isOkey: true,
  };

  // Flag actual okey tiles in remaining deck
  deck = deck.map(t => {
    if (!t.isFake && t.color === okeyColor && t.number === okeyNumber) {
      return { ...t, isOkey: true };
    }
    return t;
  });

  // Deal hands for 4 seats
  // Starting seat gets 22 tiles, other 3 get 21 tiles each
  const hands: Tile[][] = [[], [], [], []];

  for (let i = 0; i < 4; i++) {
    const count = i === startingSeatIndex ? 22 : 21;
    hands[i] = deck.splice(0, count);
  }

  return {
    deck,
    indicatorTile,
    okeyTile,
    hands,
  };
}
