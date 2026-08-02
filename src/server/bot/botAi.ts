import { GameState, Player } from '../../types/okey';
import { getEasyBotAction } from './easyBot';
import { getMediumBotAction } from './mediumBot';
import { getHardBotAction } from './hardBot';

export interface BotDecision {
  action: 'draw' | 'discard' | 'open' | 'pass';
  drawSource?: 'deck' | 'discard';
  discardTileId?: string;
  meldsToOpen?: any[];
}

export function computeBotDecision(bot: Player, state: GameState): BotDecision {
  const difficulty = state.settings.botDifficulty || 'medium';

  switch (difficulty) {
    case 'easy':
      return getEasyBotAction(bot, state);
    case 'hard':
      return getHardBotAction(bot, state);
    case 'medium':
    default:
      return getMediumBotAction(bot, state);
  }
}
