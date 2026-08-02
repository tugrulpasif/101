'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Sparkles, Trophy, Users } from 'lucide-react';
import { soundManager } from '../lib/sound';

interface LoginScreenProps {
  onLogin: (name: string) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) return;
    soundManager.playButtonClick();
    onLogin(name.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/20 shadow-2xl relative overflow-hidden"
      >
        {/* Glow accent decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl" />

        <div className="text-center relative z-10">
          <div className="inline-flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-4 h-4" /> 101 Okey Online
          </div>

          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
            Hoş Geldiniz
          </h1>
          <p className="text-slate-300 text-sm mb-8">
            Kayıt olmadan, anında oda oluştur ve arkadaşlarınla oyna!
          </p>

          {/* Graphical Okey tiles illustration */}
          <div className="flex justify-center items-center gap-2 mb-8">
            <div className="w-10 h-14 okey-tile flex flex-col justify-between p-1 shadow-lg transform -rotate-6">
              <span className="text-red-600 font-extrabold text-sm leading-none">10</span>
              <span className="text-red-600 font-black text-lg text-center leading-none">10</span>
              <span className="text-red-600 font-extrabold text-xs text-right leading-none">★</span>
            </div>
            <div className="w-10 h-14 okey-tile flex flex-col justify-between p-1 shadow-lg transform rotate-3">
              <span className="text-blue-600 font-extrabold text-sm leading-none">11</span>
              <span className="text-blue-600 font-black text-lg text-center leading-none">11</span>
              <span className="text-blue-600 font-extrabold text-xs text-right leading-none">★</span>
            </div>
            <div className="w-10 h-14 okey-tile flex flex-col justify-between p-1 shadow-lg transform -rotate-3">
              <span className="text-yellow-500 font-extrabold text-sm leading-none">12</span>
              <span className="text-yellow-500 font-black text-lg text-center leading-none">12</span>
              <span className="text-yellow-500 font-extrabold text-xs text-right leading-none">★</span>
            </div>
            <div className="w-10 h-14 okey-tile flex flex-col justify-between p-1 shadow-lg transform rotate-6">
              <span className="text-slate-900 font-extrabold text-sm leading-none">13</span>
              <span className="text-slate-900 font-black text-lg text-center leading-none">13</span>
              <span className="text-slate-900 font-extrabold text-xs text-right leading-none">★</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nickname" className="block text-left text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Oyuncu Adınız
              </label>
              <input
                id="nickname"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Ahmet101"
                maxLength={15}
                required
                className="w-full bg-slate-900/80 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-base"
              />
            </div>

            <button
              type="submit"
              disabled={name.trim().length < 2}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-amber-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" /> Devam Et
            </button>
          </form>

          {/* Quick stats footer */}
          <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-white/10 text-slate-400 text-xs">
            <div className="flex items-center justify-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Gerçek Zamanlı Multiplayer</span>
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Gelişmiş Bot Yapay Zekası</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
