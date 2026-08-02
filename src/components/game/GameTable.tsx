import React, { useState } from 'react';
import { GameState, Player, Tile, Meld, ChatMessage } from '../../types/okey';
import CenterBoard from './CenterBoard';
import TileRack from './TileRack';
import OpponentRack from './OpponentRack';
import RoundResultModal from './RoundResultModal';
import MatchHistoryModal from './MatchHistoryModal';
import ChatBox from '../ChatBox';
import { soundManager } from '../../lib/sound';
import { Volume2, VolumeX, Maximize2, History, ArrowLeft, MessageSquare, X } from 'lucide-react';

interface GameTableProps {
  gameState: GameState;
  currentSocketId: string;
  chatMessages: ChatMessage[];
  onDrawTile: (source: 'deck' | 'discard') => void;
  onDiscardTile: (tileId: string) => void;
  onOpenMelds: (melds: Tile[][]) => void;
  onCollectMelds: () => void;
  onReturnDiscard: () => void;
  onClaimProcessable: () => void;
  onAddTileToMeld: (tileId: string, meldId: string) => void;
  onSendMessage: (text: string) => void;
  onRestartMatch: () => void;
  onLeaveRoom: () => void;
}

export default function GameTable({
  gameState,
  currentSocketId,
  chatMessages,
  onDrawTile,
  onDiscardTile,
  onOpenMelds,
  onCollectMelds,
  onReturnDiscard,
  onClaimProcessable,
  onAddTileToMeld,
  onSendMessage,
  onRestartMatch,
  onLeaveRoom,
}: GameTableProps) {
  const [isMuted, setIsMuted] = useState(soundManager.isMuted);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);

  const selfPlayer = gameState.players.find(p => p.id === currentSocketId);
  const isHost = gameState.hostId === currentSocketId;
  const currentSeat = gameState.turn.currentSeat;
  const isMyTurn = selfPlayer ? selfPlayer.seatIndex === currentSeat : false;
  const hasDrawn = gameState.turn.hasDrawn;
  const drewFromDiscard = (selfPlayer as any)?._drewFromDiscard || false;
  const currentHand = selfPlayer?.hand || [];

  const toggleMute = () => {
    soundManager.isMuted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  // Seating relative to current player
  const mySeat = selfPlayer ? selfPlayer.seatIndex : 0;
  const getOpponentAtRelative = (offset: number) => {
    const seatIdx = (mySeat + offset) % 4;
    return gameState.players.find(p => p.seatIndex === seatIdx);
  };

  const rightOpponent = getOpponentAtRelative(1);
  const topOpponent = getOpponentAtRelative(2);
  const leftOpponent = getOpponentAtRelative(3);

  // Helper to get player's opened melds
  const getMeldsForPlayer = (playerId?: string) => {
    if (!playerId) return [];
    return gameState.tableMelds.filter(m => m.ownerId === playerId);
  };

  // Helper to get player's discard pile
  const getDiscardPileForSeat = (seatIdx?: number) => {
    if (seatIdx === undefined) return [];
    return gameState.discardPiles[seatIdx] || [];
  };

  // Can draw from left opponent's discard pile if it's my turn and I haven't drawn
  const canDrawFromLeftDiscard = isMyTurn && !hasDrawn && leftOpponent !== undefined && getDiscardPileForSeat(leftOpponent.seatIndex).length > 0;

  // Can process tile on table if my turn, I've drawn, I have opened my hand, and 1 tile is selected in rack
  const canProcessTileOnTable = isMyTurn && hasDrawn && (selfPlayer?.hasOpened || false) && !!selectedTileId;

  const handleProcessTileToMeld = (meldId: string) => {
    if (selectedTileId) {
      soundManager.playButtonClick();
      onAddTileToMeld(selectedTileId, meldId);
      setSelectedTileId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between felt-background relative overflow-hidden select-none">
      {/* Top Navigation Header */}
      <header className="px-4 py-3 bg-slate-950/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { soundManager.playButtonClick(); onLeaveRoom(); }}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Odadan Çık"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-xs font-bold text-amber-400">34 Okey Masası | Oda: {gameState.roomCode}</div>
            <div className="text-[10px] text-slate-400">Tur #{gameState.roundNumber} | Limit: 34 (Yan Hesabı)</div>
          </div>
        </div>

        {/* Turn Banner Indicator */}
        <div className="flex items-center gap-2">
          {isMyTurn ? (
            <div className="px-4 py-1.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs shadow-lg animate-bounce flex items-center gap-1.5">
              ★ Sizin Sıranız!
            </div>
          ) : (
            <div className="px-4 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-semibold">
              Sıra: {gameState.players.find(p => p.seatIndex === currentSeat)?.name || '...'}
            </div>
          )}
        </div>

        {/* Header Tools Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { soundManager.playButtonClick(); setIsChatOpen(!isChatOpen); }}
            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all relative ${
              isChatOpen ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
            title="Sohbet / Bildirimler"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Sohbet</span>
            {chatMessages.length > 0 && !isChatOpen && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
            )}
          </button>
          <button
            onClick={() => { soundManager.playButtonClick(); setIsHistoryOpen(true); }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1"
            title="Geçmiş"
          >
            <History className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMute}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Ses"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Tam Ekran"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Floating Chat Box Overlay */}
      {isChatOpen && (
        <div className="fixed bottom-20 right-4 z-40 w-80 max-w-[calc(100vw-2rem)] h-96 glass-panel rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4">
          <div className="p-3 bg-slate-950/90 border-b border-white/10 flex items-center justify-between">
            <span className="font-extrabold text-amber-400 text-xs flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Oyun İçi Sohbet & Ceza Bildirimleri
            </span>
            <button
              onClick={() => setIsChatOpen(false)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-hidden p-2">
            <ChatBox messages={chatMessages} onSendMessage={onSendMessage} />
          </div>
        </div>
      )}

      {/* Main Felt Table Field */}
      <main className="flex-1 relative flex flex-col justify-between p-4 max-w-6xl mx-auto w-full">
        {/* Top Opponent Slot */}
        <div className="flex justify-center items-center">
          {topOpponent && (
            <OpponentRack
              player={topOpponent}
              isCurrentTurn={topOpponent.seatIndex === currentSeat}
              position="top"
              discardPile={getDiscardPileForSeat(topOpponent.seatIndex)}
              playerMelds={getMeldsForPlayer(topOpponent.id)}
              canDrawDiscard={false}
              canProcessTile={canProcessTileOnTable}
              onDrawDiscard={() => {}}
              onAddTileToMeld={handleProcessTileToMeld}
            />
          )}
        </div>

        {/* Center Row (Left Opponent + Center Board + Right Opponent) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center my-auto">
          {/* Left Opponent */}
          <div className="hidden md:flex justify-start">
            {leftOpponent && (
              <OpponentRack
                player={leftOpponent}
                isCurrentTurn={leftOpponent.seatIndex === currentSeat}
                position="left"
                discardPile={getDiscardPileForSeat(leftOpponent.seatIndex)}
                playerMelds={getMeldsForPlayer(leftOpponent.id)}
                canDrawDiscard={canDrawFromLeftDiscard}
                canProcessTile={canProcessTileOnTable}
                onDrawDiscard={() => onDrawTile('discard')}
                onAddTileToMeld={handleProcessTileToMeld}
              />
            )}
          </div>

          {/* Center Board (Closed Deck + Indicator Tile + Processable Tile Alert) */}
          <div className="md:col-span-2 space-y-4">
            <CenterBoard
              deckCount={gameState.deckCount}
              indicatorTile={gameState.indicatorTile}
              okeyTile={gameState.okeyTile}
              isMyTurn={isMyTurn}
              hasDrawn={hasDrawn}
              lastDiscardIsProcessable={gameState.lastDiscardIsProcessable}
              lastDiscardedBySelf={gameState.lastDiscard ? gameState.lastDiscard.seatIndex === mySeat : false}
              onDrawDeck={() => onDrawTile('deck')}
              onClaimProcessable={onClaimProcessable}
            />
          </div>

          {/* Right Opponent */}
          <div className="hidden md:flex justify-end">
            {rightOpponent && (
              <OpponentRack
                player={rightOpponent}
                isCurrentTurn={rightOpponent.seatIndex === currentSeat}
                position="right"
                discardPile={getDiscardPileForSeat(rightOpponent.seatIndex)}
                playerMelds={getMeldsForPlayer(rightOpponent.id)}
                canDrawDiscard={false}
                canProcessTile={canProcessTileOnTable}
                onDrawDiscard={() => {}}
                onAddTileToMeld={handleProcessTileToMeld}
              />
            )}
          </div>
        </div>
      </main>

      {/* Bottom Rack Area for Current Player */}
      {selfPlayer && (
        <TileRack
          hand={currentHand}
          myMelds={getMeldsForPlayer(selfPlayer.id)}
          myDiscardPile={getDiscardPileForSeat(selfPlayer.seatIndex)}
          isMyTurn={isMyTurn}
          hasDrawn={hasDrawn}
          hasOpened={selfPlayer.hasOpened}
          drewFromDiscard={drewFromDiscard}
          openingLimit={gameState.settings.openingLimit}
          okeyRef={gameState.okeyTile || undefined}
          onDiscardTile={onDiscardTile}
          onOpenMelds={onOpenMelds}
          onCollectMelds={onCollectMelds}
          onReturnDiscard={onReturnDiscard}
          onAddTileToMeld={onAddTileToMeld}
          onSelectTileId={(tileId) => setSelectedTileId(tileId)}
        />
      )}

      {/* Modals */}
      <RoundResultModal
        isOpen={gameState.status === 'round_ended' || gameState.status === 'game_over'}
        roundResult={gameState.lastRoundResult}
        isHost={isHost}
        isGameOver={gameState.status === 'game_over'}
        onNextRound={onRestartMatch}
      />

      <MatchHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={gameState.history}
      />
    </div>
  );
}
