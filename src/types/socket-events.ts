export const SOCKET_EVENTS = {
  // Client -> Server
  JOIN_LOBBY: 'client:join_lobby',
  CREATE_ROOM: 'client:create_room',
  JOIN_ROOM: 'client:join_room',
  TOGGLE_READY: 'client:toggle_ready',
  UPDATE_SETTINGS: 'client:update_settings',
  ADD_BOT: 'client:add_bot',
  REMOVE_BOT: 'client:remove_bot',
  START_GAME: 'client:start_game',
  DRAW_TILE: 'client:draw_tile',         // source: 'deck' | 'discard'
  DISCARD_TILE: 'client:discard_tile',   // tileId
  OPEN_MELDS: 'client:open_melds',       // melds: Tile[][] or pairs: Tile[][]
  COLLECT_MELDS: 'client:collect_melds', // Topla (indirdiği taşları toplama & +101 ceza alma)
  RETURN_DISCARD: 'client:return_discard', // Geri Bırak (yandan aldığı taşı geri koyma)
  CLAIM_PROCESSABLE_DISCARD: 'client:claim_processable', // İşlek Taş Cezası Ver (+101 Ceza)
  ADD_TILE_TO_MELD: 'client:add_tile_to_meld', // tileId, meldId
  SEND_CHAT: 'client:send_chat',
  RESTART_MATCH: 'client:restart_match',
  LEAVE_ROOM: 'client:leave_room',
  RACK_UPDATED: 'client:rack_updated',

  // Server -> Client
  ROOM_JOINED: 'server:room_joined',
  ROOM_UPDATED: 'server:room_updated',
  GAME_STARTED: 'server:game_started',
  GAME_STATE_UPDATE: 'server:game_state_update',
  PLAYER_HAND: 'server:player_hand',
  CHAT_MESSAGE: 'server:chat_message',
  NOTIFICATION: 'server:notification',
  ERROR: 'server:error',
  ROUND_ENDED: 'server:round_ended',
  MATCH_ENDED: 'server:match_ended'
} as const;
