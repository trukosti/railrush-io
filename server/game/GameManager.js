const GameRoom = require('./GameRoom');
const Player = require('./Player');

class GameManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.players = new Map();
    this.maxPlayersPerRoom = 40;
    this.gameTickRate = 20; // 20 Hz server tick
    
    // Start game loop
    this.startGameLoop();
  }

  handlePlayerJoin(socket, data) {
    const { playerName, skin } = data;
    
    // Create player
    const player = new Player(socket.id, playerName, skin);
    this.players.set(socket.id, player);
    
    // Find or create room
    let room = this.findAvailableRoom();
    if (!room) {
      room = this.createRoom();
    }
    
    // Add player to room
    room.addPlayer(player);
    player.roomId = room.id;
    
    // Join socket room
    socket.join(room.id);
    
    // Send initial game state
    socket.emit('gameJoined', {
      roomId: room.id,
      playerId: player.id,
      gameState: room.getGameState()
    });
    
    console.log(`Player ${playerName} joined room ${room.id}`);
  }

  handlePlayerInput(socket, data) {
    const player = this.players.get(socket.id);
    if (!player) return;
    
    const room = this.rooms.get(player.roomId);
    if (!room) return;
    
    // Update player input
    player.updateInput(data);
  }

  handlePlaceRail(socket, data) {
    const player = this.players.get(socket.id);
    if (!player) return;
    
    const room = this.rooms.get(player.roomId);
    if (!room) return;
    
    // Try to place rail
    const success = room.placeRail(player, data);
    if (success) {
      socket.emit('railPlaced', { success: true });
    } else {
      socket.emit('railPlaced', { success: false, reason: 'insufficient_rails' });
    }
  }

  handlePlayerDisconnect(socket) {
    const player = this.players.get(socket.id);
    if (!player) return;
    
    const room = this.rooms.get(player.roomId);
    if (room) {
      room.removePlayer(player);
      
      // Remove empty rooms
      if (room.getPlayerCount() === 0) {
        this.rooms.delete(room.id);
        console.log(`Room ${room.id} removed (empty)`);
      }
    }
    
    this.players.delete(socket.id);
    console.log(`Player ${player.name} disconnected`);
  }

  findAvailableRoom() {
    for (const [id, room] of this.rooms) {
      if (room.getPlayerCount() < this.maxPlayersPerRoom) {
        return room;
      }
    }
    return null;
  }

  createRoom() {
    const roomId = this.generateRoomId();
    const room = new GameRoom(roomId, this.io);
    this.rooms.set(roomId, room);
    console.log(`Created new room: ${roomId}`);
    return room;
  }

  generateRoomId() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  startGameLoop() {
    setInterval(() => {
      this.update();
    }, 1000 / this.gameTickRate);
  }

  update() {
    // Update all rooms
    for (const [id, room] of this.rooms) {
      room.update();
    }
  }

  getPlayerCount() {
    return this.players.size;
  }

  getActiveGameCount() {
    return this.rooms.size;
  }
}

module.exports = GameManager; 