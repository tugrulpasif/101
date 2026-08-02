import { GameState, Player, RoomSettings, ChatMessage, Tile, Meld } from '../types/okey';
import { initializeGame, formatHandToRack } from './engine/gameLogic';
import { validateOpeningAttempt, validateSingleMeld, getEffectiveTile } from './engine/validator';
import { calculateHandScores } from './engine/scorer';
import { computeBotDecision } from './bot/botAi';

export interface RoomData {
  roomCode: string;
  hostId: string;
  settings: RoomSettings;
  players: Player[];
  gameState: GameState | null;
  chatMessages: ChatMessage[];
  disconnectTimeouts: { [socketId: string]: NodeJS.Timeout };
}

export class RoomManager {
  private rooms: Map<string, RoomData> = new Map();

  // Generate 6-character random alphanumeric room code
  public generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return this.rooms.has(code) ? this.generateRoomCode() : code;
  }

  public createRoom(hostSocketId: string, hostName: string, settings?: Partial<RoomSettings>): RoomData {
    const roomCode = this.generateRoomCode();
    const defaultSettings: RoomSettings = {
      openingLimit: 34,
      doubling: true,
      showOkey: true,
      minPlayers: 2,
      maxPlayers: 4,
      allowBots: true,
      botDifficulty: 'medium',
      startingPenalty: 0,
      maxPenalty: 701,
      ...settings,
    };

    const hostPlayer: Player = {
      id: hostSocketId,
      name: hostName,
      isHost: true,
      isBot: false,
      isReady: true,
      isConnected: true,
      seatIndex: 0,
      hasOpened: false,
      openedType: null,
      totalPenalty: defaultSettings.startingPenalty,
      isEliminated: false,
    };

    const room: RoomData = {
      roomCode,
      hostId: hostSocketId,
      settings: defaultSettings,
      players: [hostPlayer],
      gameState: null,
      chatMessages: [
        {
          id: `sys_${Date.now()}`,
          sender: 'Sistem',
          text: `Oda ${roomCode} oluşturuldu. Hoş geldiniz!`,
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          isSystem: true,
        },
      ],
      disconnectTimeouts: {},
    };

    this.rooms.set(roomCode, room);
    return room;
  }

  public getRoom(roomCode: string): RoomData | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  public joinRoom(roomCode: string, socketId: string, playerName: string): RoomData {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Oda bulunamadı.');

    if (room.players.length >= room.settings.maxPlayers) {
      throw new Error('Oda dolu.');
    }

    if (room.gameState && room.gameState.status === 'playing') {
      throw new Error('Oyun devam ediyor.');
    }

    // Find first free seat index (0-3)
    const takenSeats = new Set(room.players.map(p => p.seatIndex));
    let freeSeat = 0;
    for (let i = 0; i < 4; i++) {
      if (!takenSeats.has(i)) {
        freeSeat = i;
        break;
      }
    }

    const newPlayer: Player = {
      id: socketId,
      name: playerName,
      isHost: false,
      isBot: false,
      isReady: false,
      isConnected: true,
      seatIndex: freeSeat,
      hasOpened: false,
      openedType: null,
      totalPenalty: room.settings.startingPenalty,
      isEliminated: false,
    };

    room.players.push(newPlayer);
    this.addSystemMessage(room, `${playerName} odaya katıldı.`);
    return room;
  }

  public addBot(roomCode: string, hostSocketId: string): RoomData {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Oda bulunamadı.');
    if (room.hostId !== hostSocketId) throw new Error('Yalnızca oda sahibi bot ekleyebilir.');
    if (room.players.length >= 4) throw new Error('Oda dolu.');

    const takenSeats = new Set(room.players.map(p => p.seatIndex));
    let freeSeat = 0;
    for (let i = 0; i < 4; i++) {
      if (!takenSeats.has(i)) {
        freeSeat = i;
        break;
      }
    }

    const botNumber = room.players.filter(p => p.isBot).length + 1;
    const botPlayer: Player = {
      id: `bot_${Date.now()}_${freeSeat}`,
      name: `🤖 Bot ${botNumber}`,
      isHost: false,
      isBot: true,
      isReady: true,
      isConnected: true,
      seatIndex: freeSeat,
      hasOpened: false,
      openedType: null,
      totalPenalty: room.settings.startingPenalty,
      isEliminated: false,
    };

    room.players.push(botPlayer);
    this.addSystemMessage(room, `${botPlayer.name} eklendi.`);
    return room;
  }

  public removeBot(roomCode: string, hostSocketId: string, botId: string): RoomData {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Oda bulunamadı.');
    if (room.hostId !== hostSocketId) throw new Error('Yalnızca oda sahibi bot çıkarabilir.');

    const botIndex = room.players.findIndex(p => p.id === botId && p.isBot);
    if (botIndex !== -1) {
      const removedBot = room.players.splice(botIndex, 1)[0];
      this.addSystemMessage(room, `${removedBot.name} çıkarıldı.`);
    }

    return room;
  }

  public toggleReady(roomCode: string, socketId: string): RoomData {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Oda bulunamadı.');

    const player = room.players.find(p => p.id === socketId);
    if (player) {
      player.isReady = !player.isReady;
    }
    return room;
  }

  public updateSettings(roomCode: string, hostSocketId: string, newSettings: Partial<RoomSettings>): RoomData {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Oda bulunamadı.');
    if (room.hostId !== hostSocketId) throw new Error('Yalnızca oda sahibi ayarları değiştirebilir.');

    room.settings = { ...room.settings, ...newSettings };
    this.addSystemMessage(room, 'Oda ayarları güncellendi.');
    return room;
  }

  public startGame(roomCode: string, hostSocketId: string): GameState {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Oda bulunamadı.');
    if (room.hostId !== hostSocketId) throw new Error('Yalnızca oda sahibi oyunu başlatabilir.');

    if (room.players.length < room.settings.minPlayers) {
      throw new Error(`En az ${room.settings.minPlayers} oyuncu gereklidir.`);
    }

    // Auto fill remaining empty seats with bots if needed to make 4 players
    while (room.players.length < 4 && room.settings.allowBots) {
      this.addBot(roomCode, hostSocketId);
    }

    if (room.players.length < 4) {
      throw new Error('Oyun başlatmak için masada 4 oyuncu olmalıdır (veya botlara izin verin).');
    }

    const gameState = initializeGame(roomCode, room.hostId, room.players, room.settings);
    room.gameState = gameState;
    this.addSystemMessage(room, 'Oyun başladı! Bol şanslar.');
    return gameState;
  }

  public addSystemMessage(room: RoomData, text: string): ChatMessage {
    const msg: ChatMessage = {
      id: `sys_${Date.now()}_${Math.random()}`,
      sender: 'Sistem',
      text,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      isSystem: true,
    };
    room.chatMessages.push(msg);
    return msg;
  }

  public handlePlayerDisconnect(socketId: string): { room?: RoomData; playerName?: string } {
    for (const [code, room] of this.rooms.entries()) {
      const player = room.players.find(p => p.id === socketId);
      if (player) {
        player.isConnected = false;
        this.addSystemMessage(room, `${player.name} bağlantısı koptu (60s bekleniyor).`);

        // Schedule 60-second disconnect removal
        room.disconnectTimeouts[socketId] = setTimeout(() => {
          this.removePlayerPermanently(code, socketId);
        }, 60000);

        return { room, playerName: player.name };
      }
    }
    return {};
  }

  private removePlayerPermanently(roomCode: string, socketId: string) {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    const index = room.players.findIndex(p => p.id === socketId);
    if (index !== -1) {
      const removed = room.players.splice(index, 1)[0];
      this.addSystemMessage(room, `${removed.name} oyundan ayrıldı.`);

      if (room.players.length === 0) {
        this.rooms.delete(roomCode);
      } else if (removed.isHost) {
        // Assign new host
        room.players[0].isHost = true;
        room.hostId = room.players[0].id;
        this.addSystemMessage(room, `${room.players[0].name} yeni oda sahibi oldu.`);
      }
    }
  }

  public handlePlayerReconnect(roomCode: string, oldSocketId: string, newSocketId: string): RoomData | null {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.id === oldSocketId || p.id === newSocketId);
    if (player) {
      if (room.disconnectTimeouts[oldSocketId]) {
        clearTimeout(room.disconnectTimeouts[oldSocketId]);
        delete room.disconnectTimeouts[oldSocketId];
      }
      player.id = newSocketId;
      player.isConnected = true;
      this.addSystemMessage(room, `${player.name} tekrar bağlandı.`);
      return room;
    }
    return null;
  }
}
