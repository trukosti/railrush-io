// Main entry point for RailRush.io

class RailRushApp {
    constructor() {
        this.isInitialized = false;
        this.debugMode = false;
        
        this.init();
    }

    async init() {
        try {
            console.log('🚂 RailRush.io başlatılıyor...');
            
            // Check for debug mode
            this.debugMode = window.location.search.includes('debug=true');
            window.DEBUG_MODE = this.debugMode;
            
            if (this.debugMode) {
                console.log('🔧 Debug modu aktif');
            }
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.startApp();
                });
            } else {
                this.startApp();
            }
            
        } catch (error) {
            console.error('❌ Uygulama başlatma hatası:', error);
            this.showError('Uygulama başlatılamadı: ' + error.message);
        }
    }

    startApp() {
        try {
            // Initialize core systems
            this.initializeCore();
            
            // Setup error handling
            this.setupErrorHandling();
            
            // Setup performance monitoring
            this.setupPerformanceMonitoring();
            
            // Setup analytics
            this.setupAnalytics();
            
            this.isInitialized = true;
            console.log('✅ RailRush.io başarıyla başlatıldı');
            
            // Show welcome message
            if (this.debugMode) {
                this.showWelcomeMessage();
            }
            
        } catch (error) {
            console.error('❌ Uygulama başlatma hatası:', error);
            this.showError('Uygulama başlatılamadı: ' + error.message);
        }
    }

    initializeCore() {
        // Core systems are already initialized by their respective classes
        // This is just a placeholder for any additional initialization
        
        // Check for required features
        this.checkBrowserSupport();
        
        // Initialize service worker for offline support
        this.initializeServiceWorker();
        
        // Setup keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    checkBrowserSupport() {
        const requiredFeatures = [
            'WebSocket',
            'CanvasRenderingContext2D',
            'localStorage',
            'requestAnimationFrame'
        ];
        
        const unsupportedFeatures = requiredFeatures.filter(feature => {
            return !window[feature] && !window[feature + '2D'];
        });
        
        if (unsupportedFeatures.length > 0) {
            throw new Error(`Tarayıcınız şu özellikleri desteklemiyor: ${unsupportedFeatures.join(', ')}`);
        }
        
        // Check for WebGL support (optional)
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) {
            console.warn('⚠️ WebGL desteklenmiyor, Canvas 2D kullanılacak');
        }
    }

    async initializeServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker kaydedildi:', registration);
            } catch (error) {
                console.warn('⚠️ Service Worker kaydedilemedi:', error);
            }
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Debug shortcuts
            if (this.debugMode) {
                switch (e.code) {
                    case 'F1':
                        e.preventDefault();
                        this.toggleDebugPanel();
                        break;
                    case 'F2':
                        e.preventDefault();
                        this.showPerformanceStats();
                        break;
                    case 'F3':
                        e.preventDefault();
                        this.resetGame();
                        break;
                }
            }
            
            // Global shortcuts
            switch (e.code) {
                case 'F11':
                    e.preventDefault();
                    this.toggleFullscreen();
                    break;
                case 'F12':
                    e.preventDefault();
                    this.openDevTools();
                    break;
            }
        });
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('❌ Global hata:', event.error);
            this.logError('Global error', event.error);
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('❌ İşlenmeyen promise hatası:', event.reason);
            this.logError('Unhandled promise rejection', event.reason);
        });
        
        // Network error handler
        window.addEventListener('offline', () => {
            console.warn('⚠️ İnternet bağlantısı kesildi');
            this.showNotification('İnternet bağlantısı kesildi', 'warning');
        });
        
        window.addEventListener('online', () => {
            console.log('✅ İnternet bağlantısı geri geldi');
            this.showNotification('İnternet bağlantısı geri geldi', 'success');
        });
    }

    setupPerformanceMonitoring() {
        // Monitor frame rate
        let frameCount = 0;
        let lastTime = performance.now();
        
        const monitorFPS = () => {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime >= 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                
                if (fps < 30) {
                    console.warn('⚠️ Düşük FPS:', fps);
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(monitorFPS);
        };
        
        requestAnimationFrame(monitorFPS);
        
        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
                const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
                
                if (usedMB > 100) {
                    console.warn('⚠️ Yüksek bellek kullanımı:', usedMB + 'MB / ' + totalMB + 'MB');
                }
            }, 10000);
        }
    }

    setupAnalytics() {
        // Simple analytics tracking
        this.trackEvent = (eventName, data = {}) => {
            if (this.debugMode) {
                console.log('📊 Analytics:', eventName, data);
            }
            
            // Send to analytics service (if configured)
            // analytics.track(eventName, data);
        };
        
        // Track page views
        this.trackEvent('page_view', {
            page: window.location.pathname,
            referrer: document.referrer
        });
        
        // Track game events
        if (window.game) {
            window.game.on('game_start', () => {
                this.trackEvent('game_start');
            });
            
            window.game.on('game_end', (score) => {
                this.trackEvent('game_end', { score });
            });
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-overlay';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h2>❌ Hata</h2>
                <p>${message}</p>
                <button onclick="location.reload()">Sayfayı Yenile</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
    }

    showNotification(message, type = 'info') {
        if (window.ui) {
            window.ui.showNotification(message, type);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }

    showWelcomeMessage() {
        console.log(`
🎮 RailRush.io'ya Hoş Geldiniz!

🎯 Oyun Kontrolleri:
- WASD veya Ok Tuşları: Hareket
- SPACE: Ray Döş
- SHIFT: Hızlanma
- ESC: Menü

🔧 Debug Modu Aktif:
- F1: Debug Paneli
- F2: Performans İstatistikleri
- F3: Oyunu Sıfırla

🚀 İyi oyunlar!
        `);
    }

    // Debug methods
    toggleDebugPanel() {
        let debugPanel = document.getElementById('debug-panel');
        
        if (!debugPanel) {
            debugPanel = document.createElement('div');
            debugPanel.id = 'debug-panel';
            debugPanel.className = 'debug-panel';
            debugPanel.innerHTML = `
                <h3>Debug Panel</h3>
                <div id="debug-info"></div>
                <button onclick="app.resetGame()">Oyunu Sıfırla</button>
                <button onclick="app.showPerformanceStats()">Performans</button>
                <button onclick="app.closeDebugPanel()">Kapat</button>
            `;
            document.body.appendChild(debugPanel);
        }
        
        debugPanel.style.display = debugPanel.style.display === 'none' ? 'block' : 'none';
        this.updateDebugInfo();
    }

    updateDebugInfo() {
        const debugInfo = document.getElementById('debug-info');
        if (!debugInfo) return;
        
        const info = {
            'FPS': window.renderer ? Math.round(window.renderer.getFPS()) : 'N/A',
            'Oyuncular': window.game ? window.game.gameState.players.length : 0,
            'Raylar': window.game ? window.game.gameState.rails.length : 0,
            'Bağlantı': window.game ? (window.game.isConnected ? 'Bağlı' : 'Bağlı Değil') : 'N/A',
            'Bellek': 'memory' in performance ? Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB' : 'N/A'
        };
        
        debugInfo.innerHTML = Object.entries(info)
            .map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`)
            .join('');
    }

    closeDebugPanel() {
        const debugPanel = document.getElementById('debug-panel');
        if (debugPanel) {
            debugPanel.remove();
        }
    }

    showPerformanceStats() {
        const stats = {
            'FPS': window.renderer ? Math.round(window.renderer.getFPS()) : 'N/A',
            'Bellek Kullanımı': 'memory' in performance ? Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB' : 'N/A',
            'Toplam Bellek': 'memory' in performance ? Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB' : 'N/A',
            'Bellek Limiti': 'memory' in performance ? Math.round(performance.memory.jsHeapSizeLimit / 1048576) + 'MB' : 'N/A'
        };
        
        console.table(stats);
        this.showNotification('Performans istatistikleri konsola yazdırıldı', 'info');
    }

    resetGame() {
        if (window.game) {
            window.game.disconnect();
            window.game.joinGame('DebugPlayer', 'default');
        }
        this.showNotification('Oyun sıfırlandı', 'info');
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.log('Fullscreen request failed:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    openDevTools() {
        // This is just a placeholder - browsers handle F12 automatically
        console.log('DevTools açılıyor...');
    }

    logError(type, error) {
        const errorData = {
            type,
            message: error.message || error,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.error('Hata detayları:', errorData);
        
        // Send to error tracking service (if configured)
        // errorTracker.log(errorData);
    }

    // Public API
    getVersion() {
        return '1.0.0';
    }

    getDebugMode() {
        return this.debugMode;
    }

    isReady() {
        return this.isInitialized;
    }
}

// Initialize the application
const app = new RailRushApp();

// Make app globally available
window.app = app;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RailRushApp;
} 