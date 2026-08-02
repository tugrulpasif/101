'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Play, UserPlus, UserMinus, Shield, Settings, Users, LogOut } from 'lucide-react';
import { Player, RoomSettings, ChatMessage } from '../types/okey';
import ChatBox from './ChatBox';
import { soundManager } from '../lib/sound';

interface RoomScreenProps {
  roomCode: string;
  hostId: string;
  currentSocketId: string;
  players: Player[];
  settings: RoomSettings;
  chatMessages: ChatMessage[];
  onToggleReady: () => void;
  onAddBot: () => void;
  onRemoveBot: (botId: string) => void;
  onStartGame: () => void;
  onSendMessage: (text: string) => void;
  onLeaveRoom: () => void;
}

export default function RoomScreen({
  roomCode,
  hostId,
  currentSocketId,
  players,
  settings,
  chatMessages,
  onToggleReady,
  onAddBot,
  onRemoveBot,
  onStartGame,
  onSendMessage,
  onLeaveRoom,
}: RoomScreenProps) {
  const [copied, setCopied] = useState(false);
  const isHost = hostId === currentSocketId;
  const selfPlayer = players.find(p => p.id === currentSocketId);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    soundManager.playButtonClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build 4 seat slots
  const seats = [0, 1, 2, 3].map(seatIdx => {
    return players.find(p => p.seatIndex === seatIdx) || null;
  });

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-6xl mx-auto">
      {/* Top Navigation */}
      <header className="flex flex-wrap items-center justify-between gap-4 glass-panel px-6 py-4 rounded-2xl mb-6 border border-white/10 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-slate-900/90 border border-amber-500/40 px-4 py-2 rounded-xl flex items-center gap-3">
            <span className="text-xs text-slate-400">Oda Kodu:</span>
            <span className="font-mono text-2xl font-black text-amber-400 tracking-widest">{roomCode}</span>
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-colors"
              title="Kopyala"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          {copied && <span className="text-xs text-emerald-400 font-semibold">Kopyalandı!</span>}
        </div>

        <button
          onClick={() => { soundManager.playButtonClick(); onLeaveRoom(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" /> Odadan Ayrıl
        </button>
      </header>

      <div className="grid lg:grid-cols-3 gap-6 flex-1">
        {/* Seats Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" /> Masadaki Oyuncular ({players.length}/4)
              </h2>
              {isHost && players.length < 4 && settings.allowBots && (
                <button
                  onClick={() => { soundManager.playButtonClick(); onAddBot(); }}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-400 text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" /> Bot Ekle
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {seats.map((player, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between h-36 ${
                    player
                      ? player.isHost
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-slate-900/80 border-slate-800'
                      : 'bg-slate-950/40 border-dashed border-slate-800 justify-center items-center'
                  }`}
                >
                  {player ? (
                    <>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${player.isConnected ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-red-500'}`} />
                          <span className="font-bold text-white text-base truncate max-w-[120px]">{player.name}</span>
                        </div>
                        {player.isHost && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase flex items-center gap-1">
                            <Shield className="w-3 h-3" /> Kurucu
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-auto">
                        <span className={`text-xs font-extrabold px-3 py-1 rounded-xl border ${
                          player.isReady
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}>
                          {player.isReady ? '✓ HAZIR' : 'BEKLİYOR'}
                        </span>

                        {isHost && player.isBot && (
                          <button
                            onClick={() => { soundManager.playButtonClick(); onRemoveBot(player.id); }}
                            className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-semibold flex items-center gap-1"
                            title="Botu Çıkar"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="text-slate-600 font-bold text-sm mb-1">Koltuk #{idx + 1}</div>
                      <div className="text-slate-500 text-xs">Boş Koltuk</div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Action Bar */}
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between gap-4">
              <button
                onClick={() => { soundManager.playButtonClick(); onToggleReady(); }}
                className={`px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg flex items-center gap-2 ${
                  selfPlayer?.isReady
                    ? 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                }`}
              >
                {selfPlayer?.isReady ? 'Hazır Değilim' : '✓ Hazır Ol'}
              </button>

              {isHost && (
                <button
                  onClick={() => { soundManager.playButtonClick(); onStartGame(); }}
                  className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-base transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 active:scale-95"
                >
                  <Play className="w-5 h-5 fill-current" /> Oyunu Başlat
                </button>
              )}
            </div>
          </div>

          {/* Room Settings Summary Panel */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" /> Seçilen Oda Ayarları
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Açılış Limiti</span>
                <span className="font-bold text-amber-400 text-sm">{settings.openingLimit}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Katlamalı Oyun</span>
                <span className="font-bold text-emerald-400 text-sm">{settings.doubling ? 'Açık (×2)' : 'Kapalı'}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Bot Zorluğu</span>
                <span className="font-bold text-amber-400 text-sm capitalize">{settings.botDifficulty}</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400 block">Elenme Puanı</span>
                <span className="font-bold text-red-400 text-sm">{settings.maxPenalty}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Box Column */}
        <div className="h-[480px] lg:h-auto">
          <ChatBox messages={chatMessages} onSendMessage={onSendMessage} />
        </div>
      </div>
    </div>
  );
}
