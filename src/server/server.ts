import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { RoomManager } from './roomManager';
import { SOCKET_EVENTS } from '../types/socket-events';
import { GameState, Player, Tile, RoomSettings, Meld, ChatMessage } from '../types/okey';
import { validateOpeningAttempt, validateSingleMeld, autoPartitionTilesIntoMelds, isTileProcessable, attachTileToMeld, getEffectiveTile } from './engine/validator';
import { calculateHandScores, calculateTileValue } from './engine/scorer';
import { computeBotDecision } from './bot/botAi';
import { initializeGame, formatHandToRack } from './engine/gameLogic';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

/**
 * Sanitizes GameState so players only see their own hands and hidden deck/opponent hands
 */
function sanitizeGameStateForPlayer(state: GameState, socketId: string): GameState {
  const sanitizedPlayers = state.players.map(p => {
    if (p.id === socketId) {
      return p; // Return full player info (hand, rack) for current player
    }
    // Return sanitized player info for opponents
    const { hand, rack, ...rest } = p;
    return {
      ...rest,
      handCount: hand ? hand.length : 0,
    } as any;
  });

  return {
    ...state,
    players: sanitizedPlayers,
  };
}

/**
 * Broadcasts updated state to all clients in a room
 */
function broadcastRoomUpdate(roomCode: string) {
  const room = roomManager.getRoom(roomCode);
  if (!room) return;

  // Emit basic room structure
  io.to(roomCode).emit(SOCKET_EVENTS.ROOM_UPDATED, {
    roomCode: room.roomCode,
    hostId: room.hostId,
    settings: room.settings,
    players: room.players.map(p => ({ ...p, hand: undefined })),
    chatMessages: room.chatMessages,
    status: room.gameState ? room.gameState.status : 'waiting',
  });

  // If game is in progress, send sanitized state to each player socket
  if (room.gameState) {
    for (const p of room.players) {
      if (!p.isBot && p.isConnected) {
        const sanitized = sanitizeGameStateForPlayer(room.gameState, p.id);
        io.to(p.id).emit(SOCKET_EVENTS.GAME_STATE_UPDATE, sanitized);
      }
    }
    checkAndTriggerBotTurn(roomCode);
  }
}

/**
 * Checks if current turn belongs to a bot and schedules turn execution
 */
function checkAndTriggerBotTurn(roomCode: string) {
  const room = roomManager.getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.status !== 'playing') return;

  const gameState = room.gameState;
  const currentSeat = gameState.turn.currentSeat;
  const activePlayer = gameState.players.find(p => p.seatIndex === currentSeat);

  if (activePlayer && activePlayer.isBot) {
    // 1-3 seconds humanized bot thinking delay
    const delay = Math.floor(Math.random() * 1500) + 1000;
    setTimeout(() => {
      executeBotTurn(roomCode, activePlayer.id);
    }, delay);
  }
}

/**
 * Executes a turn step for a Bot player
 */
function executeBotTurn(roomCode: string, botId: string) {
  const room = roomManager.getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.status !== 'playing') return;

  const gameState = room.gameState;
  const activePlayer = gameState.players.find(p => p.seatIndex === gameState.turn.currentSeat);
  if (!activePlayer || activePlayer.id !== botId || !activePlayer.isBot) return;

  const decision = computeBotDecision(activePlayer, gameState);

  if (decision.action === 'draw') {
    handleDrawTile(roomCode, botId, decision.drawSource || 'deck');
  } else if (decision.action === 'open' && decision.meldsToOpen) {
    handleOpenMelds(roomCode, botId, decision.meldsToOpen);
    // After opening, bot discards
    setTimeout(() => {
      const updatedDecision = computeBotDecision(activePlayer, gameState);
      if (updatedDecision.discardTileId) {
        handleDiscardTile(roomCode, botId, updatedDecision.discardTileId);
      }
    }, 1000);
  } else if (decision.action === 'discard' && decision.discardTileId) {
    handleDiscardTile(roomCode, botId, decision.discardTileId);
  }
}

/**
 * Handle tile draw (from deck or discard pile)
 */
function handleDrawTile(roomCode: string, playerId: string, source: 'deck' | 'discard') {
  const room = roomManager.getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.status !== 'playing') return;

  const state = room.gameState;
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.seatIndex !== state.turn.currentSeat || state.turn.hasDrawn) return;

  let drawnTile: Tile | undefined;

  if (source === 'discard') {
    if ((state.turnCount || 0) < 4) {
      io.to(playerId).emit(SOCKET_EVENTS.ERROR, { message: 'İlk turda yandan taş çekilemez!' });
      return;
    }
    const prevSeat = (state.turn.currentSeat + 3) % 4;
    const pile = state.discardPiles[prevSeat];
    if (pile && pile.length > 0) {
      drawnTile = pile.pop();
      (player as any)._drewFromDiscard = true;
      (player as any)._drawnDiscardTile = drawnTile;
    }
  }

  // Fallback to deck if discard pile was empty or source is deck
  if (!drawnTile) {
    (player as any)._drewFromDiscard = false;
    (player as any)._drawnDiscardTile = null;

    const internalDeck: Tile[] = (state as any)._internalDeck;
    if (internalDeck && internalDeck.length > 0) {
      drawnTile = internalDeck.pop();
      state.deckCount = internalDeck.length;
    } else {
      if (state.deckCount <= 0) {
        finishRound(roomCode, null, 'draw', false);
        return;
      }
      drawnTile = {
        id: `tile_drawn_${Date.now()}_${Math.random()}`,
        color: ['red', 'black', 'blue', 'yellow'][Math.floor(Math.random() * 4)] as any,
        number: Math.floor(Math.random() * 13) + 1,
      };
      state.deckCount = Math.max(0, state.deckCount - 1);
    }
  }

  if (drawnTile) {
    player.hand = player.hand || [];
    player.hand.push(drawnTile);
    player.rack = formatHandToRack(player.hand);
    state.turn.hasDrawn = true;
    broadcastRoomUpdate(roomCode);
  }
}

/**
 * Handle tile discard and turn progression
 */
function handleDiscardTile(roomCode: string, playerId: string, tileId: string) {
  const room = roomManager.getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.status !== 'playing') return;

  const state = room.gameState;
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.seatIndex !== state.turn.currentSeat || !state.turn.hasDrawn) return;

  // 34 OKEY RULE: If player drew from discard pile, they MUST open melds on this turn!
  if ((player as any)._drewFromDiscard && !player.hasOpened) {
    io.to(playerId).emit(SOCKET_EVENTS.ERROR, {
      message: 'Yandan taş aldığınız için bu el elinizi açmak zorundasınız!'
    });
    return;
  }

  const hand = player.hand || [];
  const tileIndex = hand.findIndex(t => t.id === tileId);
  if (tileIndex === -1) return;

  const [discardedTile] = hand.splice(tileIndex, 1);
  player.rack = formatHandToRack(hand);

  // Add discarded tile to player's discard pile
  state.discardPiles[player.seatIndex].push(discardedTile);
  state.lastDiscard = { tile: discardedTile, seatIndex: player.seatIndex };

  // Check if discarded tile was "işlek" (processable)
  const okeyRef = state.okeyTile || { id: 'temp', color: 'red', number: 1 };
  const isProcessable = isTileProcessable(discardedTile, state.tableMelds, okeyRef);
  state.lastDiscardIsProcessable = isProcessable;
  state.processableClaimedBy = null;

  // Reset turn draw flags
  (player as any)._drewFromDiscard = false;
  (player as any)._drawnDiscardTile = null;

  // Check if player has finished hand
  if (hand.length === 0) {
    const anyoneElseOpened = state.players.some(p => p.id !== playerId && p.hasOpened);
    let finishType: 'normal' | 'unopened_hand' | 'pairs' | 'okey' | 'pairs_okey' | 'hand_okey' = 'normal';

    if (!anyoneElseOpened && !player.hasOpened) {
      // Elden bitme! (Hiç kimsede açılan yokken bir kerede bitme)
      finishType = discardedTile.isOkey ? 'hand_okey' : 'unopened_hand';
    } else if (discardedTile.isOkey) {
      finishType = player.openedType === 'pairs' ? 'pairs_okey' : 'okey';
    } else if (player.openedType === 'pairs') {
      finishType = 'pairs';
    }

    finishRound(roomCode, playerId, finishType, discardedTile.isOkey || false);
    return;
  }

  // Advance turn counter-clockwise (Seat 0 -> 1 -> 2 -> 3 -> 0)
  state.turnCount = (state.turnCount || 0) + 1;
  state.turn.currentSeat = (state.turn.currentSeat + 1) % 4;
  state.turn.hasDrawn = false;
  state.turn.turnStartTime = Date.now();

  broadcastRoomUpdate(roomCode);
}

/**
 * Handle player opening melds / pairs (either initial opening or adding new melds to table after opening)
 */
function handleOpenMelds(roomCode: string, playerId: string, meldsTiles: Tile[][]) {
  const room = roomManager.getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.status !== 'playing') return;

  const state = room.gameState;
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.seatIndex !== state.turn.currentSeat) return;

  // RULE: Hand opening is disabled on 1st turn rotation (turnCount < 4)
  if ((state.turnCount || 0) < 4) {
    io.to(playerId).emit(SOCKET_EVENTS.ERROR, { message: 'İlk turda el açılamaz!' });
    return;
  }

  const okeyRef = state.okeyTile || { id: 'temp', color: 'red', number: 1 };

  // --- CASE A: Player HAS ALREADY OPENED -> Adding new melds ---
  if (player.hasOpened) {
    if (!meldsTiles || meldsTiles.length === 0) return;

    let autoGrouped = meldsTiles;
    if (meldsTiles.length === 1 && meldsTiles[0].length >= 3) {
      const partitioned = autoPartitionTilesIntoMelds(meldsTiles[0], okeyRef);
      if (partitioned.length > 0) autoGrouped = partitioned;
    }

    // Validate each meld individually
    for (let i = 0; i < autoGrouped.length; i++) {
      const singleRes = validateSingleMeld(autoGrouped[i], okeyRef);
      if (!singleRes.valid) {
        io.to(playerId).emit(SOCKET_EVENTS.ERROR, {
          message: `${i + 1}. gruptaki taşlar geçerli bir per oluşturmuyor.`
        });
        return;
      }
    }

    // Remove tiles from hand
    const addedTileIds = new Set(autoGrouped.flat().map(t => t.id));
    player.hand = (player.hand || []).filter(t => !addedTileIds.has(t.id));
    player.rack = formatHandToRack(player.hand);

    // Append new melds to table
    autoGrouped.forEach((tiles, idx) => {
      const singleRes = validateSingleMeld(tiles, okeyRef);
      state.tableMelds.push({
        id: `meld_${Date.now()}_${idx}_${Math.random()}`,
        type: singleRes.type || 'run',
        tiles,
        ownerId: player.id,
        ownerName: player.name,
      });
    });

    roomManager.addSystemMessage(room, `${player.name} masadaki açılanlarına yeni per ekledi.`);
    broadcastRoomUpdate(roomCode);
    return;
  }

  // --- CASE B: Player HAS NOT OPENED YET -> Initial opening attempt ---
  const validation = validateOpeningAttempt(meldsTiles, state.settings.openingLimit, okeyRef);

  if (!validation.valid) {
    io.to(playerId).emit(SOCKET_EVENTS.ERROR, { message: validation.reason || 'Geçersiz per açma denemesi.' });
    return;
  }

  // RULE: Check if player opened using a thrashed discard tile -> Apply x10 penalty to the player who thrashed it!
  if ((player as any)._drewFromDiscard && (player as any)._drawnDiscardTile) {
    const drawnTile: Tile = (player as any)._drawnDiscardTile;
    const tileVal = calculateTileValue(drawnTile, okeyRef);
    const penalty = tileVal * 10;

    const offenderSeat = (player.seatIndex + 3) % 4;
    const offender = state.players.find(p => p.seatIndex === offenderSeat);
    if (offender) {
      offender.midRoundPenalty = (offender.midRoundPenalty || 0) + penalty;
      const tileName = `${drawnTile.color.toUpperCase()} ${drawnTile.number}`;
      roomManager.addSystemMessage(
        room,
        `🔥 ${offender.name}, ${player.name} oyuncusunun el açmasını sağlayan (${tileName}) taşını attığı için +${penalty} Ceza Puanı (x10) aldı!`
      );
    }
  }

  // Remove opened tiles from player's hand
  const openedTileIds = new Set(meldsTiles.flat().map(t => t.id));
  player.hand = (player.hand || []).filter(t => !openedTileIds.has(t.id));
  player.rack = formatHandToRack(player.hand);
  player.hasOpened = true;
  player.openedType = validation.openedType;

  // Add new melds to table
  meldsTiles.forEach((tiles, idx) => {
    state.tableMelds.push({
      id: `meld_${Date.now()}_${idx}`,
      type: validation.openedType === 'pairs' ? 'pair' : 'run',
      tiles,
      ownerId: player.id,
      ownerName: player.name,
    });
  });

  roomManager.addSystemMessage(room, `${player.name} perlerini masaya açtı!`);
  broadcastRoomUpdate(roomCode);
}

/**
 * Handle laying down a single tile onto an existing table meld (Taş İşleme)
 */
function handleAddTileToMeld(roomCode: string, playerId: string, tileId: string, meldId: string) {
  const room = roomManager.getRoom(roomCode);
  if (!room || !room.gameState || room.gameState.status !== 'playing') return;

  const state = room.gameState;
  const player = state.players.find(p => p.id === playerId);
  if (!player || player.seatIndex !== state.turn.currentSeat || !state.turn.hasDrawn) return;

  // STRICT 101 OKEY RULE: Only players who HAVE OPENED THEIR HAND can process tiles onto table melds!
  if (!player.hasOpened) {
    io.to(playerId).emit(SOCKET_EVENTS.ERROR, {
      message: 'Sadece elini açan oyuncular masadaki perlere taş işleyebilir!'
    });
    return;
  }

  const meld = state.tableMelds.find(m => m.id === meldId);
  if (!meld) return;

  const hand = player.hand || [];
  const tile = hand.find(t => t.id === tileId);
  if (!tile) return;

  const okeyRef = state.okeyTile || { id: 'temp', color: 'red', number: 1 };
  const attachRes = attachTileToMeld(meld, tile, okeyRef);

  if (!attachRes.valid) {
    io.to(playerId).emit(SOCKET_EVENTS.ERROR, {
      message: attachRes.reason || 'Bu taş seçilen pere işlenemiyor.'
    });
    return;
  }

  // Update meld tiles on table
  meld.tiles = attachRes.newTiles;

  // Remove tile from player's hand
  const tileIdx = hand.findIndex(t => t.id === tileId);
  if (tileIdx !== -1) hand.splice(tileIdx, 1);
  player.rack = formatHandToRack(hand);

  const tileName = `${tile.color.toUpperCase()} ${tile.number}`;
  roomManager.addSystemMessage(
    room,
    `${player.name}, ${meld.ownerName} oyuncusunun perine (${tileName}) taşını işledi!`
  );

  broadcastRoomUpdate(roomCode);
}

/**
 * Finishes current round and triggers scoring
 */
function finishRound(roomCode: string, winnerId: string | null, finishType: any, isLastTileOkey: boolean) {
  const room = roomManager.getRoom(roomCode);
  if (!room || !room.gameState) return;

  const state = room.gameState;
  state.status = 'round_ended';

  const roundResult = calculateHandScores({
    players: state.players,
    winnerId,
    finishType,
    isLastTileOkey,
    okeyRef: state.okeyTile || { id: 'temp', color: 'red', number: 1 },
    settings: state.settings,
  });

  state.lastRoundResult = roundResult;

  // Update cumulative player penalty totals
  roundResult.results.forEach(res => {
    const p = state.players.find(pl => pl.id === res.playerId);
    if (p) {
      p.totalPenalty = res.totalPenalty;
      p.isEliminated = res.isEliminated;
    }
  });

  // Log to history
  state.history.push({
    roundNumber: state.roundNumber,
    winnerName: roundResult.winnerName || 'Kimse',
    finishType: roundResult.finishType,
    results: roundResult.results.map(r => ({
      playerName: r.playerName,
      roundPenalty: r.roundPenalty,
      totalPenalty: r.totalPenalty,
    })),
  });

  // Check if overall match is over (only 1 non-eliminated player remaining)
  const activePlayers = state.players.filter(p => !p.isEliminated);
  if (activePlayers.length <= 1) {
    state.status = 'game_over';
  }

  broadcastRoomUpdate(roomCode);
}

// Socket Connection Handler
io.on('connection', (socket: Socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on(SOCKET_EVENTS.CREATE_ROOM, ({ name, settings }) => {
    try {
      const room = roomManager.createRoom(socket.id, name, settings);
      socket.join(room.roomCode);
      socket.emit(SOCKET_EVENTS.ROOM_JOINED, { roomCode: room.roomCode, playerId: socket.id });
      broadcastRoomUpdate(room.roomCode);
    } catch (err: any) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });

  socket.on(SOCKET_EVENTS.JOIN_ROOM, ({ roomCode, name }) => {
    try {
      const room = roomManager.joinRoom(roomCode, socket.id, name);
      socket.join(room.roomCode);
      socket.emit(SOCKET_EVENTS.ROOM_JOINED, { roomCode: room.roomCode, playerId: socket.id });
      broadcastRoomUpdate(room.roomCode);
    } catch (err: any) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });

  socket.on(SOCKET_EVENTS.TOGGLE_READY, ({ roomCode }) => {
    try {
      const room = roomManager.toggleReady(roomCode, socket.id);
      broadcastRoomUpdate(roomCode);
    } catch (err: any) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });

  socket.on(SOCKET_EVENTS.UPDATE_SETTINGS, ({ roomCode, settings }) => {
    try {
      const room = roomManager.updateSettings(roomCode, socket.id, settings);
      broadcastRoomUpdate(roomCode);
    } catch (err: any) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });

  socket.on(SOCKET_EVENTS.ADD_BOT, ({ roomCode }) => {
    try {
      const room = roomManager.addBot(roomCode, socket.id);
      broadcastRoomUpdate(roomCode);
    } catch (err: any) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });

  socket.on(SOCKET_EVENTS.REMOVE_BOT, ({ roomCode, botId }) => {
    try {
      const room = roomManager.removeBot(roomCode, socket.id, botId);
      broadcastRoomUpdate(roomCode);
    } catch (err: any) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });

  socket.on(SOCKET_EVENTS.START_GAME, ({ roomCode }) => {
    try {
      const state = roomManager.startGame(roomCode, socket.id);
      io.to(roomCode).emit(SOCKET_EVENTS.GAME_STARTED);
      broadcastRoomUpdate(roomCode);
    } catch (err: any) {
      socket.emit(SOCKET_EVENTS.ERROR, { message: err.message });
    }
  });

  socket.on(SOCKET_EVENTS.DRAW_TILE, ({ roomCode, source }) => {
    handleDrawTile(roomCode, socket.id, source);
  });

  socket.on(SOCKET_EVENTS.DISCARD_TILE, ({ roomCode, tileId }) => {
    handleDiscardTile(roomCode, socket.id, tileId);
  });

  socket.on(SOCKET_EVENTS.OPEN_MELDS, ({ roomCode, melds }) => {
    handleOpenMelds(roomCode, socket.id, melds);
  });

  socket.on(SOCKET_EVENTS.ADD_TILE_TO_MELD, ({ roomCode, tileId, meldId }) => {
    handleAddTileToMeld(roomCode, socket.id, tileId, meldId);
  });

  socket.on(SOCKET_EVENTS.CLAIM_PROCESSABLE_DISCARD, ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.gameState) return;

    const state = room.gameState;
    const lastDiscardObj = state.lastDiscard;
    if (!lastDiscardObj) return;

    const claimant = state.players.find(p => p.id === socket.id);
    const offender = state.players.find(p => p.seatIndex === lastDiscardObj.seatIndex);

    if (!claimant || !offender || claimant.id === offender.id) return;

    // Add +101 mid-round penalty to the player who thrashed an İşlek tile
    offender.midRoundPenalty = (offender.midRoundPenalty || 0) + 101;
    state.lastDiscardIsProcessable = false;
    state.processableClaimedBy = claimant.name;

    const tileInfo = `${lastDiscardObj.tile.color.toUpperCase()} ${lastDiscardObj.tile.number}`;
    roomManager.addSystemMessage(
      room,
      `🔥 ${claimant.name}, ${offender.name} tarafından atılan (${tileInfo}) taşının İŞLEK olduğunu bildirdi! ${offender.name} +101 Ceza Puanı aldı!`
    );

    broadcastRoomUpdate(roomCode);
  });

  socket.on(SOCKET_EVENTS.COLLECT_MELDS, ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.gameState) return;

    const state = room.gameState;
    const player = state.players.find(p => p.id === socket.id);
    if (!player || !player.hasOpened) return;

    // Collect melds back to player's hand
    const myMelds = state.tableMelds.filter(m => m.ownerId === socket.id);
    const collectedTiles = myMelds.flatMap(m => m.tiles);

    state.tableMelds = state.tableMelds.filter(m => m.ownerId !== socket.id);
    player.hand = [...(player.hand || []), ...collectedTiles];
    player.rack = formatHandToRack(player.hand);
    player.hasOpened = false;
    player.openedType = null;

    // Add +101 mid-round penalty for collecting/canceling opening attempt
    player.midRoundPenalty = (player.midRoundPenalty || 0) + 101;

    roomManager.addSystemMessage(room, `${player.name} indirdiği taşları topladı (+101 Ceza aldı).`);
    broadcastRoomUpdate(roomCode);
  });

  socket.on(SOCKET_EVENTS.RETURN_DISCARD, ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || !room.gameState) return;

    const state = room.gameState;
    const player = state.players.find(p => p.id === socket.id);
    if (!player || player.seatIndex !== state.turn.currentSeat || !state.turn.hasDrawn) return;

    if ((player as any)._drewFromDiscard && (player as any)._drawnDiscardTile) {
      const drawnTile: Tile = (player as any)._drawnDiscardTile;
      const hand = player.hand || [];
      const idx = hand.findIndex(t => t.id === drawnTile.id);
      if (idx !== -1) {
        hand.splice(idx, 1);
        player.rack = formatHandToRack(hand);

        // Put tile back to previous seat's discard pile
        const prevSeat = (player.seatIndex + 3) % 4;
        state.discardPiles[prevSeat].push(drawnTile);

        state.turn.hasDrawn = false;
        (player as any)._drewFromDiscard = false;
        (player as any)._drawnDiscardTile = null;

        roomManager.addSystemMessage(room, `${player.name} aldığı taşı geri bıraktı.`);
        broadcastRoomUpdate(roomCode);
      }
    }
  });

  socket.on(SOCKET_EVENTS.SEND_CHAT, ({ roomCode, text }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === socket.id);
    const sender = player ? player.name : 'Oyuncu';

    const msg: ChatMessage = {
      id: `chat_${Date.now()}`,
      sender,
      text,
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    room.chatMessages.push(msg);
    io.to(roomCode).emit(SOCKET_EVENTS.CHAT_MESSAGE, msg);
  });

  socket.on(SOCKET_EVENTS.RESTART_MATCH, ({ roomCode }) => {
    const room = roomManager.getRoom(roomCode);
    if (!room || room.hostId !== socket.id) return;

    const prevState = room.gameState;
    if (prevState && (prevState.status === 'round_ended' || prevState.status === 'game_over')) {
      // Preserve accumulated total penalties and history for next round!
      const updatedPlayers = room.players.map(rp => {
        const statePlayer = prevState.players.find(sp => sp.id === rp.id);
        return {
          ...rp,
          totalPenalty: statePlayer ? statePlayer.totalPenalty : 0,
          midRoundPenalty: 0,
          isEliminated: statePlayer ? statePlayer.isEliminated : false,
        };
      });

      const nextState = initializeGame(roomCode, room.hostId, updatedPlayers, room.settings);
      nextState.roundNumber = (prevState.roundNumber || 1) + 1;
      nextState.history = prevState.history || [];

      room.gameState = nextState;
    } else {
      room.gameState = initializeGame(roomCode, room.hostId, room.players, room.settings);
    }

    broadcastRoomUpdate(roomCode);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
    const { room } = roomManager.handlePlayerDisconnect(socket.id);
    if (room) {
      broadcastRoomUpdate(room.roomCode);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🟢 [101 OKEY SERVER] Express + Socket.IO server running on port ${PORT}`);
});
