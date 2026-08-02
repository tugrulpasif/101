export type TileColor = 'red' | 'black' | 'blue' | 'yellow' | 'fake';

export interface Tile {
  id: string;
  color: TileColor;
  number: number; // 1-13, or 0 for fake okey
  isFake?: boolean;
  isOkey?: boolean;
}

export type MeldType = 'run' | 'set' | 'pair';

export interface Meld {
  id: string;
  type: MeldType;
  tiles: Tile[];
  ownerId: string;
  ownerName: string;
}

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface RoomSettings {
  openingLimit: 34 | 51 | 71 | 101;
  doubling: boolean;          // Katlamalı Oyun
  showOkey: boolean;          // Okey Taşı Gösterimi
  minPlayers: number;         // 2-4
  maxPlayers: number;         // 4
  allowBots: boolean;
  botDifficulty: BotDifficulty;
  startingPenalty: 0 | 101 | 202;
  maxPenalty: 501 | 701 | 1001;
}

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  isBot: boolean;
  isReady: boolean;
  isConnected: boolean;
  seatIndex: number;          // 0, 1, 2, 3
  hand?: Tile[];
  rack?: (Tile | null)[];    // 30 positions (2 rows x 15)
  hasOpened: boolean;
  openedType: 'melds' | 'pairs' | null;
  totalPenalty: number;
  midRoundPenalty?: number; // Accumulated during round (e.g. İşlek +101 or Topla +101)
  isEliminated: boolean;
}

export interface TurnState {
  currentSeat: number;
  hasDrawn: boolean;
  turnStartTime: number;
}

export interface HandResult {
  playerId: string;
  playerName: string;
  hasOpened: boolean;
  hasFinished: boolean;
  handValue: number;
  specialPenalty: number;
  multiplier: number;
  roundPenalty: number;
  totalPenalty: number;
  isEliminated: boolean;
  reason: string;
}

export interface RoundResult {
  winnerId: string | null;
  winnerName: string | null;
  finishType: 'normal' | 'unopened_hand' | 'pairs' | 'okey' | 'pairs_okey' | 'hand_okey' | 'draw' | 'unopened';
  results: HandResult[];
}

export interface MatchHistoryEntry {
  roundNumber: number;
  winnerName: string;
  finishType: string;
  results: { playerName: string; roundPenalty: number; totalPenalty: number }[];
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isSystem?: boolean;
}

export interface GameState {
  status: 'waiting' | 'playing' | 'round_ended' | 'game_over';
  roomCode: string;
  hostId: string;
  settings: RoomSettings;
  players: Player[];
  deckCount: number;
  discardPiles: { [seatIndex: number]: Tile[] };
  lastDiscard: { tile: Tile; seatIndex: number } | null;
  lastDiscardIsProcessable?: boolean;
  processableClaimedBy?: string | null;
  indicatorTile: Tile | null;
  okeyTile: Tile | null;
  tableMelds: Meld[];
  turn: TurnState;
  roundNumber: number;
  turnCount: number; // Total turn transitions in current round (0, 1, 2, 3 = rotation 1)
  lastRoundResult: RoundResult | null;
  history: MatchHistoryEntry[];
}
