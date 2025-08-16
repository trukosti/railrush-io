// Input handling for RailRush.io

class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            pressed: false,
            leftPressed: false,
            rightPressed: false
        };
        
        this.touch = {
            x: 0,
            y: 0,
            pressed: false
        };
        
        this.gameInput = {
            up: false,
            down: false,
            left: false,
            right: false,
            space: false,
            shift: false
        };
        
        this.lastInputTime = 0;
        this.inputThrottle = 16; // ~60fps
        
        this.init();
    }

    init() {
        // Keyboard events
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        document.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Mouse events
        document.addEventListener('mousedown', this.handleMouseDown.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        
        // Touch events for mobile
        document.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        
        // Prevent context menu on right click
        document.addEventListener('contextmenu', e => e.preventDefault());
        
        // Prevent default behavior for game keys
        document.addEventListener('keydown', e => {
            if (this.isGameKey(e.code)) {
                e.preventDefault();
            }
        });
    }

    handleKeyDown(event) {
        const now = Date.now();
        if (now - this.lastInputTime < this.inputThrottle) return;
        
        this.keys[event.code] = true;
        this.lastInputTime = now;
        
        // Update game input
        this.updateGameInput();
        
        // Handle special keys
        this.handleSpecialKeys(event);
    }

    handleKeyUp(event) {
        this.keys[event.code] = false;
        this.updateGameInput();
    }

    handleMouseDown(event) {
        this.mouse.pressed = true;
        
        if (event.button === 0) {
            this.mouse.leftPressed = true;
        } else if (event.button === 2) {
            this.mouse.rightPressed = true;
        }
        
        this.updateGameInput();
    }

    handleMouseUp(event) {
        this.mouse.pressed = false;
        
        if (event.button === 0) {
            this.mouse.leftPressed = false;
        } else if (event.button === 2) {
            this.mouse.rightPressed = false;
        }
        
        this.updateGameInput();
    }

    handleMouseMove(event) {
        const rect = event.target.getBoundingClientRect();
        this.mouse.x = event.clientX - rect.left;
        this.mouse.y = event.clientY - rect.top;
    }

    handleTouchStart(event) {
        event.preventDefault();
        
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const rect = event.target.getBoundingClientRect();
            this.touch.x = touch.clientX - rect.left;
            this.touch.y = touch.clientY - rect.top;
            this.touch.pressed = true;
        }
        
        this.updateGameInput();
    }

    handleTouchEnd(event) {
        event.preventDefault();
        this.touch.pressed = false;
        this.updateGameInput();
    }

    handleTouchMove(event) {
        event.preventDefault();
        
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const rect = event.target.getBoundingClientRect();
            this.touch.x = touch.clientX - rect.left;
            this.touch.y = touch.clientY - rect.top;
        }
    }

    updateGameInput() {
        // WASD or Arrow keys
        this.gameInput.up = this.keys['KeyW'] || this.keys['ArrowUp'];
        this.gameInput.down = this.keys['KeyS'] || this.keys['ArrowDown'];
        this.gameInput.left = this.keys['KeyA'] || this.keys['ArrowLeft'];
        this.gameInput.right = this.keys['KeyD'] || this.keys['ArrowRight'];
        
        // Space for rail placement
        this.gameInput.space = this.keys['Space'];
        
        // Shift for boost
        this.gameInput.shift = this.keys['ShiftLeft'] || this.keys['ShiftRight'];
        
        // Mobile touch controls
        if (this.touch.pressed) {
            this.handleTouchControls();
        }
    }

    handleTouchControls() {
        // Simple touch controls for mobile
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const touchX = this.touch.x;
        const touchY = this.touch.y;
        
        // Dead zone
        const deadZone = 50;
        const dx = touchX - centerX;
        const dy = touchY - centerY;
        
        if (Math.abs(dx) > deadZone || Math.abs(dy) > deadZone) {
            // Movement based on touch position relative to center
            this.gameInput.up = dy < -deadZone;
            this.gameInput.down = dy > deadZone;
            this.gameInput.left = dx < -deadZone;
            this.gameInput.right = dx > deadZone;
        }
        
        // Rail placement on touch
        this.gameInput.space = this.touch.pressed;
    }

    handleSpecialKeys(event) {
        switch (event.code) {
            case 'F11':
                event.preventDefault();
                this.toggleFullscreen();
                break;
            case 'F12':
                event.preventDefault();
                this.toggleDebugMode();
                break;
            case 'Escape':
                this.handleEscape();
                break;
        }
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

    toggleDebugMode() {
        window.DEBUG_MODE = !window.DEBUG_MODE;
        console.log('Debug mode:', window.DEBUG_MODE ? 'ON' : 'OFF');
    }

    handleEscape() {
        // Handle escape key based on current game state
        if (window.game && window.game.isPlaying) {
            window.game.pause();
        } else if (window.ui) {
            window.ui.showMainMenu();
        }
    }

    isGameKey(keyCode) {
        const gameKeys = [
            'KeyW', 'KeyA', 'KeyS', 'KeyD',
            'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
            'Space', 'ShiftLeft', 'ShiftRight'
        ];
        return gameKeys.includes(keyCode);
    }

    // Get current input state
    getInputState() {
        return {
            ...this.gameInput,
            mouse: { ...this.mouse },
            touch: { ...this.touch }
        };
    }

    // Check if any movement key is pressed
    isMoving() {
        return this.gameInput.up || this.gameInput.down || 
               this.gameInput.left || this.gameInput.right;
    }

    // Get movement direction as normalized vector
    getMovementVector() {
        let dx = 0;
        let dy = 0;
        
        if (this.gameInput.up) dy -= 1;
        if (this.gameInput.down) dy += 1;
        if (this.gameInput.left) dx -= 1;
        if (this.gameInput.right) dx += 1;
        
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707; // 1/√2
            dy *= 0.707;
        }
        
        return { dx, dy };
    }

    // Check if input has changed since last check
    hasInputChanged() {
        const currentInput = JSON.stringify(this.gameInput);
        if (this.lastInputState !== currentInput) {
            this.lastInputState = currentInput;
            return true;
        }
        return false;
    }

    // Reset all input states
    reset() {
        this.keys = {};
        this.mouse.pressed = false;
        this.mouse.leftPressed = false;
        this.mouse.rightPressed = false;
        this.touch.pressed = false;
        
        this.gameInput = {
            up: false,
            down: false,
            left: false,
            right: false,
            space: false,
            shift: false
        };
    }

    // Get input for specific action
    isPressed(action) {
        switch (action) {
            case 'up': return this.gameInput.up;
            case 'down': return this.gameInput.down;
            case 'left': return this.gameInput.left;
            case 'right': return this.gameInput.right;
            case 'space': return this.gameInput.space;
            case 'shift': return this.gameInput.shift;
            case 'mouse': return this.mouse.pressed;
            case 'touch': return this.touch.pressed;
            default: return false;
        }
    }

    // Check if key was just pressed (not held)
    wasJustPressed(keyCode) {
        return this.keys[keyCode] && !this.lastKeys[keyCode];
    }

    // Update last keys state (call this at the end of each frame)
    updateLastKeys() {
        this.lastKeys = { ...this.keys };
    }
}

// Create global input manager
window.inputManager = new InputManager(); 