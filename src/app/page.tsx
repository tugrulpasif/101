'use client';

import React, { useState, useEffect } from 'react';
import LoginScreen from '../components/LoginScreen';
import LobbyScreen from '../components/LobbyScreen';
import RoomScreen from '../components/RoomScreen';
import GameTable from '../components/game/GameTable';
import { getSocket } from '../lib/socketClient';
import { SOCKET_EVENTS } from '../types/socket-events';
import { GameState, RoomSettings, ChatMessage, Player, Tile } from '../types/okey';

type ScreenState = 'login' | 'lobby' | 'room' | 'game';

export default function Home() {
  const [screen, setScreen] = useState<ScreenState>('login');
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [hostId, setHostId] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [settings, setSettings] = useState<RoomSettings>({
    openingLimit: 34,
    doubling: true,
    showOkey: true,
    minPlayers: 2,
    maxPlayers: 4,
    allowBots: true,
    botDifficulty: 'medium',
    startingPenalty: 0,
    maxPenalty: 701,
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const socket = getSocket();

  useEffect(() => {
    // Socket listener registrations
    socket.on(SOCKET_EVENTS.ROOM_JOINED, (data: { roomCode: string; playerId: string }) => {
      setRoomCode(data.roomCode);
      setScreen('room');
    });

    socket.on(SOCKET_EVENTS.ROOM_UPDATED, (room: any) => {
      setRoomCode(room.roomCode);
      setHostId(room.hostId);
      setSettings(room.settings);
      setPlayers(room.players);
      setChatMessages(room.chatMessages);

      if (room.status === 'playing' || room.status === 'round_ended' || room.status === 'game_over') {
        setScreen('game');
      }
    });

    socket.on(SOCKET_EVENTS.GAME_STATE_UPDATE, (state: GameState) => {
      setGameState(state);
    });

    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, (msg: ChatMessage) => {
      setChatMessages(prev => [...prev, msg]);
    });

    socket.on(SOCKET_EVENTS.ERROR, (err: { message: string }) => {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(null), 4000);
    });

    return () => {
      socket.off(SOCKET_EVENTS.ROOM_JOINED);
      socket.off(SOCKET_EVENTS.ROOM_UPDATED);
      socket.off(SOCKET_EVENTS.GAME_STATE_UPDATE);
      socket.off(SOCKET_EVENTS.CHAT_MESSAGE);
      socket.off(SOCKET_EVENTS.ERROR);
    };
  }, [socket]);

  // Handlers
  const handleLogin = (name: string) => {
    setPlayerName(name);
    setScreen('lobby');
  };

  const handleCreateRoom = (roomSettings: RoomSettings) => {
    socket.emit(SOCKET_EVENTS.CREATE_ROOM, { name: playerName, settings: roomSettings });
  };

  const handleJoinRoom = (code: string) => {
    socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode: code, name: playerName });
  };

  const handleToggleReady = () => {
    socket.emit(SOCKET_EVENTS.TOGGLE_READY, { roomCode });
  };

  const handleAddBot = () => {
    socket.emit(SOCKET_EVENTS.ADD_BOT, { roomCode });
  };

  const handleRemoveBot = (botId: string) => {
    socket.emit(SOCKET_EVENTS.REMOVE_BOT, { roomCode, botId });
  };

  const handleStartGame = () => {
    socket.emit(SOCKET_EVENTS.START_GAME, { roomCode });
  };

  const handleSendMessage = (text: string) => {
    socket.emit(SOCKET_EVENTS.SEND_CHAT, { roomCode, text });
  };

  const handleDrawTile = (source: 'deck' | 'discard') => {
    socket.emit(SOCKET_EVENTS.DRAW_TILE, { roomCode, source });
  };

  const handleDiscardTile = (tileId: string) => {
    socket.emit(SOCKET_EVENTS.DISCARD_TILE, { roomCode, tileId });
  };

  const handleOpenMelds = (melds: Tile[][]) => {
    socket.emit(SOCKET_EVENTS.OPEN_MELDS, { roomCode, melds });
  };

  const handleCollectMelds = () => {
    socket.emit(SOCKET_EVENTS.COLLECT_MELDS, { roomCode });
  };

  const handleReturnDiscard = () => {
    socket.emit(SOCKET_EVENTS.RETURN_DISCARD, { roomCode });
  };

  const handleClaimProcessable = () => {
    socket.emit(SOCKET_EVENTS.CLAIM_PROCESSABLE_DISCARD, { roomCode });
  };

  const handleAddTileToMeld = (tileId: string, meldId: string) => {
    socket.emit(SOCKET_EVENTS.ADD_TILE_TO_MELD, { roomCode, tileId, meldId });
  };

  const handleRestartMatch = () => {
    socket.emit(SOCKET_EVENTS.RESTART_MATCH, { roomCode });
  };

  const handleLeaveRoom = () => {
    setScreen('lobby');
    setGameState(null);
    setRoomCode('');
  };

  return (
    <main className="min-h-screen">
      {/* Toast Notification Banner */}
      {errorMsg && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white font-bold px-4 py-3 rounded-2xl shadow-2xl border border-red-400 animate-bounce">
          ⚠️ {errorMsg}
        </div>
      )}

      {screen === 'login' && <LoginScreen onLogin={handleLogin} />}

      {screen === 'lobby' && (
        <LobbyScreen
          playerName={playerName}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
        />
      )}

      {screen === 'room' && (
        <RoomScreen
          roomCode={roomCode}
          hostId={hostId}
          currentSocketId={socket.id || ''}
          players={players}
          settings={settings}
          chatMessages={chatMessages}
          onToggleReady={handleToggleReady}
          onAddBot={handleAddBot}
          onRemoveBot={handleRemoveBot}
          onStartGame={handleStartGame}
          onSendMessage={handleSendMessage}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      {screen === 'game' && gameState && (
        <GameTable
          gameState={gameState}
          currentSocketId={socket.id || ''}
          onDrawTile={handleDrawTile}
          onDiscardTile={handleDiscardTile}
          onOpenMelds={handleOpenMelds}
          onCollectMelds={handleCollectMelds}
          onReturnDiscard={handleReturnDiscard}
          onClaimProcessable={handleClaimProcessable}
          onAddTileToMeld={handleAddTileToMeld}
          onRestartMatch={handleRestartMatch}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </main>
  );
}
