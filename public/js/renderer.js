// Renderer for RailRush.io

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            zoom: 1,
            targetZoom: 1
        };
        
        this.particles = [];
        this.effects = [];
        
        this.background = {
            stars: [],
            clouds: []
        };
        
        this.init();
    }

    init() {
        this.resize();
        this.generateBackground();
        
        // Handle window resize
        window.addEventListener('resize', this.resize.bind(this));
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    generateBackground() {
        // Generate stars
        this.background.stars = [];
        for (let i = 0; i < 200; i++) {
            this.background.stars.push({
                x: Math.random() * 4000 - 2000,
                y: Math.random() * 4000 - 2000,
                size: Math.random() * 2 + 1,
                brightness: Math.random() * 0.5 + 0.5,
                twinkle: Math.random() * Math.PI * 2
            });
        }
        
        // Generate clouds
        this.background.clouds = [];
        for (let i = 0; i < 20; i++) {
            this.background.clouds.push({
                x: Math.random() * 4000 - 2000,
                y: Math.random() * 2000 - 1000,
                width: Math.random() * 300 + 100,
                height: Math.random() * 100 + 50,
                speed: Math.random() * 0.5 + 0.1,
                opacity: Math.random() * 0.3 + 0.1
            });
        }
    }

    updateCamera(targetX, targetY) {
        this.camera.targetX = targetX;
        this.camera.targetY = targetY;
        
        // Smooth camera follow
        this.camera.x += (this.camera.targetX - this.camera.x) * 0.1;
        this.camera.y += (this.camera.targetY - this.camera.y) * 0.1;
    }

    clear() {
        this.ctx.clearRect(0, 0, this.width, this.height);
    }

    render(gameState) {
        this.clear();
        
        // Apply camera transform
        this.ctx.save();
        this.ctx.translate(this.width / 2, this.height / 2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Render background
        this.renderBackground();
        
        // Render game objects
        this.renderRails(gameState.rails);
        this.renderResources(gameState.resources);
        this.renderPowerUps(gameState.powerUps);
        this.renderPlayers(gameState.players);
        
        // Render particles and effects
        this.renderParticles();
        this.renderEffects();
        
        this.ctx.restore();
        
        // Render UI elements (not affected by camera)
        this.renderUI(gameState);
    }

    renderBackground() {
        // Render gradient background
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 2000);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(0.5, '#16213e');
        gradient.addColorStop(1, '#0f3460');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-2000, -2000, 4000, 4000);
        
        // Render stars
        this.ctx.save();
        this.ctx.globalAlpha = 0.8;
        for (const star of this.background.stars) {
            star.twinkle += 0.02;
            const brightness = star.brightness * (0.5 + 0.5 * Math.sin(star.twinkle));
            
            this.ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
        
        // Render clouds
        this.ctx.save();
        for (const cloud of this.background.clouds) {
            cloud.x += cloud.speed;
            if (cloud.x > 2500) cloud.x = -2500;
            
            this.ctx.globalAlpha = cloud.opacity;
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(cloud.x, cloud.y, cloud.width, cloud.height);
        }
        this.ctx.restore();
    }

    renderRails(rails) {
        for (const rail of rails) {
            this.renderRail(rail);
        }
    }

    renderRail(rail) {
        const age = Date.now() - rail.createdAt;
        const maxAge = 30000; // 30 seconds
        const alpha = Math.max(0.3, 1 - age / maxAge);
        
        // Rail glow effect
        this.ctx.save();
        this.ctx.globalAlpha = alpha * 0.3;
        this.ctx.strokeStyle = rail.color;
        this.ctx.lineWidth = rail.width + 4;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(rail.x, rail.y);
        this.ctx.lineTo(rail.endX, rail.endY);
        this.ctx.stroke();
        this.ctx.restore();
        
        // Main rail
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.strokeStyle = rail.color;
        this.ctx.lineWidth = rail.width;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(rail.x, rail.y);
        this.ctx.lineTo(rail.endX, rail.endY);
        this.ctx.stroke();
        this.ctx.restore();
        
        // Rail connection points
        this.ctx.save();
        this.ctx.globalAlpha = alpha * 0.8;
        this.ctx.fillStyle = rail.color;
        this.ctx.beginPath();
        this.ctx.arc(rail.x, rail.y, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(rail.endX, rail.endY, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
    }

    renderResources(resources) {
        for (const resource of resources) {
            this.renderResource(resource);
        }
    }

    renderResource(resource) {
        // Resource glow
        this.ctx.save();
        this.ctx.globalAlpha = 0.5;
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(resource.x, resource.y, resource.size + 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // Main resource
        this.ctx.save();
        this.ctx.fillStyle = '#ffd700';
        this.ctx.beginPath();
        this.ctx.arc(resource.x, resource.y, resource.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // Sparkle effect
        const time = Date.now() * 0.001;
        const sparkleCount = 4;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (time + i * Math.PI * 2 / sparkleCount) % (Math.PI * 2);
            const distance = resource.size + 8;
            const x = resource.x + Math.cos(angle) * distance;
            const y = resource.y + Math.sin(angle) * distance;
            
            this.ctx.save();
            this.ctx.globalAlpha = 0.8 * Math.sin(time * 3 + i);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    renderPowerUps(powerUps) {
        for (const powerUp of powerUps) {
            this.renderPowerUp(powerUp);
        }
    }

    renderPowerUp(powerUp) {
        const colors = {
            speed: '#ff6b6b',
            shield: '#4ecdc4',
            magnet: '#45b7d1',
            boost: '#96ceb4'
        };
        
        const color = colors[powerUp.type] || '#ffffff';
        
        // Power-up glow
        this.ctx.save();
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(powerUp.x, powerUp.y, powerUp.size + 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // Main power-up
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(powerUp.x, powerUp.y, powerUp.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // Power-up icon
        const icons = {
            speed: '⚡',
            shield: '🛡️',
            magnet: '🧲',
            boost: '🚀'
        };
        
        const icon = icons[powerUp.type] || '?';
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(icon, powerUp.x, powerUp.y);
        this.ctx.restore();
    }

    renderPlayers(players) {
        for (const player of players) {
            this.renderPlayer(player);
        }
    }

    renderPlayer(player) {
        if (!player.alive) return;
        
        // Player trail
        this.renderPlayerTrail(player);
        
        // Player glow
        this.ctx.save();
        this.ctx.globalAlpha = 0.4;
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.size + 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // Main player body
        this.ctx.save();
        this.ctx.fillStyle = player.color;
        this.ctx.beginPath();
        this.ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
        
        // Player direction indicator
        const speed = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
        if (speed > 10) {
            const angle = Math.atan2(player.vy, player.vx);
            const indicatorLength = player.size + 8;
            
            this.ctx.save();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(player.x, player.y);
            this.ctx.lineTo(
                player.x + Math.cos(angle) * indicatorLength,
                player.y + Math.sin(angle) * indicatorLength
            );
            this.ctx.stroke();
            this.ctx.restore();
        }
        
        // Player name
        this.ctx.save();
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'bottom';
        this.ctx.fillText(player.name, player.x, player.y - player.size - 5);
        this.ctx.restore();
        
        // Shield effect
        if (player.shield) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.6;
            this.ctx.strokeStyle = '#4ecdc4';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(player.x, player.y, player.size + 8, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.restore();
        }
    }

    renderPlayerTrail(player) {
        // Simple trail effect
        const trailLength = 5;
        for (let i = 1; i <= trailLength; i++) {
            const alpha = (trailLength - i) / trailLength * 0.3;
            const size = player.size * (trailLength - i) / trailLength;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = player.color;
            this.ctx.beginPath();
            this.ctx.arc(
                player.x - player.vx * i * 0.1,
                player.y - player.vy * i * 0.1,
                size,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    renderParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(16); // 60fps
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            } else {
                particle.draw(this.ctx);
            }
        }
    }

    renderEffects() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.update(16);
            
            if (effect.finished) {
                this.effects.splice(i, 1);
            } else {
                effect.draw(this.ctx);
            }
        }
    }

    renderUI(gameState) {
        // This will be handled by the UI manager
        // Renderer only handles game world rendering
    }

    // Particle effects
    createExplosion(x, y, color = '#ff6b6b', count = 20) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 100 + 50;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const life = Math.random() * 1000 + 500;
            const size = Math.random() * 4 + 2;
            
            const particle = Utils.createParticle(x, y, vx, vy, life, color, size);
            this.particles.push(particle);
        }
    }

    createSparkle(x, y, color = '#ffd700') {
        const particle = Utils.createParticle(
            x, y,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            500,
            color,
            Math.random() * 3 + 1
        );
        this.particles.push(particle);
    }

    createRailEffect(x, y, angle, color) {
        const length = 80;
        const endX = x + Math.cos(angle) * length;
        const endY = y + Math.sin(angle) * length;
        
        // Create particles along the rail
        for (let i = 0; i < 10; i++) {
            const t = i / 10;
            const px = x + (endX - x) * t;
            const py = y + (endY - y) * t;
            
            this.createSparkle(px, py, color);
        }
    }

    // Camera effects
    shake(intensity = 10, duration = 200) {
        const startTime = Date.now();
        const originalX = this.camera.x;
        const originalY = this.camera.y;
        
        const shakeEffect = {
            update: (deltaTime) => {
                const elapsed = Date.now() - startTime;
                if (elapsed < duration) {
                    const factor = 1 - elapsed / duration;
                    this.camera.x = originalX + (Math.random() - 0.5) * intensity * factor;
                    this.camera.y = originalY + (Math.random() - 0.5) * intensity * factor;
                } else {
                    this.camera.x = originalX;
                    this.camera.y = originalY;
                    shakeEffect.finished = true;
                }
            },
            draw: () => {},
            finished: false
        };
        
        this.effects.push(shakeEffect);
    }

    // Performance monitoring
    getFPS() {
        const now = performance.now();
        const delta = now - (this.lastFrameTime || now);
        this.lastFrameTime = now;
        return 1000 / delta;
    }
}

// Global renderer instance
window.renderer = null; 