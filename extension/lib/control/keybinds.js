export class GlobalKeybinds {
    constructor(options = {}) {
        this.actions = options.actions || {};
        this.enabled = true;
        this.keybinds = new Map();
        this.pressedKeys = new Set();
        
        this.init();
        this.loadDefaultKeybinds();
    }

    init() {
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    }

    normalizeKey(event) {
        const parts = [];
        
        if (event.ctrlKey) parts.push('Ctrl');
        if (event.altKey) parts.push('Alt');
        if (event.shiftKey) parts.push('Shift');
        if (event.metaKey) parts.push('Meta');
        
        const key = event.key;
        
        if (key === ' ') {
            parts.push('Space');
        } else if (key.length === 1) {
            parts.push(key.toLowerCase());
        } else {
            parts.push(key);
        }
        
        return parts.join('+');
    }

    shouldIgnoreEvent(event) {
        const target = event.target;
        const tagName = target.tagName.toLowerCase();
        
        // Ignore events from input elements
        if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
            return true;
        }
        
        // Ignore events from contenteditable elements
        if (target.contentEditable === 'true') {
            return true;
        }
        
        return false;
    }

    handleKeyDown(event) {
        if (!this.enabled || this.shouldIgnoreEvent(event)) {
            return;
        }

        const normalizedKey = this.normalizeKey(event);
        this.pressedKeys.add(normalizedKey);
        
        const keybind = this.keybinds.get(normalizedKey);
        if (keybind) {
            event.preventDefault();
            event.stopPropagation();
            
            this.executeAction(keybind);
        }
    }

    handleKeyUp(event) {
        if (!this.enabled) {
            return;
        }

        const normalizedKey = this.normalizeKey(event);
        this.pressedKeys.delete(normalizedKey);
    }

    executeAction(keybind) {
        try {
            const { action, args = [], description } = keybind;
            
            if (typeof this.actions[action] === 'function') {
                console.log(`[Keybind] Executing: ${description || action}`);
                this.showToast(`⌨️ ${description || action}`, 'info');
                this.actions[action](...args);
            } else {
                console.warn(`[Keybind] Action not found: ${action}`);
                this.showToast(`[X] Action not found: ${action}`, 'error');
            }
        } catch (error) {
            console.error(`[Keybind] Error executing action:`, error);
        }
    }

    showToast(message, type = 'info', duration = 2000) {
        // Remove any existing toast
        const existingToast = document.querySelector('.keybind-toast');
        if (existingToast) {
            existingToast.remove();
        }

        // Create new toast
        const toast = document.createElement('div');
        toast.className = `keybind-toast ${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        // Auto-remove after duration
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, duration);
    }

    bind(key, action, description = '', args = []) {
        const keybind = {
            key,
            action,
            description,
            args
        };
        
        this.keybinds.set(key, keybind);
    }

    enable() {
        this.enabled = true;
        console.log('[Keybind] Enabled global keybinds');
    }

    disable() {
        this.enabled = false;
        console.log('[Keybind] Disabled global keybinds');
    }

    getKeybinds() {
        const result = {};
        for (const [key, keybind] of this.keybinds) {
            result[key] = {
                action: keybind.action,
                description: keybind.description,
                args: keybind.args
            };
        }
        return result;
    }

    getHelpText() {
        const sections = {
            'Audio Controls': [],
            'Navigation': [],
            'View Modes': [],
            'UI Controls': []
        };

        for (const [key, keybind] of this.keybinds) {
            const { description, action } = keybind;
            
            if (action.includes('capture') || action.includes('analyze') || action.includes('audio')) {
                sections['Audio Controls'].push(`${key} - ${description}`);
            } else if (action.includes('goTo') || action.includes('next') || action.includes('previous')) {
                sections['Navigation'].push(`${key} - ${description}`);
            } else if (action.includes('Mode') || action.includes('view')) {
                sections['View Modes'].push(`${key} - ${description}`);
            } else {
                sections['UI Controls'].push(`${key} - ${description}`);
            }
        }

        let helpText = 'Keyboard Shortcuts:\n\n';
        for (const [section, binds] of Object.entries(sections)) {
            if (binds.length > 0) {
                helpText += `${section}:\n`;
                binds.forEach(bind => helpText += `  ${bind}\n`);
                helpText += '\n';
            }
        }

        return helpText;
    }

    loadDefaultKeybinds() {
        // Audio controls
        this.bind('Space', 'toggleCapture', 'Start/stop audio capture');
        this.bind('Enter', 'predict', 'Analyze current audio');
        this.bind('a', 'predict', 'Analyze current audio');
        
        // Navigation
        this.bind('Ctrl+f', 'toggleQuickJump', 'Go to a location in the current mode');
        
        // View modes
        this.bind('1', 'setMode', 'Switch to Mushaf view', ['mushaf']);
        this.bind('2', 'setMode', 'Switch to Context view', ['context']);
        this.bind('3', 'setMode', 'Switch to Surah view', ['surah']);

        // Quick navigation
        this.bind('j', 'nextItem', 'Next verse/page');
        this.bind('k', 'previousItem', 'Previous verse/page');
        this.bind('ArrowDown', 'nextItem', 'Next verse/page');
        this.bind('ArrowUp', 'previousItem', 'Previous verse/page');
        
        // UI controls
        this.bind('Ctrl+p', 'toggleControlPanel', 'Toggle control panel');
        this.bind('q', 'toggleHelp', 'Toggle keyboard shortcuts');
        this.bind('F1', 'toggleHelp', 'Toggle keyboard shortcuts');
        
        // Quick access
        this.bind('h', 'goHome', 'Go to beginning of current surah');
        this.bind('e', 'goEnd', 'Go to end of current surah');
        this.bind('r', 'reload', 'Reload current view');
    }
}
