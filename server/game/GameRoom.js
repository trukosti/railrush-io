const RailSegment = require('./RailSegment');

class GameRoom {
  constructor(id, io) {
    this.id = id;
    this.io = io;
    this.players = new Map();
    this.rails = [];
    this.powerUps = [];
    this.resources = [];
    
    // Game settings
    this.maxRails = 1000;
    this.railDecayTime = 30000; // 30 seconds
    this.resourceSpawnRate = 5000; // 5 seconds
    this.powerUpSpawnRate = 15000; // 15 seconds
    
    // Timers
    this.lastResourceSpawn = Date.now();
    this.lastPowerUpSpawn = Date.now();
    
    // Spatial hash for collision detection
    this.spatialHash = new Map();
    this.cellSize = 100;
  }

  addPlayer(player) {
    this.players.set(player.id, player);
    
    // Broadcast new player to all players in room
    this.io.to(this.id).emit('playerJoined', {
      player: player.getState()
    });
  }

  removePlayer(player) {
    this.players.delete(player.id);
    
    // Broadcast player left
    this.io.to(this.id).emit('playerLeft', {
      playerId: player.id
    });
  }

  update() {
    const deltaTime = 1 / 60; // 60 FPS simulation
    
    // Update all players
    for (const [id, player] of this.players) {
      player.update(deltaTime);
    }
    
    // Update rails
    this.updateRails();
    
    // Check collisions
    this.checkCollisions();
    
    // Spawn resources and power-ups
    this.spawnResources();
    this.spawnPowerUps();
    
    // Update spatial hash
    this.updateSpatialHash();
    
    // Broadcast game state
    this.broadcastGameState();
  }

  updateRails() {
    const now = Date.now();
    
    // Remove expired rails
    this.rails = this.rails.filter(rail => {
      if (now - rail.createdAt > this.railDecayTime) {
        return false;
      }
      return true;
    });
  }

  checkCollisions() {
    const players = Array.from(this.players.values());
    
    // Player vs Player collisions
    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        if (players[i].alive && players[j].alive) {
          players[i].collideWith(players[j]);
        }
      }
    }
    
    // Check if players are on rails
    for (const [id, player] of this.players) {
      if (!player.alive) continue;
      
      // Oyuncu ray üzerinde mi kontrol et
      if (!this.isPlayerOnRails(player)) {
        player.die('off_rails');
      }
    }
    
    // Player vs Resource collisions
    for (const [id, player] of this.players) {
      if (!player.alive) continue;
      
      for (let i = this.resources.length - 1; i >= 0; i--) {
        const resource = this.resources[i];
        const distance = Math.sqrt(
          Math.pow(player.x - resource.x, 2) + 
          Math.pow(player.y - resource.y, 2)
        );
        
        if (distance < player.size + resource.size) {
          // Collect resource
          player.addScore(resource.value);
          player.addRails(resource.rails);
          this.resources.splice(i, 1);
          
          // Broadcast resource collected
          this.io.to(this.id).emit('resourceCollected', {
            playerId: player.id,
            resourceId: resource.id,
            score: resource.value,
            rails: resource.rails
          });
        }
      }
    }
    
    // Player vs PowerUp collisions
    for (const [id, player] of this.players) {
      if (!player.alive) continue;
      
      for (let i = this.powerUps.length - 1; i >= 0; i--) {
        const powerUp = this.powerUps[i];
        const distance = Math.sqrt(
          Math.pow(player.x - powerUp.x, 2) + 
          Math.pow(player.y - powerUp.y, 2)
        );
        
        if (distance < player.size + powerUp.size) {
          // Apply power-up effect
          this.applyPowerUp(player, powerUp);
          this.powerUps.splice(i, 1);
          
          // Broadcast power-up collected
          this.io.to(this.id).emit('powerUpCollected', {
            playerId: player.id,
            powerUpId: powerUp.id,
            type: powerUp.type
          });
        }
      }
    }
  }

  spawnResources() {
    const now = Date.now();
    if (now - this.lastResourceSpawn > this.resourceSpawnRate) {
      this.spawnResource();
      this.lastResourceSpawn = now;
    }
  }

  spawnPowerUps() {
    const now = Date.now();
    if (now - this.lastPowerUpSpawn > this.powerUpSpawnRate) {
      this.spawnPowerUp();
      this.lastPowerUpSpawn = now;
    }
  }

  spawnResource() {
    const resource = {
      id: Math.random().toString(36).substring(2),
      x: Math.random() * 4000 - 2000,
      y: Math.random() * 4000 - 2000,
      size: 15,
      value: Math.floor(Math.random() * 10) + 5,
      rails: Math.floor(Math.random() * 5) + 1,
      type: 'resource'
    };
    
    this.resources.push(resource);
    
    // Broadcast new resource
    this.io.to(this.id).emit('resourceSpawned', resource);
  }

  spawnPowerUp() {
    const types = ['speed', 'shield', 'magnet', 'boost'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const powerUp = {
      id: Math.random().toString(36).substring(2),
      x: Math.random() * 4000 - 2000,
      y: Math.random() * 4000 - 2000,
      size: 20,
      type: type,
      duration: 10000 // 10 seconds
    };
    
    this.powerUps.push(powerUp);
    
    // Broadcast new power-up
    this.io.to(this.id).emit('powerUpSpawned', powerUp);
  }

  applyPowerUp(player, powerUp) {
    switch (powerUp.type) {
      case 'speed':
        player.maxSpeed *= 1.5;
        setTimeout(() => player.maxSpeed /= 1.5, powerUp.duration);
        break;
      case 'shield':
        player.shield = true;
        setTimeout(() => player.shield = false, powerUp.duration);
        break;
      case 'magnet':
        player.magnet = true;
        setTimeout(() => player.magnet = false, powerUp.duration);
        break;
      case 'boost':
        player.vx *= 2;
        player.vy *= 2;
        break;
    }
  }

  placeRail(player, data) {
    if (player.rails <= 0) return false;
    
    const rail = new RailSegment(
      data.x || player.x,
      data.y || player.y,
      data.angle || Math.atan2(player.vy, player.vx),
      player.id
    );
    
    this.rails.push(rail);
    player.rails--;
    
    // Broadcast rail placed
    this.io.to(this.id).emit('railPlaced', {
      rail: rail.getState(),
      playerId: player.id
    });
    
    return true;
  }

  isPlayerOnRails(player) {
    // Oyuncu ray üzerinde mi kontrol et
    // Şimdilik basit bir kontrol - oyuncu merkeze yakınsa ray üzerinde sayılır
    const centerDistance = Math.sqrt(player.x * player.x + player.y * player.y);
    
    // Eğer hiç ray yoksa, oyuncuya biraz zaman ver
    if (this.rails.length === 0) {
      return centerDistance < 1000; // Başlangıçta daha geniş alan
    }
    
    // Ray varsa, en yakın ray'a olan mesafeyi kontrol et
    let minDistance = Infinity;
    for (const rail of this.rails) {
      const distance = Math.sqrt(
        Math.pow(player.x - rail.x, 2) + Math.pow(player.y - rail.y, 2)
      );
      minDistance = Math.min(minDistance, distance);
    }
    
    // Ray'a 50 piksel mesafede olabilir
    return minDistance < 50;
  }

  updateSpatialHash() {
    this.spatialHash.clear();
    
    // Add players to spatial hash
    for (const [id, player] of this.players) {
      const cellX = Math.floor(player.x / this.cellSize);
      const cellY = Math.floor(player.y / this.cellSize);
      const cellKey = `${cellX},${cellY}`;
      
      if (!this.spatialHash.has(cellKey)) {
        this.spatialHash.set(cellKey, []);
      }
      this.spatialHash.get(cellKey).push(player);
    }
  }

  broadcastGameState() {
    const gameState = this.getGameState();
    this.io.to(this.id).emit('gameState', gameState);
  }

  getGameState() {
    return {
      players: Array.from(this.players.values()).map(p => p.getState()),
      rails: this.rails.map(r => r.getState()),
      resources: this.resources,
      powerUps: this.powerUps,
      timestamp: Date.now()
    };
  }

  getPlayerCount() {
    return this.players.size;
  }
}

module.exports = GameRoom; 