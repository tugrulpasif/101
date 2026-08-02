'use client';

import React, { useState, useEffect } from 'react';
import TileComponent from './TileComponent';
import PlayerOpenedMelds from './PlayerOpenedMelds';
import PlayerDiscardZone from './PlayerDiscardZone';
import { Tile, Meld } from '../../types/okey';
import { soundManager } from '../../lib/sound';
import { sortHandByRuns, sortHandBySets, sortHandByPairs, formatHandToRack } from '../../server/engine/gameLogic';
import { autoPartitionTilesIntoMelds, extractPairsFromTiles } from '../../server/engine/validator';
import { Sparkles, Layers, Users, Trash2, CheckCircle2, RotateCcw, Undo, Zap } from 'lucide-react';

interface TileRackProps {
  hand: Tile[];
  myMelds: Meld[];
  myDiscardPile: Tile[];
  isMyTurn: boolean;
  hasDrawn: boolean;
  hasOpened: boolean;
  drewFromDiscard?: boolean;
  openingLimit: number;
  okeyRef?: Tile;
  onDiscardTile: (tileId: string) => void;
  onOpenMelds: (melds: Tile[][]) => void;
  onCollectMelds?: () => void;
  onReturnDiscard?: () => void;
  onAddTileToMeld?: (tileId: string, meldId: string) => void;
  onSelectTileId?: (tileId: string | null) => void;
}

export default function TileRack({
  hand,
  myMelds,
  myDiscardPile,
  isMyTurn,
  hasDrawn,
  hasOpened,
  drewFromDiscard = false,
  openingLimit,
  okeyRef = { id: 'temp', color: 'red', number: 1 },
  onDiscardTile,
  onOpenMelds,
  onCollectMelds,
  onReturnDiscard,
  onAddTileToMeld,
  onSelectTileId,
}: TileRackProps) {
  // 30 fixed rack slots (2 rows of 15)
  const [rackSlots, setRackSlots] = useState<(Tile | null)[]>(new Array(30).fill(null));
  // Multi-selection array of selected slot indices
  const [selectedSlotIndices, setSelectedSlotIndices] = useState<number[]>([]);
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null);

  // Notify parent of selected tile ID
  useEffect(() => {
    if (onSelectTileId) {
      if (selectedSlotIndices.length === 1) {
        const selectedTile = rackSlots[selectedSlotIndices[0]];
        onSelectTileId(selectedTile ? selectedTile.id : null);
      } else {
        onSelectTileId(null);
      }
    }
  }, [selectedSlotIndices, rackSlots, onSelectTileId]);

  // Synchronize server hand into 30 slots WITHOUT resetting user's custom arrangement
  useEffect(() => {
    setRackSlots(prevSlots => {
      const serverHandIds = new Set(hand.map(t => t.id));
      const nextSlots = [...prevSlots];

      // 1. Remove tiles no longer in server hand
      for (let i = 0; i < 30; i++) {
        if (nextSlots[i] && !serverHandIds.has(nextSlots[i]!.id)) {
          nextSlots[i] = null;
        }
      }

      // 2. Add newly drawn tiles into first empty null slot
      const currentTileIds = new Set(nextSlots.filter(Boolean).map(t => t!.id));
      const newlyDrawn = hand.filter(t => !currentTileIds.has(t.id));

      for (const tile of newlyDrawn) {
        const emptyIdx = nextSlots.findIndex(slot => slot === null);
        if (emptyIdx !== -1) {
          nextSlots[emptyIdx] = tile;
        }
      }

      return nextSlots;
    });
  }, [hand]);

  // Selected tiles
  const getSelectedTiles = (): Tile[] => {
    return selectedSlotIndices
      .map(idx => rackSlots[idx])
      .filter((t): t is Tile => t !== null);
  };

  const handleSlotClick = (slotIdx: number) => {
    soundManager.playButtonClick();

    const clickedTile = rackSlots[slotIdx];

    if (clickedTile !== null) {
      // Toggle selection for multi-selection
      setSelectedSlotIndices(prev =>
        prev.includes(slotIdx) ? prev.filter(i => i !== slotIdx) : [...prev, slotIdx]
      );
    } else {
      // Clicked an EMPTY slot: If exactly 1 tile is selected, move it to this empty slot!
      if (selectedSlotIndices.length === 1) {
        const srcIdx = selectedSlotIndices[0];
        const nextSlots = [...rackSlots];
        nextSlots[slotIdx] = nextSlots[srcIdx];
        nextSlots[srcIdx] = null;

        setRackSlots(nextSlots);
        setSelectedSlotIndices([]);
      }
    }
  };

  const handleDragStart = (slotIdx: number) => {
    setDraggedSlotIndex(slotIdx);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropSlot = (targetSlotIdx: number) => {
    if (draggedSlotIndex === null || draggedSlotIndex === targetSlotIdx) return;
    soundManager.playButtonClick();

    const nextSlots = [...rackSlots];
    const temp = nextSlots[draggedSlotIndex];
    nextSlots[draggedSlotIndex] = nextSlots[targetSlotIdx];
    nextSlots[targetSlotIdx] = temp;

    setRackSlots(nextSlots);
    setDraggedSlotIndex(null);
    setSelectedSlotIndices([]);
  };

  // Auto-Sort Hand by Runs (Seri Diz)
  const handleSortRuns = () => {
    soundManager.playButtonClick();
    const sorted = sortHandByRuns(hand);
    const newSlots = new Array(30).fill(null);
    for (let i = 0; i < Math.min(sorted.length, 30); i++) {
      newSlots[i] = sorted[i];
    }
    setRackSlots(newSlots);
    setSelectedSlotIndices([]);
  };

  // Auto-Sort Hand by Sets (Takım Diz)
  const handleSortSets = () => {
    soundManager.playButtonClick();
    const sorted = sortHandBySets(hand);
    const newSlots = new Array(30).fill(null);
    for (let i = 0; i < Math.min(sorted.length, 30); i++) {
      newSlots[i] = sorted[i];
    }
    setRackSlots(newSlots);
    setSelectedSlotIndices([]);
  };

  const handleDiscardSlot = (slotIdx: number) => {
    if (!isMyTurn || !hasDrawn || !rackSlots[slotIdx]) return;
    const tile = rackSlots[slotIdx]!;
    soundManager.playDiscardTile();
    onDiscardTile(tile.id);
    setSelectedSlotIndices([]);
  };

  const handleDiscardSelected = () => {
    if (selectedSlotIndices.length !== 1 || !isMyTurn || !hasDrawn) return;
    handleDiscardSlot(selectedSlotIndices[0]);
  };

  const handleOpenSelectedAsMeld = () => {
    if (!isMyTurn || !hasDrawn) return;
    const selectedTiles = getSelectedTiles();
    if (selectedTiles.length === 0) return;

    soundManager.playButtonClick();
    const autoGrouped = autoPartitionTilesIntoMelds(selectedTiles, okeyRef);
    if (autoGrouped.length > 0) {
      onOpenMelds(autoGrouped);
    } else {
      onOpenMelds([selectedTiles]);
    }
    setSelectedSlotIndices([]);
  };

  const handleSortPairs = () => {
    soundManager.playButtonClick();
    const sorted = sortHandByPairs(hand);
    const newRack = formatHandToRack(sorted);
    setRackSlots(newRack);
    setSelectedSlotIndices([]);
  };

  const handleAutoOpenHand = () => {
    if (!isMyTurn || !hasDrawn || hasOpened) return;
    soundManager.playButtonClick();
    const autoGrouped = autoPartitionTilesIntoMelds(hand, okeyRef);
    if (autoGrouped.length > 0) {
      onOpenMelds(autoGrouped);
    }
    setSelectedSlotIndices([]);
  };

  const handleAutoOpenPairs = () => {
    if (!isMyTurn || !hasDrawn || hasOpened) return;
    soundManager.playButtonClick();
    const pairs = extractPairsFromTiles(hand, okeyRef);
    if (pairs.length >= 5) {
      onOpenMelds(pairs);
    } else {
      soundManager.playButtonClick();
      alert(`Elinizde sadece ${pairs.length} çift var. Çift açmak için en az 5 çift gereklidir!`);
    }
    setSelectedSlotIndices([]);
  };

  // Split into 2 rows of 15 slots
  const row1Slots = rackSlots.slice(0, 15);
  const row2Slots = rackSlots.slice(15, 30);

  const canProcessTile = isMyTurn && hasDrawn && hasOpened && selectedSlotIndices.length === 1;
  const selectedTile = canProcessTile ? rackSlots[selectedSlotIndices[0]] : null;

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Player's opened melds displayed directly above rack */}
      <PlayerOpenedMelds
        melds={myMelds}
        align="center"
        canProcessTile={canProcessTile}
        onAddTileToMeld={(meldId) => {
          if (selectedTile && onAddTileToMeld) {
            onAddTileToMeld(selectedTile.id, meldId);
            setSelectedSlotIndices([]);
          }
        }}
      />

      {/* Main Centered Wooden Rack */}
      <div className="w-full max-w-4xl bg-slate-900/90 border-2 border-amber-600/70 p-3.5 rounded-3xl shadow-2xl space-y-3">
        {/* Controls & Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSortRuns}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Seri Diz
            </button>
            <button
              onClick={handleSortSets}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" /> Takım Diz
            </button>
            <button
              onClick={handleSortPairs}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-400 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" /> Çift Diz
            </button>

            {isMyTurn && hasDrawn && !hasOpened && (
              <>
                <button
                  onClick={handleAutoOpenHand}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 animate-pulse"
                >
                  <Zap className="w-4 h-4 fill-current text-slate-950" /> Oto El Aç (34+)
                </button>

                <button
                  onClick={handleAutoOpenPairs}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4" /> Oto Çift Aç (5 Çift)
                </button>
              </>
            )}
          </div>

          {/* Turn Actions */}
          <div className="flex items-center gap-2">
            {isMyTurn && hasDrawn && drewFromDiscard && onReturnDiscard && (
              <button
                onClick={() => { soundManager.playButtonClick(); onReturnDiscard(); }}
                className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1"
                title="Yandan aldığınız taşı geri bırakın"
              >
                <Undo className="w-3.5 h-3.5" /> Geri Bırak
              </button>
            )}

            {isMyTurn && hasOpened && onCollectMelds && (
              <button
                onClick={() => { soundManager.playButtonClick(); onCollectMelds(); }}
                className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-bold transition-all flex items-center gap-1"
                title="İndirdiğiniz taşları toplayın (+101 ceza alırsınız)"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Topla (+101 Ceza)
              </button>
            )}

            {isMyTurn && hasDrawn && selectedSlotIndices.length >= 1 && (
              <button
                onClick={handleOpenSelectedAsMeld}
                className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold transition-all shadow-md flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> {hasOpened ? 'Yeni Peri Masaya Ekle' : 'Seçilenleri Masaya Aç'}
              </button>
            )}

            {isMyTurn && hasDrawn && selectedSlotIndices.length === 1 && (
              <button
                onClick={handleDiscardSelected}
                className="px-4 py-1.5 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-1 animate-pulse"
              >
                <Trash2 className="w-3.5 h-3.5" /> Taş At (Sağ Cebe)
              </button>
            )}
          </div>
        </div>

        {/* Centered Wooden 30-Slot Board Container */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 bg-amber-950/60 p-3 rounded-2xl border border-amber-900/80 space-y-2.5 shadow-inner">
            {/* Row 1 (15 slots) */}
            <div className="flex gap-1.5 items-center justify-center">
              {row1Slots.map((tile, idx) => {
                const globalIdx = idx;
                return (
                  <div
                    key={globalIdx}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropSlot(globalIdx)}
                    onClick={() => handleSlotClick(globalIdx)}
                    className="w-9 h-13 rounded-lg flex items-center justify-center transition-all"
                  >
                    {tile ? (
                      <TileComponent
                        tile={tile}
                        isSelected={selectedSlotIndices.includes(globalIdx)}
                        onDoubleClick={() => handleDiscardSlot(globalIdx)}
                        onDragStart={() => handleDragStart(globalIdx)}
                        size="md"
                      />
                    ) : (
                      <div className="w-9 h-13 rounded-lg border border-dashed border-amber-800/40 bg-amber-950/30 flex items-center justify-center text-[10px] text-amber-900/50 font-bold hover:border-amber-500/50 cursor-pointer">
                        •
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Row 2 (15 slots) */}
            <div className="flex gap-1.5 items-center justify-center border-t border-amber-900/40 pt-2">
              {row2Slots.map((tile, idx) => {
                const globalIdx = idx + 15;
                return (
                  <div
                    key={globalIdx}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDropSlot(globalIdx)}
                    onClick={() => handleSlotClick(globalIdx)}
                    className="w-9 h-13 rounded-lg flex items-center justify-center transition-all"
                  >
                    {tile ? (
                      <TileComponent
                        tile={tile}
                        isSelected={selectedSlotIndices.includes(globalIdx)}
                        onDoubleClick={() => handleDiscardSlot(globalIdx)}
                        onDragStart={() => handleDragStart(globalIdx)}
                        size="md"
                      />
                    ) : (
                      <div className="w-9 h-13 rounded-lg border border-dashed border-amber-800/40 bg-amber-950/30 flex items-center justify-center text-[10px] text-amber-900/50 font-bold hover:border-amber-500/50 cursor-pointer">
                        •
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Discard Zone for bottom player */}
          <div onClick={handleDiscardSelected} className="cursor-pointer">
            <PlayerDiscardZone
              discardPile={myDiscardPile}
              canDraw={false}
              onDrawDiscard={() => {}}
              label="Sağ Cebiniz"
              isSelf={true}
              onDropDiscard={handleDiscardSelected}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
