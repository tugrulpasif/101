'use client';

import React from 'react';
import TileComponent from './TileComponent';
import { Meld } from '../../types/okey';

interface TableMeldsProps {
  melds: Meld[];
}

export default function TableMelds({ melds }: TableMeldsProps) {
  if (!melds || melds.length === 0) {
    return (
      <div className="w-full text-center py-4 text-xs font-semibold text-emerald-300/40 italic">
        Masada henüz açılmış per yok.
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/60 p-4 rounded-2xl border border-white/10 max-h-48 overflow-y-auto space-y-3">
      <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
        Masadaki Perler (Açılan Taşlar)
      </div>

      <div className="flex flex-wrap gap-4">
        {melds.map((meld) => (
          <div
            key={meld.id}
            className="bg-slate-950/80 p-2 rounded-xl border border-slate-800 flex flex-col gap-1 shadow-md"
          >
            <div className="text-[10px] font-bold text-amber-400 truncate max-w-[120px]">
              {meld.ownerName}
            </div>

            <div className="flex gap-1 items-center">
              {meld.tiles.map((tile, idx) => (
                <TileComponent key={`${tile.id}_${idx}`} tile={tile} size="sm" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
