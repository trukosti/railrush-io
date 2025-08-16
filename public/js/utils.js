// Utility functions for RailRush.io

class Utils {
    // Math utilities
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    static lerp(start, end, factor) {
        return start + (end - start) * factor;
    }

    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static distanceSquared(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return dx * dx + dy * dy;
    }

    static angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    }

    static normalizeAngle(angle) {
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
        return angle;
    }

    static randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // Color utilities
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    static interpolateColor(color1, color2, factor) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        if (!rgb1 || !rgb2) return color1;
        
        const r = Math.round(this.lerp(rgb1.r, rgb2.r, factor));
        const g = Math.round(this.lerp(rgb1.g, rgb2.g, factor));
        const b = Math.round(this.lerp(rgb1.b, rgb2.b, factor));
        
        return this.rgbToHex(r, g, b);
    }

    // Canvas utilities
    static drawCircle(ctx, x, y, radius, color, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    static drawLine(ctx, x1, y1, x2, y2, color, width = 1, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    }

    static drawRect(ctx, x, y, width, height, color, alpha = 1) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, width, height);
        ctx.restore();
    }

    static drawText(ctx, text, x, y, font, color, alpha = 1, align = 'center') {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.fillText(text, x, y);
        ctx.restore();
    }

    // Animation utilities
    static easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    static easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    static easeIn(t) {
        return t * t * t;
    }

    // Particle system utilities
    static createParticle(x, y, vx, vy, life, color, size) {
        return {
            x, y, vx, vy, life, maxLife: life, color, size,
            update(deltaTime) {
                this.x += this.vx * deltaTime;
                this.y += this.vy * deltaTime;
                this.life -= deltaTime;
                this.vx *= 0.98; // Friction
                this.vy *= 0.98;
            },
            draw(ctx) {
                const alpha = this.life / this.maxLife;
                this.drawCircle(ctx, this.x, this.y, this.size, this.color, alpha);
            }
        };
    }

    // Input utilities
    static isKeyPressed(key) {
        return window.keys && window.keys[key];
    }

    static isMousePressed() {
        return window.mouse && window.mouse.pressed;
    }

    static getMousePosition() {
        return window.mouse ? { x: window.mouse.x, y: window.mouse.y } : { x: 0, y: 0 };
    }

    // Audio utilities
    static playSound(audioElement, volume = 1) {
        if (audioElement) {
            audioElement.volume = volume;
            audioElement.currentTime = 0;
            audioElement.play().catch(e => console.log('Audio play failed:', e));
        }
    }

    static stopSound(audioElement) {
        if (audioElement) {
            audioElement.pause();
            audioElement.currentTime = 0;
        }
    }

    // Storage utilities
    static saveToLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
    }

    static loadFromLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Failed to load from localStorage:', e);
            return defaultValue;
        }
    }

    // Performance utilities
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Network utilities
    static formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Game-specific utilities
    static calculateScore(speed, distance, railsPlaced) {
        return Math.floor(speed * 0.1 + distance * 0.01 + railsPlaced * 10);
    }

    static getRailPlacementPosition(playerX, playerY, playerVx, playerVy) {
        const speed = Math.sqrt(playerVx * playerVx + playerVy * playerVy);
        const angle = Math.atan2(playerVy, playerVx);
        const distance = Math.max(20, speed * 0.5);
        
        return {
            x: playerX + Math.cos(angle) * distance,
            y: playerY + Math.sin(angle) * distance,
            angle: angle
        };
    }

    static checkRailCollision(playerX, playerY, railX, railY, railEndX, railEndY, tolerance = 5) {
        const A = playerX - railX;
        const B = playerY - railY;
        const C = railEndX - railX;
        const D = railEndY - railY;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        
        if (lenSq === 0) {
            return this.distance(playerX, playerY, railX, railY) <= tolerance;
        }
        
        let param = dot / lenSq;
        
        let xx, yy;
        if (param < 0) {
            xx = railX;
            yy = railY;
        } else if (param > 1) {
            xx = railEndX;
            yy = railEndY;
        } else {
            xx = railX + param * C;
            yy = railY + param * D;
        }
        
        const dx = playerX - xx;
        const dy = playerY - yy;
        return Math.sqrt(dx * dx + dy * dy) <= tolerance;
    }

    // Debug utilities
    static log(...args) {
        if (window.DEBUG_MODE) {
            console.log('[RailRush]', ...args);
        }
    }

    static warn(...args) {
        if (window.DEBUG_MODE) {
            console.warn('[RailRush]', ...args);
        }
    }

    static error(...args) {
        console.error('[RailRush]', ...args);
    }
}

// Global utility functions
window.Utils = Utils; 