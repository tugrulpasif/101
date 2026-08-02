'use client';

import React from 'react';
import TileComponent from './TileComponent';
import { Tile } from '../../types/okey';
import { soundManager } from '../../lib/sound';
import { Layers, ArrowDownCircle, Flame } from 'lucide-react';

interface CenterBoardProps {
  deckCount: number;
  indicatorTile: Tile | null;
  okeyTile: Tile | null;
  isMyTurn: boolean;
  hasDrawn: boolean;
  lastDiscardIsProcessable?: boolean;
  lastDiscardedBySelf?: boolean;
  onDrawDeck: () => void;
  onClaimProcessable?: () => void;
}

export default function CenterBoard({
  deckCount,
  indicatorTile,
  okeyTile,
  isMyTurn,
  hasDrawn,
  lastDiscardIsProcessable = false,
  lastDiscardedBySelf = false,
  onDrawDeck,
  onClaimProcessable,
}: CenterBoardProps) {

  const handleDraw = () => {
    if (!isMyTurn || hasDrawn) return;
    soundManager.playDrawTile();
    onDrawDeck();
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-3xl bg-emerald-950/40 border border-emerald-500/20 shadow-2xl relative">
      <div className="flex items-center justify-center gap-6">
        {/* Closed Deck Stack */}
        <div className="flex flex-col items-center gap-1.5">
          <div
            onClick={handleDraw}
            className={`w-14 h-20 rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 border-2 border-amber-500/60 shadow-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
              isMyTurn && !hasDrawn ? 'ring-4 ring-amber-400 scale-105 animate-bounce' : 'hover:scale-105'
            }`}
          >
            <Layers className="w-6 h-6 text-amber-300 mb-1" />
            <span className="text-amber-200 text-xs font-black">{deckCount}</span>
          </div>
          <span className="text-[11px] font-bold text-amber-300">Kapalı Deste</span>
        </div>

        {/* Indicator & Okey Tile Badge */}
        {indicatorTile && (
          <div className="flex flex-col items-center gap-1.5">
            <div className="relative">
              <TileComponent tile={indicatorTile} size="lg" />
              {okeyTile && (
                <div className="absolute -bottom-2 -right-2 bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded-full text-[9px] font-black shadow-md border border-amber-300">
                  OKEY
                </div>
              )}
            </div>
            <span className="text-[11px] font-bold text-amber-300">Gösterge</span>
          </div>
        )}
      </div>

      {/* Claim Processable Tile Button (İşlek Taş Cezası Ver) */}
      {lastDiscardIsProcessable && !lastDiscardedBySelf && onClaimProcessable && (
        <button
          onClick={() => { soundManager.playButtonClick(); onClaimProcessable(); }}
          className="mt-3 px-5 py-2 rounded-2xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs shadow-2xl border border-red-400 animate-bounce flex items-center gap-2 cursor-pointer z-30"
        >
          <Flame className="w-4 h-4 fill-current text-yellow-300 animate-pulse" />
          🔥 İŞLEK TAŞ! (+101 Ceza Ver)
        </button>
      )}

      {/* Draw Hint Prompt */}
      {isMyTurn && !hasDrawn && !lastDiscardIsProcessable && (
        <div className="mt-3 bg-amber-500 text-slate-950 px-4 py-1 rounded-full font-black text-xs shadow-lg animate-pulse flex items-center gap-1.5">
          <ArrowDownCircle className="w-4 h-4" /> Deste Çek veya Yandaki Taşı Al
        </div>
      )}
    </div>
  );
}
