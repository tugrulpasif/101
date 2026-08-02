'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { ChatMessage } from '../types/okey';
import { soundManager } from '../lib/sound';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export default function ChatBox({ messages, onSendMessage }: ChatBoxProps) {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    soundManager.playButtonClick();
    onSendMessage(text.trim());
    setText('');
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-lg">
      <div className="px-4 py-3 bg-slate-900/80 border-b border-white/10 flex items-center gap-2 text-sm font-bold text-amber-400">
        <MessageSquare className="w-4 h-4" /> Oda Sohbeti
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-2 max-h-60 min-h-[160px] text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded-xl ${
              msg.isSystem
                ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300 text-center font-medium'
                : 'bg-slate-800/80 border border-slate-700/50 text-slate-200'
            }`}
          >
            {!msg.isSystem && (
              <div className="flex justify-between items-center mb-0.5 text-[10px] text-slate-400">
                <span className="font-bold text-amber-400">{msg.sender}</span>
                <span>{msg.time}</span>
              </div>
            )}
            <p className="break-words">{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-2 bg-slate-900/90 border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mesaj yaz..."
          maxLength={100}
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="p-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
