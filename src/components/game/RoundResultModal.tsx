'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Download, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { RoundResult } from '../../types/okey';
import { soundManager } from '../../lib/sound';

interface RoundResultModalProps {
  isOpen: boolean;
  roundResult: RoundResult | null;
  isHost: boolean;
  isGameOver: boolean;
  onNextRound: () => void;
}

export default function RoundResultModal({
  isOpen,
  roundResult,
  isHost,
  isGameOver,
  onNextRound,
}: RoundResultModalProps) {
  if (!isOpen || !roundResult) return null;

  // Find lowest total score player to highlight in green
  const lowestTotalScore = Math.min(...roundResult.results.map(r => r.totalPenalty));

  const exportCSV = () => {
    soundManager.playButtonClick();
    const headers = ['Oyuncu', 'Açtı mı?', 'Bitirdi mi?', 'Eldeki Taş Puanı', 'Özel Ceza', 'Çarpan', 'El Cezası', 'Toplam Ceza'];
    const rows = roundResult.results.map(r => [
      r.playerName,
      r.hasOpened ? 'Evet' : 'Hayır',
      r.hasFinished ? 'Evet' : 'Hayır',
      r.handValue,
      r.specialPenalty,
      `x${r.multiplier}`,
      r.roundPenalty,
      r.totalPenalty,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `101_okey_skor_el_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-3xl glass-panel p-6 rounded-3xl border border-white/20 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        >
          {/* Header Banner */}
          <div className="text-center pb-4 border-b border-white/10 mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Trophy className="w-4 h-4" /> {isGameOver ? 'OYUN BİTTİ - MAÇ SONUCU' : 'EL BİTTİ - SKOR TABLOSU'}
            </div>
            <h2 className="text-2xl font-black text-white">
              {roundResult.winnerName ? `${roundResult.winnerName} Eli Kazandı!` : 'Berabere Bitti!'}
            </h2>
            <p className="text-slate-400 text-xs mt-1 capitalize">
              Bitiş Türü: {roundResult.finishType}
            </p>
          </div>

          {/* Tabular Score Breakdown */}
          <div className="overflow-x-auto flex-1 mb-6">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="p-3">Oyuncu</th>
                  <th className="p-3 text-center">Açtı mı?</th>
                  <th className="p-3 text-center">Bitirdi mi?</th>
                  <th className="p-3 text-right">Eldeki Taş</th>
                  <th className="p-3 text-right">Özel Ceza</th>
                  <th className="p-3 text-center">Çarpan</th>
                  <th className="p-3 text-right font-bold text-amber-400">Bu El</th>
                  <th className="p-3 text-right font-bold text-emerald-400">Toplam Ceza</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {roundResult.results.map((res) => {
                  const isLowest = res.totalPenalty === lowestTotalScore;
                  return (
                    <tr
                      key={res.playerId}
                      className={`transition-colors ${
                        isLowest ? 'bg-emerald-500/10 font-bold' : 'hover:bg-slate-900/50'
                      }`}
                    >
                      <td className="p-3 flex items-center gap-2">
                        <span className={`font-bold ${isLowest ? 'text-emerald-400' : 'text-white'}`}>
                          {res.playerName}
                        </span>
                        {isLowest && (
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/40">
                            LİDER ★
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold ${res.hasOpened ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {res.hasOpened ? 'Evet' : 'Hayır'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold ${res.hasFinished ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                          {res.hasFinished ? 'Evet' : 'Hayır'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono">{res.handValue}</td>
                      <td className="p-3 text-right font-mono text-amber-400">{res.specialPenalty}</td>
                      <td className="p-3 text-center font-mono text-purple-400">x{res.multiplier}</td>
                      <td className="p-3 text-right font-mono font-bold text-amber-400">+{res.roundPenalty}</td>
                      <td className="p-3 text-right font-mono font-black text-emerald-400 text-sm">
                        {res.totalPenalty}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
            <button
              onClick={exportCSV}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-amber-400" /> Skorları CSV Olarak İndir
            </button>

            {isHost && (
              <button
                onClick={() => { soundManager.playButtonClick(); onNextRound(); }}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm transition-all shadow-lg flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> {isGameOver ? 'Yeni Maç Başlat' : 'Sonraki El'}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
