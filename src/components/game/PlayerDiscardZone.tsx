'use client';

import React from 'react';
import TileComponent from './TileComponent';
import { Tile } from '../../types/okey';
import { soundManager } from '../../lib/sound';

interface PlayerDiscardZoneProps {
  discardPile: Tile[];
  canDraw: boolean;
  onDrawDiscard: () => void;
  label?: string;
  isSelf?: boolean;
  onDropDiscard?: () => void;
}

export default function PlayerDiscardZone({
  discardPile,
  canDraw,
  onDrawDiscard,
  label = 'Taş Cebi',
  isSelf = false,
  onDropDiscard,
}: PlayerDiscardZoneProps) {
  const topTile = discardPile && discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  const handleDraw = () => {
    if (!canDraw || !topTile) return;
    soundManager.playDrawTile();
    onDrawDiscard();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isSelf && onDropDiscard) {
      onDropDiscard();
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`flex flex-col items-center gap-1 p-2 rounded-2xl border transition-all ${
        canDraw && topTile
          ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400 scale-105 cursor-pointer animate-pulse'
          : 'bg-slate-900/70 border-slate-800'
      }`}
    >
      <span className="text-[10px] font-bold text-amber-300/80">{label}</span>

      {topTile ? (
        <div onClick={handleDraw} className="relative cursor-pointer hover:scale-105 transition-transform">
          <TileComponent tile={topTile} size="md" />
          {canDraw && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow">
              ↓
            </div>
          )}
        </div>
      ) : (
        <div className="w-9 h-13 rounded-lg border-2 border-dashed border-slate-700/60 flex items-center justify-center text-[10px] text-slate-600 font-bold">
          Boş
        </div>
      )}
    </div>
  );
}
