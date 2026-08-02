import { Tile, GameState, Player } from '../../types/okey';
import { validateOpeningAttempt } from '../engine/validator';
import { findPossibleMelds, findDisjointOpeningCombination } from './mediumBot';

export function getHardBotAction(bot: Player, state: GameState): {
  action: 'draw' | 'discard' | 'open' | 'pass';
  drawSource?: 'deck' | 'discard';
  discardTileId?: string;
  meldsToOpen?: Tile[][];
} {
  const hand = bot.hand || [];
  const okeyRef = state.okeyTile || { id: 'temp', color: 'red', number: 1 };
  const limit = state.settings.openingLimit;

  // 1. Draw phase
  if (!state.turn.hasDrawn) {
    const lastDiscard = state.lastDiscard?.tile;
    if (lastDiscard) {
      const comboBefore = findDisjointOpeningCombination(hand, limit, okeyRef);
      const comboAfter = findDisjointOpeningCombination([...hand, lastDiscard], limit, okeyRef);

      if (comboAfter && !comboBefore) {
        return { action: 'draw', drawSource: 'discard' };
      }
    }
    return { action: 'draw', drawSource: 'deck' };
  }

  // 2. Open melds phase
  if (!bot.hasOpened) {
    const combo = findDisjointOpeningCombination(hand, limit, okeyRef);
    if (combo) {
      const openCheck = validateOpeningAttempt(combo, limit, okeyRef);
      if (openCheck.valid && openCheck.totalValue >= limit) {
        return { action: 'open', meldsToOpen: combo };
      }
    }
  }

  // 3. Optimal discard evaluation
  const combo = findDisjointOpeningCombination(hand, limit, okeyRef);
  const meldedTileIds = new Set(
    (combo || findPossibleMelds(hand, okeyRef)).flat().map(t => t.id)
  );

  const scoreTileSynergy = (t: Tile): number => {
    if (t.isOkey) return 1000;
    if (meldedTileIds.has(t.id)) return 500;

    let score = 0;
    hand.forEach(other => {
      if (other.id === t.id) return;
      if (other.color === t.color) {
        const diff = Math.abs(other.number - t.number);
        if (diff === 1) score += 50;
        if (diff === 2) score += 20;
      }
      if (other.number === t.number) {
        score += 40;
      }
    });
    return score;
  };

  const candidateDiscards = [...hand].sort((a, b) => scoreTileSynergy(a) - scoreTileSynergy(b));
  const discardTarget = candidateDiscards[0] || hand[0];
  return { action: 'discard', discardTileId: discardTarget?.id };
}
