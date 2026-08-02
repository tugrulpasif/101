'use client';

import React from 'react';
import TileComponent from './TileComponent';
import { Meld, Tile } from '../../types/okey';
import { soundManager } from '../../lib/sound';
import { Plus } from 'lucide-react';

interface PlayerOpenedMeldsProps {
  melds: Meld[];
  align?: 'center' | 'left' | 'right';
  canProcessTile?: boolean;
  onAddTileToMeld?: (meldId: string) => void;
}

export default function PlayerOpenedMelds({
  melds,
  align = 'center',
  canProcessTile = false,
  onAddTileToMeld,
}: PlayerOpenedMeldsProps) {
  if (!melds || melds.length === 0) return null;

  const alignmentClass = {
    center: 'justify-center',
    left: 'justify-start',
    right: 'justify-end',
  }[align];

  return (
    <div className={`flex flex-wrap gap-2 ${alignmentClass} p-1.5 rounded-xl bg-slate-950/60 border border-emerald-500/30 backdrop-blur-sm max-w-full z-10`}>
      {melds.map((meld) => (
        <div
          key={meld.id}
          className="flex gap-0.5 items-center p-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 shadow-md relative group"
        >
          {meld.tiles.map((tile, idx) => (
            <TileComponent key={`${tile.id}_${idx}`} tile={tile} size="sm" />
          ))}

          {/* İşle (Add Tile to Meld) Button when player has selected a tile and opened hand */}
          {canProcessTile && onAddTileToMeld && (
            <button
              onClick={() => {
                soundManager.playButtonClick();
                onAddTileToMeld(meld.id);
              }}
              className="ml-1.5 px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] shadow-lg animate-bounce flex items-center gap-0.5 cursor-pointer z-20"
              title="Seçilen taşı bu perine işle"
            >
              <Plus className="w-3 h-3 stroke-[3]" /> İşle
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
