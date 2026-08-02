'use client';

import React from 'react';
import { Player, Tile, Meld } from '../../types/okey';
import PlayerOpenedMelds from './PlayerOpenedMelds';
import PlayerDiscardZone from './PlayerDiscardZone';
import { User, Shield, Layers } from 'lucide-react';

interface OpponentRackProps {
  player: Player;
  isCurrentTurn: boolean;
  position: 'top' | 'left' | 'right';
  discardPile: Tile[];
  playerMelds: Meld[];
  canDrawDiscard: boolean;
  canProcessTile?: boolean;
  onDrawDiscard: () => void;
  onAddTileToMeld?: (meldId: string) => void;
}

export default function OpponentRack({
  player,
  isCurrentTurn,
  position,
  discardPile,
  playerMelds,
  canDrawDiscard,
  canProcessTile = false,
  onDrawDiscard,
  onAddTileToMeld,
}: OpponentRackProps) {
  const handCount = (player as any).handCount ?? 21;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Opened Melds displayed in front of this player */}
      <PlayerOpenedMelds
        melds={playerMelds}
        align="center"
        canProcessTile={canProcessTile}
        onAddTileToMeld={onAddTileToMeld}
      />

      <div className="flex items-center gap-3">
        {/* Main Opponent Badge */}
        <div
          className={`glass-panel p-3 rounded-2xl border transition-all flex items-center gap-3 ${
            isCurrentTurn
              ? 'border-amber-400 bg-amber-500/10 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400 animate-pulse'
              : 'border-white/10 bg-slate-900/80'
          }`}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 font-bold text-base">
              {player.isBot ? '🤖' : <User className="w-5 h-5" />}
            </div>
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                player.isConnected ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-white text-xs truncate max-w-[90px]">{player.name}</span>
              {player.isHost && <Shield className="w-3 h-3 text-amber-400" />}
            </div>

            <div className="flex items-center gap-2 mt-1 text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" /> {handCount} taş
              </span>
              <span className={`px-1.5 py-0.2 rounded font-bold ${player.hasOpened ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                {player.hasOpened ? 'AÇTI' : 'AÇMADI'}
              </span>
            </div>
          </div>
        </div>

        {/* Discard Pile Zone to the right of opponent */}
        <PlayerDiscardZone
          discardPile={discardPile}
          canDraw={canDrawDiscard}
          onDrawDiscard={onDrawDiscard}
          label="Sağ Cebi"
        />
      </div>
    </div>
  );
}
