import { Tile, GameState, Player } from '../../types/okey';
import { validateOpeningAttempt, isValidRun, isValidSet } from '../engine/validator';

/**
 * Finds raw meld candidates in hand
 */
export function findPossibleMelds(tiles: Tile[], okeyRef: Tile): Tile[][] {
  const foundMelds: Tile[][] = [];

  // 1. Look for Sets (Takım: 3 or 4 same number, diff color)
  const byNumber: { [num: number]: Tile[] } = {};
  tiles.forEach(t => {
    if (!byNumber[t.number]) byNumber[t.number] = [];
    byNumber[t.number].push(t);
  });

  for (const numStr in byNumber) {
    const group = byNumber[numStr];
    const uniqueColorMap = new Map<string, Tile>();
    group.forEach(t => {
      if (!uniqueColorMap.has(t.color)) uniqueColorMap.set(t.color, t);
    });

    const uniqueTiles = Array.from(uniqueColorMap.values());
    if (uniqueTiles.length >= 3) {
      foundMelds.push(uniqueTiles.slice(0, 4));
    }
  }

  // 2. Look for Runs (Seri: same color, consecutive numbers)
  const byColor: { [color: string]: Tile[] } = {};
  tiles.forEach(t => {
    if (!byColor[t.color]) byColor[t.color] = [];
    byColor[t.color].push(t);
  });

  for (const color in byColor) {
    const colorGroup = byColor[color].sort((a, b) => a.number - b.number);
    let currentRun: Tile[] = [];

    for (let i = 0; i < colorGroup.length; i++) {
      const tile = colorGroup[i];
      if (currentRun.length === 0) {
        currentRun.push(tile);
      } else {
        const last = currentRun[currentRun.length - 1];
        if (tile.number === last.number + 1) {
          currentRun.push(tile);
        } else if (tile.number > last.number + 1) {
          if (currentRun.length >= 3) {
            foundMelds.push([...currentRun]);
          }
          currentRun = [tile];
        }
      }
    }

    if (currentRun.length >= 3) {
      foundMelds.push([...currentRun]);
    }
  }

  return foundMelds;
}

/**
 * Finds a valid non-overlapping combination of melds that meets openingLimit
 */
export function findDisjointOpeningCombination(hand: Tile[], openingLimit: number, okeyRef: Tile): Tile[][] | null {
  const allMelds = findPossibleMelds(hand, okeyRef);
  if (allMelds.length === 0) return null;

  // Filter out any melds that aren't individually valid
  const validMelds = allMelds.filter(m => isValidRun(m, okeyRef).valid || isValidSet(m, okeyRef).valid);

  // Try combinations of non-overlapping melds
  const n = validMelds.length;
  let bestCombination: Tile[][] | null = null;
  let maxTotal = 0;

  // Generate subsets of validMelds
  for (let mask = 1; mask < (1 << n); mask++) {
    const candidateCombination: Tile[][] = [];
    const usedTileIds = new Set<string>();
    let overlap = false;

    for (let i = 0; i < n; i++) {
      if ((mask & (1 << i)) !== 0) {
        const meld = validMelds[i];
        for (const tile of meld) {
          if (usedTileIds.has(tile.id)) {
            overlap = true;
            break;
          }
          usedTileIds.add(tile.id);
        }
        if (overlap) break;
        candidateCombination.push(meld);
      }
    }

    if (!overlap && candidateCombination.length > 0) {
      const openCheck = validateOpeningAttempt(candidateCombination, openingLimit, okeyRef);
      if (openCheck.valid && openCheck.totalValue >= openingLimit) {
        if (openCheck.totalValue > maxTotal) {
          maxTotal = openCheck.totalValue;
          bestCombination = candidateCombination;
        }
      }
    }
  }

  return bestCombination;
}

export function getMediumBotAction(bot: Player, state: GameState): {
  action: 'draw' | 'discard' | 'open' | 'pass';
  drawSource?: 'deck' | 'discard';
  discardTileId?: string;
  meldsToOpen?: Tile[][];
} {
  const hand = bot.hand || [];
  const okeyRef = state.okeyTile || { id: 'temp', color: 'red', number: 1 };
  const limit = state.settings.openingLimit;

  // 1. Draw action
  if (!state.turn.hasDrawn) {
    const lastDiscard = state.lastDiscard?.tile;
    if (lastDiscard) {
      const testHand = [...hand, lastDiscard];
      const combo = findDisjointOpeningCombination(testHand, limit, okeyRef);
      if (combo) {
        return { action: 'draw', drawSource: 'discard' };
      }
    }
    return { action: 'draw', drawSource: 'deck' };
  }

  // 2. Try Opening if not opened yet
  if (!bot.hasOpened) {
    const combo = findDisjointOpeningCombination(hand, limit, okeyRef);
    if (combo) {
      const check = validateOpeningAttempt(combo, limit, okeyRef);
      if (check.valid && check.totalValue >= limit) {
        return { action: 'open', meldsToOpen: combo };
      }
    }
  }

  // 3. Discard tile that is not part of any meld
  const candidateCombo = findDisjointOpeningCombination(hand, limit, okeyRef);
  const meldedTileIds = new Set(
    (candidateCombo || findPossibleMelds(hand, okeyRef)).flat().map(t => t.id)
  );

  const unmelded = hand.filter(t => !meldedTileIds.has(t.id) && !t.isOkey);

  if (unmelded.length > 0) {
    unmelded.sort((a, b) => b.number - a.number);
    return { action: 'discard', discardTileId: unmelded[0].id };
  }

  const nonOkeys = hand.filter(t => !t.isOkey);
  const discardTile = nonOkeys.length > 0 ? nonOkeys[0] : hand[0];
  return { action: 'discard', discardTileId: discardTile?.id };
}
