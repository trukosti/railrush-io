class Player {
  constructor(id, name, skin = 'default') {
    this.id = id;
    this.name = name;
    this.skin = skin;
    
    // Position and movement - Başlangıç pozisyonu tam merkez
    this.x = 0; // Tam merkez
    this.y = 0; // Tam merkez
    this.vx = 0;
    this.vy = 0;
    this.speed = 0;
    this.maxSpeed = 200;
    this.acceleration = 50;
    this.friction = 0.95;
    
    // Game state
    this.score = 0;
    this.rails = 50; // Starting rail count
    this.maxRails = 100;
    this.alive = true;
    this.lastRailTime = 0;
    this.railCooldown = 500; // ms
    
    // Input state
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false
    };
    
    // Visual properties
    this.size = 20;
    this.color = this.generateColor();
    
    // Collision
    this.lastCollisionTime = 0;
    this.collisionCooldown = 1000; // ms
  }

  updateInput(inputData) {
    this.input = { ...this.input, ...inputData };
  }

  update(deltaTime) {
    if (!this.alive) return;
    
    // Handle input
    this.handleMovement(deltaTime);
    
    // Apply physics
    this.applyPhysics(deltaTime);
    
    // Update rail placement
    this.updateRailPlacement();
    
    // Check boundaries
    this.checkBoundaries();
  }

  handleMovement(deltaTime) {
    // Calculate movement direction
    let dx = 0;
    let dy = 0;
    
    if (this.input.up) dy -= 1;
    if (this.input.down) dy += 1;
    if (this.input.left) dx -= 1;
    if (this.input.right) dx += 1;
    
    // Normalize diagonal movement
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707; // 1/√2
      dy *= 0.707;
    }
    
    // Apply acceleration
    if (dx !== 0 || dy !== 0) {
      this.vx += dx * this.acceleration * deltaTime;
      this.vy += dy * this.acceleration * deltaTime;
    }
  }

  applyPhysics(deltaTime) {
    // Apply friction
    this.vx *= this.friction;
    this.vy *= this.friction;
    
    // Limit speed
    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (currentSpeed > this.maxSpeed) {
      const scale = this.maxSpeed / currentSpeed;
      this.vx *= scale;
      this.vy *= scale;
    }
    
    // Update position
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    
    // Update speed for scoring
    this.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
  }

  updateRailPlacement() {
    const now = Date.now();
    
    // Auto-place rails when moving fast
    if (this.input.space && this.speed > 50 && this.rails > 0 && 
        now - this.lastRailTime > this.railCooldown) {
      this.placeRail();
    }
  }

  placeRail() {
    if (this.rails <= 0) return false;
    
    const now = Date.now();
    if (now - this.lastRailTime < this.railCooldown) return false;
    
    this.rails--;
    this.lastRailTime = now;
    
    return {
      x: this.x,
      y: this.y,
      angle: Math.atan2(this.vy, this.vx),
      playerId: this.id
    };
  }

  checkBoundaries() {
    const boundary = 10000; // Çok daha geniş sınır
    
    if (Math.abs(this.x) > boundary || Math.abs(this.y) > boundary) {
      this.die('out_of_bounds');
    }
  }

  collideWith(otherPlayer) {
    const now = Date.now();
    if (now - this.lastCollisionTime < this.collisionCooldown) return;
    
    // Calculate collision response
    const dx = this.x - otherPlayer.x;
    const dy = this.y - otherPlayer.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < this.size + otherPlayer.size) {
      // Collision detected
      this.lastCollisionTime = now;
      otherPlayer.lastCollisionTime = now;
      
      // Push players apart
      const pushForce = 100;
      const pushX = (dx / distance) * pushForce;
      const pushY = (dy / distance) * pushForce;
      
      this.x += pushX;
      this.y += pushY;
      otherPlayer.x -= pushX;
      otherPlayer.y -= pushY;
      
      // Slow down both players
      this.vx *= 0.5;
      this.vy *= 0.5;
      otherPlayer.vx *= 0.5;
      otherPlayer.vy *= 0.5;
      
      // Check if either player goes off rails (daha esnek)
      // Şimdilik çarpışmada ölmesinler
      // if (!this.isOnRails()) {
      //   this.die('collision');
      // }
      // if (!otherPlayer.isOnRails()) {
      //   otherPlayer.die('collision');
      // }
    }
  }

  isOnRails() {
    // Basit ray kontrolü - oyuncu ray üzerinde mi?
    // Bu metod GameRoom tarafından çağrılacak ve gerçek ray pozisyonları kontrol edilecek
    return true; // Şimdilik true döndür, daha sonra gerçek kontrol eklenecek
  }

  die(reason) {
    this.alive = false;
    console.log(`Player ${this.name} died: ${reason}`);
  }

  addScore(points) {
    this.score += points;
  }

  addRails(count) {
    this.rails = Math.min(this.rails + count, this.maxRails);
  }

  generateColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getState() {
    return {
      id: this.id,
      name: this.name,
      skin: this.skin,
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      speed: this.speed,
      score: this.score,
      rails: this.rails,
      alive: this.alive,
      size: this.size,
      color: this.color
    };
  }
}

module.exports = Player; 