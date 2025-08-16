// Game logic for RailRush.io

class Game {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.isPlaying = false;
        this.gameState = {
            players: [],
            rails: [],
            resources: [],
            powerUps: [],
            timestamp: 0
        };
        
        this.playerId = null;
        this.playerName = '';
        this.playerSkin = 'default';
        
        this.interpolationBuffer = [];
        this.lastServerUpdate = 0;
        this.serverTickRate = 20; // 20 Hz server tick
        
        this.localPlayer = {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            score: 0,
            rails: 50,
            alive: true
        };
        
        this.inputBuffer = [];
        this.lastInputTime = 0;
        
        this.init();
    }

    init() {
        this.connectToServer();
        this.setupEventListeners();
    }

    connectToServer() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.isConnected = true;
        });
        
        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.isConnected = false;
            this.isPlaying = false;
        });
        
        this.socket.on('gameJoined', (data) => {
            this.handleGameJoined(data);
        });
        
        this.socket.on('gameState', (data) => {
            this.handleGameState(data);
        });
        
        this.socket.on('playerJoined', (data) => {
            this.handlePlayerJoined(data);
        });
        
        this.socket.on('playerLeft', (data) => {
            this.handlePlayerLeft(data);
        });
        
        this.socket.on('railPlaced', (data) => {
            this.handleRailPlaced(data);
        });
        
        this.socket.on('resourceSpawned', (data) => {
            this.handleResourceSpawned(data);
        });
        
        this.socket.on('resourceCollected', (data) => {
            this.handleResourceCollected(data);
        });
        
        this.socket.on('powerUpSpawned', (data) => {
            this.handlePowerUpSpawned(data);
        });
        
        this.socket.on('powerUpCollected', (data) => {
            this.handlePowerUpCollected(data);
        });
    }

    setupEventListeners() {
        // Input handling
        document.addEventListener('keydown', (e) => {
            if (this.isPlaying) {
                this.handleInput();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (this.isPlaying) {
                this.handleInput();
            }
        });
    }

    joinGame(playerName, skin = 'default') {
        if (!this.isConnected) {
            console.error('Not connected to server');
            return;
        }
        
        this.playerName = playerName;
        this.playerSkin = skin;
        
        this.socket.emit('joinGame', {
            playerName: playerName,
            skin: skin
        });
    }

    handleGameJoined(data) {
        this.playerId = data.playerId;
        this.gameState = data.gameState;
        this.isPlaying = true;
        
        // Find local player
        const localPlayer = this.gameState.players.find(p => p.id === this.playerId);
        if (localPlayer) {
            this.localPlayer = { ...localPlayer };
            // Ensure player starts alive
            this.localPlayer.alive = true;
        }
        
        console.log('Joined game:', data);
        
        // Start game loop
        this.startGameLoop();
    }

    handleGameState(data) {
        // Add to interpolation buffer
        this.interpolationBuffer.push({
            ...data,
            timestamp: Date.now()
        });
        
        // Keep only recent updates
        const maxBufferSize = 5;
        if (this.interpolationBuffer.length > maxBufferSize) {
            this.interpolationBuffer.shift();
        }
        
        // Update local player state from server
        if (this.playerId) {
            const serverPlayer = data.players.find(p => p.id === this.playerId);
            if (serverPlayer) {
                this.localPlayer.alive = serverPlayer.alive;
                this.localPlayer.score = serverPlayer.score;
                this.localPlayer.rails = serverPlayer.rails;
            }
        }
        
        this.lastServerUpdate = Date.now();
    }

    handlePlayerJoined(data) {
        const existingIndex = this.gameState.players.findIndex(p => p.id === data.player.id);
        if (existingIndex >= 0) {
            this.gameState.players[existingIndex] = data.player;
        } else {
            this.gameState.players.push(data.player);
        }
    }

    handlePlayerLeft(data) {
        this.gameState.players = this.gameState.players.filter(p => p.id !== data.playerId);
    }

    handleRailPlaced(data) {
        this.gameState.rails.push(data.rail);
        
        // Create visual effect
        if (window.renderer) {
            window.renderer.createRailEffect(data.rail.x, data.rail.y, data.rail.angle, data.rail.color);
        }
        
        // Play sound
        Utils.playSound(document.getElementById('railSound'), 0.3);
    }

    handleResourceSpawned(data) {
        this.gameState.resources.push(data);
    }

    handleResourceCollected(data) {
        this.gameState.resources = this.gameState.resources.filter(r => r.id !== data.resourceId);
        
        // Update local player if it was us
        if (data.playerId === this.playerId) {
            this.localPlayer.score += data.score;
            this.localPlayer.rails += data.rails;
            
            // Create collection effect
            if (window.renderer) {
                window.renderer.createSparkle(this.localPlayer.x, this.localPlayer.y, '#ffd700');
            }
            
            // Play sound
            Utils.playSound(document.getElementById('collectSound'), 0.4);
        }
    }

    handlePowerUpSpawned(data) {
        this.gameState.powerUps.push(data);
    }

    handlePowerUpCollected(data) {
        this.gameState.powerUps = this.gameState.powerUps.filter(p => p.id !== data.powerUpId);
        
        // Update local player if it was us
        if (data.playerId === this.playerId) {
            // Apply power-up effect locally
            this.applyPowerUpEffect(data.type);
            
            // Create collection effect
            if (window.renderer) {
                window.renderer.createExplosion(this.localPlayer.x, this.localPlayer.y, '#4ecdc4', 15);
            }
            
            // Play sound
            Utils.playSound(document.getElementById('collectSound'), 0.5);
        }
    }

    applyPowerUpEffect(type) {
        switch (type) {
            case 'speed':
                this.localPlayer.maxSpeed *= 1.5;
                setTimeout(() => {
                    this.localPlayer.maxSpeed /= 1.5;
                }, 10000);
                break;
            case 'shield':
                this.localPlayer.shield = true;
                setTimeout(() => {
                    this.localPlayer.shield = false;
                }, 10000);
                break;
            case 'magnet':
                this.localPlayer.magnet = true;
                setTimeout(() => {
                    this.localPlayer.magnet = false;
                }, 10000);
                break;
            case 'boost':
                this.localPlayer.vx *= 2;
                this.localPlayer.vy *= 2;
                break;
        }
    }

    handleInput() {
        const input = window.inputManager.getInputState();
        
        // Send input to server
        if (this.socket && this.isPlaying) {
            this.socket.emit('playerInput', input);
        }
        
        // Handle rail placement
        if (input.space && this.localPlayer.rails > 0) {
            this.placeRail();
        }
        
        // Update local player input
        this.updateLocalPlayer(input);
    }

    updateLocalPlayer(input) {
        // Calculate movement
        let dx = 0;
        let dy = 0;
        
        if (input.up) dy -= 1;
        if (input.down) dy += 1;
        if (input.left) dx -= 1;
        if (input.right) dx += 1;
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }
        
        // Apply acceleration
        const acceleration = 50;
        const friction = 0.95;
        const maxSpeed = this.localPlayer.maxSpeed || 200;
        
        if (dx !== 0 || dy !== 0) {
            this.localPlayer.vx += dx * acceleration * 0.016; // 60fps
            this.localPlayer.vy += dy * acceleration * 0.016;
        }
        
        // Apply friction
        this.localPlayer.vx *= friction;
        this.localPlayer.vy *= friction;
        
        // Limit speed
        const currentSpeed = Math.sqrt(this.localPlayer.vx * this.localPlayer.vx + this.localPlayer.vy * this.localPlayer.vy);
        if (currentSpeed > maxSpeed) {
            const scale = maxSpeed / currentSpeed;
            this.localPlayer.vx *= scale;
            this.localPlayer.vy *= scale;
        }
        
        // Update position
        this.localPlayer.x += this.localPlayer.vx * 0.016;
        this.localPlayer.y += this.localPlayer.vy * 0.016;
        
        // Update speed for scoring
        this.localPlayer.speed = currentSpeed;
    }

    placeRail() {
        if (this.localPlayer.rails <= 0) return;
        
        const railData = Utils.getRailPlacementPosition(
            this.localPlayer.x,
            this.localPlayer.y,
            this.localPlayer.vx,
            this.localPlayer.vy
        );
        
        if (this.socket && this.isPlaying) {
            this.socket.emit('placeRail', railData);
        }
    }

    startGameLoop() {
        const gameLoop = () => {
            if (!this.isPlaying) return;
            
            // Check if player is still alive
            if (!this.localPlayer.alive) {
                console.log('Player died, showing game over');
                this.isPlaying = false;
                if (window.ui) {
                    window.ui.showGameOver(this.localPlayer.score, this.localPlayer.rails);
                }
                return;
            }
            
            // Handle input
            this.handleInput();
            
            // Interpolate game state
            this.interpolateGameState();
            
            // Update camera
            if (window.renderer) {
                window.renderer.updateCamera(this.localPlayer.x, this.localPlayer.y);
            }
            
            // Render game
            if (window.renderer) {
                window.renderer.render(this.gameState);
            }
            
            // Update UI
            this.updateUI();
            
            // Continue loop
            requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    }

    interpolateGameState() {
        if (this.interpolationBuffer.length < 2) return;
        
        const now = Date.now();
        const serverDelay = 100; // 100ms server delay
        
        // Find the two states to interpolate between
        let state1 = null;
        let state2 = null;
        
        for (let i = 0; i < this.interpolationBuffer.length - 1; i++) {
            const s1 = this.interpolationBuffer[i];
            const s2 = this.interpolationBuffer[i + 1];
            
            if (now - serverDelay >= s1.timestamp && now - serverDelay < s2.timestamp) {
                state1 = s1;
                state2 = s2;
                break;
            }
        }
        
        if (state1 && state2) {
            const alpha = (now - serverDelay - state1.timestamp) / (state2.timestamp - state1.timestamp);
            
            // Interpolate players
            this.gameState.players = this.interpolatePlayers(state1.players, state2.players, alpha);
            
            // Interpolate rails
            this.gameState.rails = state2.rails; // Rails don't need interpolation
            
            // Interpolate resources and power-ups
            this.gameState.resources = state2.resources;
            this.gameState.powerUps = state2.powerUps;
        }
    }

    interpolatePlayers(players1, players2, alpha) {
        const interpolatedPlayers = [];
        
        for (const player2 of players2) {
            const player1 = players1.find(p => p.id === player2.id);
            
            if (player1) {
                // Interpolate position and velocity
                const interpolatedPlayer = {
                    ...player2,
                    x: Utils.lerp(player1.x, player2.x, alpha),
                    y: Utils.lerp(player1.y, player2.y, alpha),
                    vx: Utils.lerp(player1.vx, player2.vx, alpha),
                    vy: Utils.lerp(player1.vy, player2.vy, alpha)
                };
                
                interpolatedPlayers.push(interpolatedPlayer);
            } else {
                interpolatedPlayers.push(player2);
            }
        }
        
        return interpolatedPlayers;
    }

    updateUI() {
        // Update player info
        const playerNameElement = document.getElementById('playerName');
        const playerScoreElement = document.getElementById('playerScore');
        const railCountElement = document.getElementById('railCount');
        const speedValueElement = document.getElementById('speedValue');
        
        if (playerNameElement) {
            playerNameElement.textContent = this.playerName;
        }
        
        if (playerScoreElement) {
            playerScoreElement.textContent = this.localPlayer.score;
        }
        
        if (railCountElement) {
            railCountElement.textContent = this.localPlayer.rails;
        }
        
        if (speedValueElement) {
            speedValueElement.textContent = Math.round(this.localPlayer.speed);
        }
    }

    pause() {
        this.isPlaying = false;
        // Show pause menu
        if (window.ui) {
            window.ui.showPauseMenu();
        }
    }

    resume() {
        this.isPlaying = true;
        this.startGameLoop();
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.isPlaying = false;
        this.isConnected = false;
    }

    // Get current game state
    getGameState() {
        return this.gameState;
    }

    // Get local player state
    getLocalPlayer() {
        return this.localPlayer;
    }

    // Check if player is alive
    isAlive() {
        return this.localPlayer.alive;
    }

    // Get player score
    getScore() {
        return this.localPlayer.score;
    }

    // Get player rail count
    getRailCount() {
        return this.localPlayer.rails;
    }

    // Event system for analytics and debugging
    on(eventName, callback) {
        if (!this.eventListeners) {
            this.eventListeners = {};
        }
        
        if (!this.eventListeners[eventName]) {
            this.eventListeners[eventName] = [];
        }
        
        this.eventListeners[eventName].push(callback);
    }

    emit(eventName, data) {
        if (this.eventListeners && this.eventListeners[eventName]) {
            this.eventListeners[eventName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('Event callback error:', error);
                }
            });
        }
    }
}

// Global game instance
window.game = new Game(); 