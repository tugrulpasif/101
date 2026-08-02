'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, LogIn, User, Sparkles, Shield, Gamepad2 } from 'lucide-react';
import CreateRoomModal from './CreateRoomModal';
import { RoomSettings } from '../types/okey';
import { soundManager } from '../lib/sound';

interface LobbyScreenProps {
  playerName: string;
  onCreateRoom: (settings: RoomSettings) => void;
  onJoinRoom: (roomCode: string) => void;
}

export default function LobbyScreen({ playerName, onCreateRoom, onJoinRoom }: LobbyScreenProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.trim().length !== 6) {
      setError('Oda kodu 6 karakterden oluşmalıdır.');
      return;
    }
    setError('');
    soundManager.playButtonClick();
    onJoinRoom(roomCode.trim().toUpperCase());
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between glass-panel px-6 py-4 rounded-2xl mb-8 border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-xl">
            101
          </div>
          <div>
            <h1 className="font-black text-xl text-white tracking-wide">101 OKEY ONLINE</h1>
            <p className="text-xs text-slate-400">Canlı Masa & Oyun Lobisi</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/80 px-4 py-2 rounded-xl border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400">
            <User className="w-4 h-4" />
          </div>
          <div className="text-left">
            <div className="text-xs text-slate-400">Oyuncu</div>
            <div className="text-sm font-bold text-white">{playerName}</div>
          </div>
        </div>
      </header>

      {/* Main Lobby Actions Grid */}
      <main className="flex-1 grid md:grid-cols-2 gap-6 items-center">
        {/* Create Room Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-panel p-8 rounded-3xl border border-amber-500/30 flex flex-col justify-between h-full relative overflow-hidden group shadow-xl"
        >
          <div className="absolute top-0 right-0 p-8 text-amber-500/10 group-hover:text-amber-500/20 transition-colors">
            <Gamepad2 className="w-32 h-32" />
          </div>

          <div className="relative z-10 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-4">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Yeni Oda Oluştur</h2>
            <p className="text-slate-300 text-sm">
              Kendi kurallarınla özel bir 101 masası aç. Arkadaşlarını davet et veya botlarla hemen oyna.
            </p>
          </div>

          <button
            onClick={() => { soundManager.playButtonClick(); setIsModalOpen(true); }}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-base"
          >
            <PlusCircle className="w-5 h-5" /> Oda Oluştur
          </button>
        </motion.div>

        {/* Join Room Card */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-panel p-8 rounded-3xl border border-white/10 flex flex-col justify-between h-full relative overflow-hidden group shadow-xl"
        >
          <div className="absolute top-0 right-0 p-8 text-emerald-500/10 group-hover:text-emerald-500/20 transition-colors">
            <LogIn className="w-32 h-32" />
          </div>

          <div className="relative z-10 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4">
              <LogIn className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Oda Koduyla Katıl</h2>
            <p className="text-slate-300 text-sm">
              Arkadaşının paylaştığı 6 haneli oda kodunu girerek masaya anında katol.
            </p>
          </div>

          <form onSubmit={handleJoin} className="relative z-10 space-y-4">
            <div>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Örn: X7K9M2"
                maxLength={6}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-2xl px-5 py-4 text-white text-center text-2xl font-mono tracking-widest uppercase placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={roomCode.trim().length !== 6}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-extrabold py-4 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-5 h-5" /> Masaya Katıl
            </button>
          </form>
        </motion.div>
      </main>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={(settings) => {
          setIsModalOpen(false);
          onCreateRoom(settings);
        }}
      />
    </div>
  );
}
