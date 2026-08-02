import { Tile, GameState, Player } from '../../types/okey';

export function getEasyBotAction(bot: Player, state: GameState): {
  action: 'draw' | 'discard' | 'open' | 'pass';
  drawSource?: 'deck' | 'discard';
  discardTileId?: string;
  meldsToOpen?: Tile[][];
} {
  const hand = bot.hand || [];

  // 1. If bot has not drawn yet, choose draw source
  if (!state.turn.hasDrawn) {
    // 90% chance deck, 10% discard
    const source: 'deck' | 'discard' = Math.random() < 0.9 ? 'deck' : 'discard';
    return { action: 'draw', drawSource: source };
  }

  // 2. Easy bot picks a random tile to discard
  if (hand.length > 0) {
    const randomIndex = Math.floor(Math.random() * hand.length);
    const discardTile = hand[randomIndex];
    return { action: 'discard', discardTileId: discardTile.id };
  }

  return { action: 'pass' };
}
