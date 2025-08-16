class RailSegment {
  constructor(x, y, angle, playerId) {
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.playerId = playerId;
    this.createdAt = Date.now();
    
    // Rail properties
    this.length = 80;
    this.width = 8;
    this.color = '#666666';
    
    // Calculate end points
    this.endX = this.x + Math.cos(this.angle) * this.length;
    this.endY = this.y + Math.sin(this.angle) * this.length;
    
    // Bounding box for collision detection
    this.updateBoundingBox();
  }

  updateBoundingBox() {
    const margin = this.width / 2;
    
    // Calculate bounding box
    const minX = Math.min(this.x, this.endX) - margin;
    const maxX = Math.max(this.x, this.endX) + margin;
    const minY = Math.min(this.y, this.endY) - margin;
    const maxY = Math.max(this.y, this.endY) + margin;
    
    this.boundingBox = {
      minX, maxX, minY, maxY
    };
  }

  // Check if a point is on this rail segment
  isPointOnRail(px, py, tolerance = 5) {
    // Check if point is within bounding box first
    if (px < this.boundingBox.minX || px > this.boundingBox.maxX ||
        py < this.boundingBox.minY || py > this.boundingBox.maxY) {
      return false;
    }
    
    // Calculate distance from point to line segment
    const distance = this.distanceToPoint(px, py);
    return distance <= tolerance;
  }

  // Calculate distance from point to line segment
  distanceToPoint(px, py) {
    const A = px - this.x;
    const B = py - this.y;
    const C = this.endX - this.x;
    const D = this.endY - this.y;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    
    if (lenSq === 0) {
      // Rail segment is a point
      return Math.sqrt(A * A + B * B);
    }
    
    let param = dot / lenSq;
    
    let xx, yy;
    if (param < 0) {
      xx = this.x;
      yy = this.y;
    } else if (param > 1) {
      xx = this.endX;
      yy = this.endY;
    } else {
      xx = this.x + param * C;
      yy = this.y + param * D;
    }
    
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Check collision with another rail segment
  intersectsWith(otherRail) {
    // Simple AABB check first
    if (this.boundingBox.maxX < otherRail.boundingBox.minX ||
        this.boundingBox.minX > otherRail.boundingBox.maxX ||
        this.boundingBox.maxY < otherRail.boundingBox.minY ||
        this.boundingBox.minY > otherRail.boundingBox.maxY) {
      return false;
    }
    
    // Line segment intersection test
    const x1 = this.x, y1 = this.y;
    const x2 = this.endX, y2 = this.endY;
    const x3 = otherRail.x, y3 = otherRail.y;
    const x4 = otherRail.endX, y4 = otherRail.endY;
    
    const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    
    if (Math.abs(denom) < 0.001) {
      // Lines are parallel
      return false;
    }
    
    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  }

  // Get rail direction vector
  getDirection() {
    return {
      x: Math.cos(this.angle),
      y: Math.sin(this.angle)
    };
  }

  // Get rail normal vector
  getNormal() {
    return {
      x: -Math.sin(this.angle),
      y: Math.cos(this.angle)
    };
  }

  // Check if player is on this rail
  isPlayerOnRail(player) {
    return this.isPointOnRail(player.x, player.y, player.size);
  }

  // Get rail state for client
  getState() {
    return {
      x: this.x,
      y: this.y,
      endX: this.endX,
      endY: this.endY,
      angle: this.angle,
      playerId: this.playerId,
      createdAt: this.createdAt,
      color: this.color,
      width: this.width
    };
  }

  // Get age of rail in milliseconds
  getAge() {
    return Date.now() - this.createdAt;
  }

  // Check if rail should decay
  shouldDecay(maxAge) {
    return this.getAge() > maxAge;
  }
}

module.exports = RailSegment; 