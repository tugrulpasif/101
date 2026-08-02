'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Check } from 'lucide-react';
import { RoomSettings, BotDifficulty } from '../types/okey';
import { soundManager } from '../lib/sound';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (settings: RoomSettings) => void;
}

export default function CreateRoomModal({ isOpen, onClose, onCreate }: CreateRoomModalProps) {
  const [openingLimit, setOpeningLimit] = useState<34 | 51 | 71 | 101>(34);
  const [doubling, setDoubling] = useState(true);
  const [showOkey, setShowOkey] = useState(true);
  const [allowBots, setAllowBots] = useState(true);
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [startingPenalty, setStartingPenalty] = useState<0 | 101 | 202>(0);
  const [maxPenalty, setMaxPenalty] = useState<501 | 701 | 1001>(701);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundManager.playButtonClick();
    onCreate({
      openingLimit,
      doubling,
      showOkey,
      minPlayers: 2,
      maxPlayers: 4,
      allowBots,
      botDifficulty,
      startingPenalty,
      maxPenalty,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-white/20 shadow-2xl overflow-y-auto max-h-[90vh]"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <Settings className="w-5 h-5" /> Yeni Masa Oluştur
            </div>
            <button
              onClick={() => { soundManager.playButtonClick(); onClose(); }}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Açılış Limiti */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Açılış Limiti (Minimum Per Puanı)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[34, 51, 71, 101].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setOpeningLimit(val as any)}
                    className={`py-2.5 rounded-xl font-bold text-sm transition-all border ${
                      openingLimit === val
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900/60 text-slate-300 border-slate-700 hover:border-slate-500'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Katlamalı Oyun & Okey Gösterimi Toggles */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Katlamalı Oyun</div>
                  <div className="text-xs text-slate-400">Ceza çarpanları ×2</div>
                </div>
                <button
                  type="button"
                  onClick={() => setDoubling(!doubling)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors ${doubling ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${doubling ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Okey Gösterimi</div>
                  <div className="text-xs text-slate-400">Masada okey taşını göster</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOkey(!showOkey)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors ${showOkey ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${showOkey ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            {/* Bot Ayarları */}
            <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Botlara İzin Ver</div>
                  <div className="text-xs text-slate-400">Eksik koltukları bot doldurabilsin</div>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowBots(!allowBots)}
                  className={`w-12 h-7 rounded-full p-1 transition-colors ${allowBots ? 'bg-emerald-500' : 'bg-slate-700'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${allowBots ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              {allowBots && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Bot Zorluk Seviyesi
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'easy', label: 'Kolay 🟢' },
                      { key: 'medium', label: 'Orta 🟡' },
                      { key: 'hard', label: 'Zor 🔴' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setBotDifficulty(item.key as any)}
                        className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                          botDifficulty === item.key
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Penalties & Elimination Limit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Başlangıç Cezası
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[0, 101, 202].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setStartingPenalty(val as any)}
                      className={`py-2 rounded-xl text-xs font-bold border ${
                        startingPenalty === val
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900/60 text-slate-300 border-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Elenme Puanı (Max)
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {[501, 701, 1001].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMaxPenalty(val as any)}
                      className={`py-2 rounded-xl text-xs font-bold border ${
                        maxPenalty === val
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900/60 text-slate-300 border-slate-700'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 text-sm"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg text-sm flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Masayı Oluştur
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
