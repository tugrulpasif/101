import { Tile, TileColor, Meld, MeldType } from '../../types/okey';

/**
 * Returns the effective tile properties considering Okey / Fake Okey rules
 */
export function getEffectiveTile(tile: Tile, okeyRef: Tile): { color: TileColor; number: number } {
  if (tile.isFake) {
    return { color: okeyRef.color, number: okeyRef.number };
  }
  return { color: tile.color, number: tile.number };
}

/**
 * Calculates 34 Okey meld value using the official "Yan Hesabı" formula
 */
export function calculateMeldValue(tiles: Tile[], okeyRef: Tile, type: 'run' | 'set'): number {
  const effTiles = tiles.map(t => getEffectiveTile(t, okeyRef).number);

  if (type === 'set') {
    const targetNumber = effTiles[0];
    if (tiles.length === 3) return targetNumber;
    if (tiles.length === 4) return targetNumber + Math.floor(targetNumber / 3);
  } else {
    // Run (tiles sorted in sequence order)
    const centerTile = effTiles[1]; // 2nd tile is center of first 3
    if (effTiles.length === 3) return centerTile;

    let yanSum = 0;
    for (let i = 3; i < effTiles.length; i++) {
      yanSum += effTiles[i];
    }
    return centerTile + Math.floor(yanSum / 3);
  }
  return 0;
}

/**
 * Validates if a group of tiles forms a valid Run (Seri)
 */
export function isValidRun(tiles: Tile[], okeyRef: Tile): { valid: boolean; value: number } {
  if (tiles.length < 3) return { valid: false, value: 0 };

  const normalTiles = tiles.map(t => ({
    tile: t,
    eff: getEffectiveTile(t, okeyRef),
    isOkey: t.isOkey || false
  }));

  const nonOkeys = normalTiles.filter(t => !t.isOkey);
  if (nonOkeys.length === 0) return { valid: false, value: 0 };

  const baseColor = nonOkeys[0].eff.color;
  if (nonOkeys.some(t => t.eff.color !== baseColor)) {
    return { valid: false, value: 0 };
  }

  const okeyCount = normalTiles.filter(t => t.isOkey).length;
  const knownNumbers = nonOkeys.map(t => t.eff.number).sort((a, b) => a - b);

  const hasDuplicates = knownNumbers.some((val, idx) => idx > 0 && val === knownNumbers[idx - 1]);
  if (hasDuplicates) return { valid: false, value: 0 };

  const len = tiles.length;

  const testSeq = (startNum: number): { ok: boolean; effSequence: number[] } => {
    let neededOkeys = 0;
    const effSequence: number[] = [];
    for (let i = 0; i < len; i++) {
      let expected = startNum + i;
      if (expected === 14) expected = 1;
      if (expected > 14) return { ok: false, effSequence: [] };

      const match = nonOkeys.find(t => t.eff.number === expected);
      if (!match) {
        neededOkeys++;
      }
      effSequence.push(expected);
    }

    const usedNonOkeys = nonOkeys.filter(t => {
      for (let i = 0; i < len; i++) {
        let exp = startNum + i;
        if (exp === 14) exp = 1;
        if (t.eff.number === exp) return true;
      }
      return false;
    }).length;

    if (neededOkeys <= okeyCount && usedNonOkeys === nonOkeys.length) {
      return { ok: true, effSequence };
    }
    return { ok: false, effSequence: [] };
  };

  let bestValue = 0;
  let isValid = false;

  for (let start = 1; start <= 13; start++) {
    const res = testSeq(start);
    if (res.ok) {
      isValid = true;
      const centerTile = res.effSequence[1];
      let yanSum = 0;
      for (let i = 3; i < res.effSequence.length; i++) {
        yanSum += res.effSequence[i];
      }
      const val = centerTile + Math.floor(yanSum / 3);
      bestValue = Math.max(bestValue, val);
    }
  }

  return { valid: isValid, value: isValid ? bestValue : 0 };
}

/**
 * Validates if a group of tiles forms a valid Set (Takım)
 */
export function isValidSet(tiles: Tile[], okeyRef: Tile): { valid: boolean; value: number } {
  if (tiles.length < 3 || tiles.length > 4) return { valid: false, value: 0 };

  const nonOkeys = tiles.filter(t => !t.isOkey).map(t => getEffectiveTile(t, okeyRef));
  if (nonOkeys.length === 0) return { valid: false, value: 0 };

  const targetNumber = nonOkeys[0].number;

  if (nonOkeys.some(t => t.number !== targetNumber)) {
    return { valid: false, value: 0 };
  }

  const colorsUsed = new Set(nonOkeys.map(t => t.color));
  if (colorsUsed.size < nonOkeys.length) {
    return { valid: false, value: 0 };
  }

  const val = tiles.length === 3 ? targetNumber : targetNumber + Math.floor(targetNumber / 3);
  return { valid: true, value: val };
}

/**
 * Validates if 2 tiles form a valid Pair (Çift)
 */
export function isValidPair(tiles: Tile[], okeyRef: Tile): boolean {
  if (tiles.length !== 2) return false;

  const t1 = tiles[0];
  const t2 = tiles[1];

  if (t1.isOkey || t2.isOkey) return true;

  const eff1 = getEffectiveTile(t1, okeyRef);
  const eff2 = getEffectiveTile(t2, okeyRef);

  return eff1.color === eff2.color && eff1.number === eff2.number;
}

/**
 * Validates a single meld (Run, Set, or Pair)
 */
export function validateSingleMeld(tiles: Tile[], okeyRef: Tile): { valid: boolean; type: MeldType | null; value: number } {
  const runRes = isValidRun(tiles, okeyRef);
  if (runRes.valid) return { valid: true, type: 'run', value: runRes.value };

  const setRes = isValidSet(tiles, okeyRef);
  if (setRes.valid) return { valid: true, type: 'set', value: setRes.value };

  if (isValidPair(tiles, okeyRef)) return { valid: true, type: 'pair', value: 0 };

  return { valid: false, type: null, value: 0 };
}

/**
 * Automatically groups/partitions a list of tiles into individual valid disjoint melds!
 * Handles duplicate numbers in the same color, multiple runs per color, sets, and wildcards!
 */
export function autoPartitionTilesIntoMelds(tiles: Tile[], okeyRef: Tile): Tile[][] {
  const partitioned: Tile[][] = [];
  const remaining = [...tiles];
  const okeyTiles = remaining.filter(t => t.isOkey);

  // 1. Extract Sets (Takımlar: 3 or 4 same-number tiles with distinct colors)
  const byNumber: { [num: number]: Tile[] } = {};
  remaining.forEach(t => {
    if (t.isOkey) return;
    const eff = getEffectiveTile(t, okeyRef);
    if (!byNumber[eff.number]) byNumber[eff.number] = [];
    byNumber[eff.number].push(t);
  });

  for (const numStr in byNumber) {
    const group = byNumber[numStr];
    const uniqueColorMap = new Map<string, Tile>();
    group.forEach(t => {
      const eff = getEffectiveTile(t, okeyRef);
      if (!uniqueColorMap.has(eff.color)) uniqueColorMap.set(eff.color, t);
    });

    let uniqueTiles = Array.from(uniqueColorMap.values());
    if (uniqueTiles.length === 2 && okeyTiles.length > 0) {
      const okeyToUse = okeyTiles.pop()!;
      uniqueTiles.push(okeyToUse);
    }

    if (uniqueTiles.length >= 3) {
      const setMeld = uniqueTiles.slice(0, 4);
      partitioned.push(setMeld);
      const usedIds = new Set(setMeld.map(t => t.id));
      for (let i = remaining.length - 1; i >= 0; i--) {
        if (usedIds.has(remaining[i].id)) {
          remaining.splice(i, 1);
        }
      }
    }
  }

  // 2. Extract Runs (Seriler: handles duplicate numbers and wildcards)
  const byColor: { [color: string]: Tile[] } = {};
  remaining.forEach(t => {
    if (t.isOkey) return;
    const eff = getEffectiveTile(t, okeyRef);
    if (!byColor[eff.color]) byColor[eff.color] = [];
    byColor[eff.color].push(t);
  });

  for (const color in byColor) {
    let colorPool = [...byColor[color]];

    while (colorPool.length >= 3) {
      const sortedPool = [...colorPool].sort((a, b) => getEffectiveTile(a, okeyRef).number - getEffectiveTile(b, okeyRef).number);
      let bestRun: Tile[] = [];

      for (let startIdx = 0; startIdx < sortedPool.length; startIdx++) {
        const candidateRun: Tile[] = [sortedPool[startIdx]];
        let currentNum = getEffectiveTile(sortedPool[startIdx], okeyRef).number;

        for (let nextIdx = startIdx + 1; nextIdx < sortedPool.length; nextIdx++) {
          const nextTile = sortedPool[nextIdx];
          const nextNum = getEffectiveTile(nextTile, okeyRef).number;

          if (nextNum === currentNum + 1) {
            candidateRun.push(nextTile);
            currentNum = nextNum;
          } else if (nextNum === currentNum + 2 && okeyTiles.length > 0) {
            const okeyToUse = okeyTiles.pop()!;
            candidateRun.push(okeyToUse);
            candidateRun.push(nextTile);
            currentNum = nextNum;
          }
        }

        // Check wrap-around 13 -> 1
        if (currentNum === 13) {
          const ace = sortedPool.find(t => getEffectiveTile(t, okeyRef).number === 1 && !candidateRun.some(c => c.id === t.id));
          if (ace) {
            candidateRun.push(ace);
          }
        }

        if (isValidRun(candidateRun, okeyRef).valid && candidateRun.length > bestRun.length) {
          bestRun = candidateRun;
        }
      }

      if (bestRun.length >= 3) {
        partitioned.push(bestRun);
        const usedIds = new Set(bestRun.map(t => t.id));
        colorPool = colorPool.filter(t => !usedIds.has(t.id));
        for (let i = remaining.length - 1; i >= 0; i--) {
          if (usedIds.has(remaining[i].id)) {
            remaining.splice(i, 1);
          }
        }
      } else {
        break;
      }
    }
  }

  return partitioned;
}

/**
 * Extracts all valid 2-tile pairs from a given tile list
 */
export function extractPairsFromTiles(tiles: Tile[], okeyRef: Tile): Tile[][] {
  const pairs: Tile[][] = [];
  const remaining = [...tiles];

  while (remaining.length >= 2) {
    const tile = remaining.shift()!;
    const matchIdx = remaining.findIndex(t => isValidPair([tile, t], okeyRef));

    if (matchIdx !== -1) {
      const matchTile = remaining.splice(matchIdx, 1)[0];
      pairs.push([tile, matchTile]);
    }
  }

  return pairs;
}

/**
 * Validates an initial meld opening attempt according to 34 Okey rules
 */
export function validateOpeningAttempt(
  meldsTiles: Tile[][],
  openingLimit: number,
  okeyRef: Tile
): { valid: boolean; totalValue: number; openedType: 'melds' | 'pairs' | null; reason?: string } {
  if (!meldsTiles || meldsTiles.length === 0) {
    return { valid: false, totalValue: 0, openedType: null, reason: 'Hiçbir per gönderilmedi.' };
  }

  const allTilesInput = meldsTiles.flat();

  // Check if input is a Pair opening attempt (e.g. 5 or more pairs)
  const isInputPairs = meldsTiles.every(m => m.length === 2 && isValidPair(m, okeyRef));
  if (isInputPairs) {
    if (meldsTiles.length >= 5) {
      return { valid: true, totalValue: 0, openedType: 'pairs' };
    } else {
      return { valid: false, totalValue: 0, openedType: null, reason: '34 Oyununda Çift ile açmak için en az 5 çift gereklidir.' };
    }
  }

  // Also check if extracted pairs from input equals or exceeds 5 pairs
  const extractedPairs = extractPairsFromTiles(allTilesInput, okeyRef);
  if (extractedPairs.length >= 5 && extractedPairs.flat().length === allTilesInput.length) {
    return { valid: true, totalValue: 0, openedType: 'pairs' };
  }

  // Flatten and auto-partition input into runs/sets
  const autoGrouped = autoPartitionTilesIntoMelds(allTilesInput, okeyRef);

  let normalizedMelds = meldsTiles;
  if (autoGrouped.length > 0) {
    normalizedMelds = autoGrouped;
  }

  // 1. Strict check: NO TILE ID CAN BE REUSED ACROSS MELDS
  const usedTileIds = new Set<string>();
  for (let i = 0; i < normalizedMelds.length; i++) {
    for (const tile of normalizedMelds[i]) {
      if (usedTileIds.has(tile.id)) {
        return {
          valid: false,
          totalValue: 0,
          openedType: null,
          reason: 'Aynı taş birden fazla per için kullanılamaz.'
        };
      }
      usedTileIds.add(tile.id);
    }
  }

  // 2. Check if opening with Pairs (must be exactly 5 pairs in 34 Okey!)
  const isAllPairs = normalizedMelds.every(m => m.length === 2 && isValidPair(m, okeyRef));
  if (isAllPairs) {
    if (normalizedMelds.length === 5) {
      return { valid: true, totalValue: 0, openedType: 'pairs' };
    } else {
      return { valid: false, totalValue: 0, openedType: null, reason: '34 Oyununda Çift ile açmak için tam 5 çift gereklidir.' };
    }
  }

  // 3. Opening with Melds (Runs and Sets)
  let grandTotal = 0;
  for (let i = 0; i < normalizedMelds.length; i++) {
    const meldTiles = normalizedMelds[i];
    const runRes = isValidRun(meldTiles, okeyRef);
    const setRes = isValidSet(meldTiles, okeyRef);

    if (!runRes.valid && !setRes.valid) {
      return { valid: false, totalValue: 0, openedType: null, reason: `${i + 1}. gruptaki taşlar geçerli bir per oluşturmuyor.` };
    }

    const value = runRes.valid ? runRes.value : setRes.value;
    grandTotal += value;
  }

  // Strict 34 limit check (grandTotal must be >= openingLimit e.g. 34)
  if (grandTotal < openingLimit) {
    return {
      valid: false,
      totalValue: grandTotal,
      openedType: null,
      reason: `Seçtiğiniz perlerin ortalama puanı (${grandTotal}), 34 limitinin altında. Açamazsınız!`
    };
  }

  return { valid: true, totalValue: grandTotal, openedType: 'melds' };
}

/**
 * Checks if a tile is "işlek" (processable) on any opened meld currently on the table,
 * or if it is an Okey (Joker) tile.
 */
export function isTileProcessable(tile: Tile, tableMelds: Meld[], okeyRef: Tile): boolean {
  if (!tile) return false;

  if (tile.isOkey) return true;
  if (!tableMelds || tableMelds.length === 0) return false;

  const effTile = getEffectiveTile(tile, okeyRef);

  for (const meld of tableMelds) {
    const meldTiles = meld.tiles;
    if (!meldTiles || meldTiles.length === 0) continue;

    if (meld.type === 'pair' || (meldTiles.length === 2 && isValidPair(meldTiles, okeyRef))) {
      if (isValidPair([meldTiles[0], tile], okeyRef)) {
        return true;
      }
    }

    if (meld.type === 'set' || isValidSet(meldTiles, okeyRef).valid) {
      if (meldTiles.length === 3) {
        const setNumber = getEffectiveTile(meldTiles[0], okeyRef).number;
        if (effTile.number === setNumber) {
          const usedColors = new Set(meldTiles.map(t => getEffectiveTile(t, okeyRef).color));
          if (!usedColors.has(effTile.color)) {
            return true;
          }
        }
      }
    }

    if (meld.type === 'run' || isValidRun(meldTiles, okeyRef).valid) {
      const nonOkeys = meldTiles.filter(t => !t.isOkey).map(t => getEffectiveTile(t, okeyRef));
      if (nonOkeys.length > 0) {
        const runColor = nonOkeys[0].color;
        if (effTile.color === runColor) {
          const nums = nonOkeys.map(t => t.number).sort((a, b) => a - b);
          const minNum = nums[0];
          const maxNum = nums[nums.length - 1];

          if (effTile.number === minNum - 1) return true;
          if (effTile.number === maxNum + 1) return true;
          if (maxNum === 13 && effTile.number === 1) return true;
        }
      }
    }
  }

  return false;
}

/**
 * Validates and attaches a single tile onto an existing table meld (Taş İşleme)
 */
export function attachTileToMeld(
  meld: Meld,
  tile: Tile,
  okeyRef: Tile
): { valid: boolean; newTiles: Tile[]; reason?: string } {
  if (!meld || !tile) return { valid: false, newTiles: [], reason: 'Geçersiz parametre.' };

  const currentTiles = meld.tiles || [];

  if (meld.type === 'pair' || (currentTiles.length === 2 && isValidPair(currentTiles, okeyRef))) {
    if (isValidPair([currentTiles[0], tile], okeyRef)) {
      return { valid: true, newTiles: [...currentTiles, tile] };
    }
  }

  if (meld.type === 'set' || isValidSet(currentTiles, okeyRef).valid) {
    const setCandidate = [...currentTiles, tile];
    const setRes = isValidSet(setCandidate, okeyRef);
    if (setRes.valid) {
      return { valid: true, newTiles: setCandidate };
    }
  }

  if (meld.type === 'run' || isValidRun(currentTiles, okeyRef).valid) {
    const startCandidate = [tile, ...currentTiles];
    if (isValidRun(startCandidate, okeyRef).valid) {
      return { valid: true, newTiles: startCandidate };
    }

    const endCandidate = [...currentTiles, tile];
    if (isValidRun(endCandidate, okeyRef).valid) {
      return { valid: true, newTiles: endCandidate };
    }

    const allTiles = [...currentTiles, tile];
    const sortedCandidate = allTiles.sort((a, b) => {
      const effA = getEffectiveTile(a, okeyRef).number;
      const effB = getEffectiveTile(b, okeyRef).number;
      return effA - effB;
    });

    if (isValidRun(sortedCandidate, okeyRef).valid) {
      return { valid: true, newTiles: sortedCandidate };
    }
  }

  return { valid: false, newTiles: [], reason: 'Bu taş seçilen pere işlenemiyor.' };
}
