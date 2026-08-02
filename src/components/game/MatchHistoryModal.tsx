'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, Trophy } from 'lucide-react';
import { MatchHistoryEntry } from '../../types/okey';
import { soundManager } from '../../lib/sound';

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: MatchHistoryEntry[];
}

export default function MatchHistoryModal({ isOpen, onClose, history }: MatchHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg glass-panel p-6 rounded-3xl border border-white/20 shadow-2xl overflow-y-auto max-h-[85vh]"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-lg">
              <History className="w-5 h-5" /> Oyun Geçmişi & Skorlar
            </div>
            <button
              onClick={() => { soundManager.playButtonClick(); onClose(); }}
              className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Henüz tamamlanan el yok.
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.roundNumber} className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                    <span className="font-bold text-amber-400">Tur #{entry.roundNumber}</span>
                    <span className="text-slate-300">Kazanan: <strong className="text-emerald-400">{entry.winnerName}</strong></span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {entry.results.map((res, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-300">
                        <span>{res.playerName}</span>
                        <div className="space-x-3 font-mono">
                          <span className="text-amber-400">+{res.roundPenalty}</span>
                          <span className="text-emerald-400 font-bold">({res.totalPenalty})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
