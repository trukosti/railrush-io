// UI management for RailRush.io

class UIManager {
    constructor() {
        this.currentScreen = 'loading';
        this.screens = {};
        this.settings = {
            soundVolume: 50,
            musicVolume: 30,
            particleEffects: true,
            showFPS: false
        };
        
        this.skins = [
            { id: 'default', name: 'Klasik', emoji: '🚂', unlocked: true },
            { id: 'steam', name: 'Buharlı', emoji: '🚂', unlocked: true },
            { id: 'electric', name: 'Elektrikli', emoji: '🚄', unlocked: false },
            { id: 'maglev', name: 'Maglev', emoji: '🚅', unlocked: false },
            { id: 'rocket', name: 'Roket', emoji: '🚀', unlocked: false }
        ];
        
        this.trails = [
            { id: 'default', name: 'Standart', unlocked: true },
            { id: 'fire', name: 'Ateş', unlocked: true },
            { id: 'ice', name: 'Buz', unlocked: false },
            { id: 'electric', name: 'Elektrik', unlocked: false },
            { id: 'rainbow', name: 'Gökkuşağı', unlocked: false }
        ];
        
        this.selectedSkin = 'default';
        this.selectedTrail = 'default';
        
        this.init();
    }

    init() {
        this.loadSettings();
        this.setupScreens();
        this.setupEventListeners();
        this.showScreen('loading');
        
        // Simulate loading
        setTimeout(() => {
            this.showScreen('mainMenu');
        }, 2000);
    }

    setupScreens() {
        this.screens = {
            loading: document.getElementById('loadingScreen'),
            mainMenu: document.getElementById('mainMenu'),
            nameInput: document.getElementById('nameInputScreen'),
            game: document.getElementById('gameScreen'),
            leaderboard: document.getElementById('leaderboardScreen'),
            settings: document.getElementById('settingsScreen'),
            customize: document.getElementById('customizeScreen')
        };
    }

    setupEventListeners() {
        // Main menu buttons
        document.getElementById('playButton')?.addEventListener('click', () => {
            this.showScreen('nameInput');
        });
        
        document.getElementById('customizeButton')?.addEventListener('click', () => {
            this.showScreen('customize');
        });
        
        document.getElementById('leaderboardButton')?.addEventListener('click', () => {
            this.loadLeaderboard();
            this.showScreen('leaderboard');
        });
        
        document.getElementById('settingsButton')?.addEventListener('click', () => {
            this.showScreen('settings');
        });
        
        // Name input screen
        document.getElementById('startGameButton')?.addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('backToMenuButton')?.addEventListener('click', () => {
            this.showScreen('mainMenu');
        });
        
        // Game over screen
        document.getElementById('playAgainButton')?.addEventListener('click', () => {
            this.restartGame();
        });
        
        document.getElementById('mainMenuButton')?.addEventListener('click', () => {
            this.endGame();
        });
        
        // Leaderboard screen
        document.getElementById('leaderboardBackButton')?.addEventListener('click', () => {
            this.showScreen('mainMenu');
        });
        
        // Settings screen
        document.getElementById('settingsBackButton')?.addEventListener('click', () => {
            this.saveSettings();
            this.showScreen('mainMenu');
        });
        
        // Customize screen
        document.getElementById('customizeBackButton')?.addEventListener('click', () => {
            this.showScreen('mainMenu');
        });
        
        // Settings controls
        this.setupSettingsControls();
        
        // Customize controls
        this.setupCustomizeControls();
        
        // Enter key for name input
        document.getElementById('playerNameInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.startGame();
            }
        });
    }

    setupSettingsControls() {
        const soundVolume = document.getElementById('soundVolume');
        const musicVolume = document.getElementById('musicVolume');
        const particleEffects = document.getElementById('particleEffects');
        const showFPS = document.getElementById('showFPS');
        
        if (soundVolume) {
            soundVolume.addEventListener('input', (e) => {
                this.settings.soundVolume = parseInt(e.target.value);
                document.getElementById('soundValue').textContent = e.target.value + '%';
            });
        }
        
        if (musicVolume) {
            musicVolume.addEventListener('input', (e) => {
                this.settings.musicVolume = parseInt(e.target.value);
                document.getElementById('musicValue').textContent = e.target.value + '%';
                this.updateMusicVolume();
            });
        }
        
        if (particleEffects) {
            particleEffects.addEventListener('change', (e) => {
                this.settings.particleEffects = e.target.checked;
            });
        }
        
        if (showFPS) {
            showFPS.addEventListener('change', (e) => {
                this.settings.showFPS = e.target.checked;
                this.toggleFPSDisplay();
            });
        }
    }

    setupCustomizeControls() {
        this.populateSkinGrid();
        this.populateTrailGrid();
    }

    populateSkinGrid() {
        const skinGrid = document.getElementById('skinGrid');
        if (!skinGrid) return;
        
        skinGrid.innerHTML = '';
        
        this.skins.forEach(skin => {
            const skinItem = document.createElement('div');
            skinItem.className = `skin-item ${skin.unlocked ? '' : 'locked'} ${this.selectedSkin === skin.id ? 'selected' : ''}`;
            
            skinItem.innerHTML = `
                <div class="skin-preview">${skin.emoji}</div>
                <div class="skin-name">${skin.name}</div>
                ${!skin.unlocked ? '<div class="lock-icon">🔒</div>' : ''}
            `;
            
            if (skin.unlocked) {
                skinItem.addEventListener('click', () => {
                    this.selectSkin(skin.id);
                });
            }
            
            skinGrid.appendChild(skinItem);
        });
    }

    populateTrailGrid() {
        const trailGrid = document.getElementById('trailGrid');
        if (!trailGrid) return;
        
        trailGrid.innerHTML = '';
        
        this.trails.forEach(trail => {
            const trailItem = document.createElement('div');
            trailItem.className = `trail-item ${trail.unlocked ? '' : 'locked'} ${this.selectedTrail === trail.id ? 'selected' : ''}`;
            
            trailItem.innerHTML = `
                <div class="trail-preview">✨</div>
                <div class="trail-name">${trail.name}</div>
                ${!trail.unlocked ? '<div class="lock-icon">🔒</div>' : ''}
            `;
            
            if (trail.unlocked) {
                trailItem.addEventListener('click', () => {
                    this.selectTrail(trail.id);
                });
            }
            
            trailGrid.appendChild(trailItem);
        });
    }

    selectSkin(skinId) {
        this.selectedSkin = skinId;
        this.populateSkinGrid();
        this.saveCustomization();
    }

    selectTrail(trailId) {
        this.selectedTrail = trailId;
        this.populateTrailGrid();
        this.saveCustomization();
    }

    showScreen(screenName) {
        // Hide all screens
        Object.values(this.screens).forEach(screen => {
            if (screen) {
                screen.classList.add('hidden');
            }
        });
        
        // Show target screen
        const targetScreen = this.screens[screenName];
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            this.currentScreen = screenName;
        }
        
        // Special handling for different screens
        switch (screenName) {
            case 'mainMenu':
                this.updateMainMenuStats();
                break;
            case 'settings':
                this.loadSettingsToUI();
                break;
            case 'customize':
                this.populateSkinGrid();
                this.populateTrailGrid();
                break;
            case 'game':
                this.initializeGame();
                break;
        }
    }

    updateMainMenuStats() {
        // Update active players and games count
        fetch('/stats')
            .then(response => response.json())
            .then(data => {
                document.getElementById('activePlayers').textContent = data.totalPlayers || 0;
                document.getElementById('activeGames').textContent = data.activeGames || 0;
            })
            .catch(error => {
                console.error('Failed to fetch stats:', error);
            });
    }

    loadSettingsToUI() {
        const soundVolume = document.getElementById('soundVolume');
        const musicVolume = document.getElementById('musicVolume');
        const particleEffects = document.getElementById('particleEffects');
        const showFPS = document.getElementById('showFPS');
        
        if (soundVolume) {
            soundVolume.value = this.settings.soundVolume;
            document.getElementById('soundValue').textContent = this.settings.soundVolume + '%';
        }
        
        if (musicVolume) {
            musicVolume.value = this.settings.musicVolume;
            document.getElementById('musicValue').textContent = this.settings.musicVolume + '%';
        }
        
        if (particleEffects) {
            particleEffects.checked = this.settings.particleEffects;
        }
        
        if (showFPS) {
            showFPS.checked = this.settings.showFPS;
        }
    }

    startGame() {
        const playerNameInput = document.getElementById('playerNameInput');
        const playerName = playerNameInput?.value.trim();
        
        if (!playerName || playerName.length < 2) {
            alert('Lütfen en az 2 karakterlik bir isim girin!');
            return;
        }
        
        if (playerName.length > 15) {
            alert('İsim en fazla 15 karakter olabilir!');
            return;
        }
        
        // Join game
        if (window.game) {
            window.game.joinGame(playerName, this.selectedSkin);
            this.showScreen('game');
        }
    }

    initializeGame() {
        // Initialize renderer if not already done
        if (!window.renderer) {
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                window.renderer = new Renderer(canvas);
            }
        }
        
        // Start background music
        this.startBackgroundMusic();
        
        // Show FPS counter if enabled
        this.toggleFPSDisplay();
    }

    startBackgroundMusic() {
        const bgMusic = document.getElementById('bgMusic');
        if (bgMusic && this.settings.musicVolume > 0) {
            bgMusic.volume = this.settings.musicVolume / 100;
            bgMusic.play().catch(e => {
                console.log('Background music failed to play:', e);
            });
        }
    }

    updateMusicVolume() {
        const bgMusic = document.getElementById('bgMusic');
        if (bgMusic) {
            bgMusic.volume = this.settings.musicVolume / 100;
        }
    }

    toggleFPSDisplay() {
        let fpsCounter = document.querySelector('.fps-counter');
        
        if (this.settings.showFPS) {
            if (!fpsCounter) {
                fpsCounter = document.createElement('div');
                fpsCounter.className = 'fps-counter';
                document.body.appendChild(fpsCounter);
            }
            
            // Update FPS display
            const updateFPS = () => {
                if (window.renderer && fpsCounter) {
                    const fps = Math.round(window.renderer.getFPS());
                    fpsCounter.textContent = `FPS: ${fps}`;
                }
                if (this.settings.showFPS) {
                    requestAnimationFrame(updateFPS);
                }
            };
            updateFPS();
        } else {
            if (fpsCounter) {
                fpsCounter.remove();
            }
        }
    }

    showGameOver(finalScore, finalRails) {
        document.getElementById('finalScore').textContent = finalScore;
        document.getElementById('finalRails').textContent = finalRails;
        
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.classList.remove('hidden');
        }
    }

    hideGameOver() {
        const gameOverScreen = document.getElementById('gameOverScreen');
        if (gameOverScreen) {
            gameOverScreen.classList.add('hidden');
        }
    }

    restartGame() {
        this.hideGameOver();
        
        if (window.game) {
            window.game.disconnect();
            window.game.joinGame(this.playerName, this.selectedSkin);
        }
    }

    endGame() {
        this.hideGameOver();
        
        if (window.game) {
            window.game.disconnect();
        }
        
        this.showScreen('mainMenu');
    }

    loadLeaderboard() {
        fetch('/leaderboard')
            .then(response => response.json())
            .then(data => {
                this.displayLeaderboard(data);
            })
            .catch(error => {
                console.error('Failed to load leaderboard:', error);
                this.displayLeaderboard([]);
            });
    }

    displayLeaderboard(leaderboardData) {
        const leaderboardList = document.getElementById('leaderboardList');
        if (!leaderboardList) return;
        
        leaderboardList.innerHTML = '';
        
        if (leaderboardData.length === 0) {
            leaderboardList.innerHTML = '<div class="no-data">Henüz lider tablosu verisi yok</div>';
            return;
        }
        
        leaderboardData.forEach((entry, index) => {
            const leaderboardItem = document.createElement('div');
            leaderboardItem.className = 'leaderboard-item';
            
            leaderboardItem.innerHTML = `
                <div class="rank">#${entry.rank || index + 1}</div>
                <div class="player-info-leaderboard">
                    <div class="player-name-leaderboard">${entry.player_name}</div>
                </div>
                <div class="player-score-leaderboard">${entry.score}</div>
            `;
            
            leaderboardList.appendChild(leaderboardItem);
        });
    }

    saveSettings() {
        Utils.saveToLocalStorage('railrush_settings', this.settings);
    }

    loadSettings() {
        const savedSettings = Utils.loadFromLocalStorage('railrush_settings');
        if (savedSettings) {
            this.settings = { ...this.settings, ...savedSettings };
        }
    }

    saveCustomization() {
        const customization = {
            selectedSkin: this.selectedSkin,
            selectedTrail: this.selectedTrail
        };
        Utils.saveToLocalStorage('railrush_customization', customization);
    }

    loadCustomization() {
        const savedCustomization = Utils.loadFromLocalStorage('railrush_customization');
        if (savedCustomization) {
            this.selectedSkin = savedCustomization.selectedSkin || 'default';
            this.selectedTrail = savedCustomization.selectedTrail || 'default';
        }
    }

    showMainMenu() {
        this.showScreen('mainMenu');
    }

    showPauseMenu() {
        // Create pause menu overlay
        const pauseMenu = document.createElement('div');
        pauseMenu.className = 'overlay';
        pauseMenu.innerHTML = `
            <div class="pause-menu">
                <h2>Oyun Duraklatıldı</h2>
                <button id="resumeButton" class="menu-button primary">DEVAM ET</button>
                <button id="pauseMainMenuButton" class="menu-button secondary">ANA MENÜ</button>
            </div>
        `;
        
        document.body.appendChild(pauseMenu);
        
        // Add event listeners
        document.getElementById('resumeButton').addEventListener('click', () => {
            document.body.removeChild(pauseMenu);
            if (window.game) {
                window.game.resume();
            }
        });
        
        document.getElementById('pauseMainMenuButton').addEventListener('click', () => {
            document.body.removeChild(pauseMenu);
            this.endGame();
        });
    }

    // Utility methods
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    showLoading(message = 'Yükleniyor...') {
        const loading = document.createElement('div');
        loading.className = 'loading-overlay';
        loading.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">${message}</div>
        `;
        
        document.body.appendChild(loading);
        return loading;
    }

    hideLoading(loadingElement) {
        if (loadingElement && document.body.contains(loadingElement)) {
            document.body.removeChild(loadingElement);
        }
    }
}

// Global UI manager instance
window.ui = new UIManager(); 