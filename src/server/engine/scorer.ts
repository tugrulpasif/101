import { Player, Tile, RoundResult, HandResult, RoomSettings } from '../../types/okey';

export interface ScoreCalculationInput {
  players: Player[];
  winnerId: string | null;
  finishType: 'normal' | 'unopened_hand' | 'pairs' | 'okey' | 'pairs_okey' | 'hand_okey' | 'draw';
  isLastTileOkey: boolean;
  okeyRef: Tile;
  settings: RoomSettings;
  isFirstTurnOfRound?: boolean;
}

export function calculateTileValue(tile: Tile, okeyRef: Tile): number {
  if (tile.isOkey) return 20;
  if (tile.isFake) return 20;
  return tile.number;
}

export function calculateHandScores(input: ScoreCalculationInput): RoundResult {
  const { players, winnerId, finishType, isLastTileOkey, okeyRef, settings } = input;
  const handResults: HandResult[] = [];
  const winner = players.find(p => p.id === winnerId);

  for (const player of players) {
    const midRoundPen = player.midRoundPenalty || 0;

    if (player.isEliminated) {
      handResults.push({
        playerId: player.id,
        playerName: player.name,
        hasOpened: player.hasOpened,
        hasFinished: false,
        handValue: 0,
        specialPenalty: midRoundPen,
        multiplier: 1,
        roundPenalty: midRoundPen,
        totalPenalty: player.totalPenalty,
        isEliminated: true,
        reason: 'Elenmiş'
      });
      continue;
    }

    // --- WINNER PENALTY CALCULATIONS (34 OKEY STANDARTLARI) ---
    if (player.id === winnerId) {
      let winScoreDelta = -202; // Standard winner gets -202
      let winReason = 'Bitirdi (-202 Puan)';

      if (finishType === 'pairs_okey' || finishType === 'hand_okey') {
        winScoreDelta = -404; // Double Okey / Elden Okey gets -404
        winReason = 'Okey ile Çiftten/Elden Bitme (-404 Puan)';
      } else if (finishType === 'okey' && player.openedType === 'pairs') {
        winScoreDelta = -404;
        winReason = 'Çiftten Okeyle Bitme (-404 Puan)';
      }

      const roundPenalty = winScoreDelta + midRoundPen;
      const newTotal = player.totalPenalty + roundPenalty;

      handResults.push({
        playerId: player.id,
        playerName: player.name,
        hasOpened: player.hasOpened,
        hasFinished: true,
        handValue: 0,
        specialPenalty: midRoundPen,
        multiplier: 1,
        roundPenalty,
        totalPenalty: newTotal,
        isEliminated: false,
        reason: winReason
      });
      continue;
    }

    // --- DRAW SCENARIO ---
    if (finishType === 'draw') {
      const hand = player.hand || [];
      const handSum = hand.reduce((sum, t) => sum + calculateTileValue(t, okeyRef), 0);
      const roundPenalty = handSum + midRoundPen;
      const newTotal = player.totalPenalty + roundPenalty;
      const isEliminated = newTotal >= settings.maxPenalty;

      handResults.push({
        playerId: player.id,
        playerName: player.name,
        hasOpened: player.hasOpened,
        hasFinished: false,
        handValue: handSum,
        specialPenalty: midRoundPen,
        multiplier: 1,
        roundPenalty,
        totalPenalty: newTotal,
        isEliminated,
        reason: 'Berabere'
      });
      continue;
    }

    // --- NON-WINNER OPPONENTS CALCULATIONS ---
    const hand = player.hand || [];
    let baseHandValue = hand.reduce((sum, t) => sum + calculateTileValue(t, okeyRef), 0);
    let roundPenalty = 0;
    let multiplier = 1;
    let reason = '';

    // 1. Elden Bitiş Durumu (Hiç kimse açmamışken)
    if (finishType === 'unopened_hand') {
      roundPenalty = 404 + midRoundPen;
      reason = 'Elden Bitene Yakalandı (+404 Puan)';
    } else if (finishType === 'hand_okey') {
      roundPenalty = 808 + midRoundPen;
      reason = 'Elden Okeyle Bitene Yakalandı (+808 Puan)';
    } else if (!player.hasOpened) {
      // 2. Hiç açamamış oyuncu cezası: Kesinlikle +202 Puan!
      roundPenalty = 202 + midRoundPen;
      reason = 'Hiç Açamadı (+202 Puan)';
    } else {
      // 3. Açmış oyuncunun elde kalan taş puanı hesapları
      if (finishType === 'pairs') {
        multiplier = player.openedType === 'pairs' ? 4 : 2;
        reason = `Çiftle Bitene Yakalandı (${baseHandValue} x ${multiplier})`;
      } else if (finishType === 'pairs_okey') {
        multiplier = 4;
        reason = `Çiftten Okeyle Bitene Yakalandı (${baseHandValue} x 4)`;
      } else if (finishType === 'okey') {
        multiplier = player.openedType === 'pairs' ? 4 : 2;
        reason = `Okeyle Bitene Yakalandı (${baseHandValue} x ${multiplier})`;
      } else {
        if (player.openedType === 'pairs') {
          multiplier = 2;
          reason = `Çift Açtığı İçin Taşlar x2 (${baseHandValue} x 2)`;
        } else {
          reason = `Açtı (Eldeki Taşlar: ${baseHandValue})`;
        }
      }

      roundPenalty = (baseHandValue * multiplier) + midRoundPen;
    }

    const newTotalPenalty = player.totalPenalty + roundPenalty;
    const isEliminated = newTotalPenalty >= settings.maxPenalty;

    handResults.push({
      playerId: player.id,
      playerName: player.name,
      hasOpened: player.hasOpened,
      hasFinished: false,
      handValue: baseHandValue,
      specialPenalty: midRoundPen,
      multiplier,
      roundPenalty,
      totalPenalty: newTotalPenalty,
      isEliminated,
      reason
    });
  }

  return {
    winnerId,
    winnerName: winner ? winner.name : 'Kimse',
    finishType,
    results: handResults
  };
}
