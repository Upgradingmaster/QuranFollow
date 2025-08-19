import { QuranModule }    from '../ui/quran/quran.js';
import { AudioCapture }   from '../audio/capture.js';
import { AudioModule }    from '../audio/audio.js';
import { UIModule }       from '../ui/ui.js';
import { GlobalKeybinds } from '../control/keybinds.js';
import { ModalModule }    from '../ui/modal.js';
import { ControlModule }  from '../control/control.js';

export class AppModule {
    constructor() {
        this.log = this.log.bind(this);
        this.initializeElements();
        this.bindEvents();
        this.modules = {};
    }

    log(msg) {
        if (this.elements.logel) {
            // Store full history in data attribute
            const currentHistory = this.elements.logel.dataset.history || '';
            const newHistory = currentHistory + msg + '\n';
            this.elements.logel.dataset.history = newHistory;
            
            // Update status bar with latest message
            const statusBar = this.elements.logel.querySelector('.log-status-bar');
            if (statusBar) {
                statusBar.textContent = msg;
            }
            
            // Update full content if expanded
            const fullContent = this.elements.logel.querySelector('.log-full-content');
            if (fullContent) {
                fullContent.textContent = newHistory;
                fullContent.scrollTop = fullContent.scrollHeight;
            }
        } else {
            console.log(msg);
        }
    }

    initializeElements() {

        //TODO: naming
        this.elements = {
            // Audio elements
            toggleCaptureBtn      : document.getElementById('toggle-capture'),
            captureStatus         : document.getElementById('capture-status'),
            analyzeBtn            : document.getElementById('analyse'),

            // UI elements
            quranContainer        : document.getElementById('quran'),
            logel                 : document.getElementById('log'),

            modeSelect            : document.getElementById('mode-select'),
            mushafControl        : document.getElementById('controls'),

            // Navigation elements
            surahInput      : document.getElementById('surah-input'),
            ayahInput       : document.getElementById('ayah-input'),
            pageInput       : document.getElementById('page-input'),
            goBtn           : document.getElementById('go'),

            // mushafPageInput       : document.getElementById('mushaf-page-input'),
            // mushafSurahInput      : document.getElementById('mushaf-surah-input'),
            // mushafVerseInput      : document.getElementById('mushaf-verse-input'),
            // loadPageBtn           : document.getElementById('mushaf-load'),
            //
            // contextSurahInput     : document.getElementById('context-surah-input'),
            // contextVerseInput     : document.getElementById('context-verse-input'),
            // loadContextVerseBtn   : document.getElementById('context-load'),
            //
            // surahNumberInput      : document.getElementById('surah-number-input'),
            // surahVerseInput       : document.getElementById('surah-verse-input'),
            // loadSurahBtn          : document.getElementById('surah-load'),

            // Modal elements
            controlPanel       : document.getElementById('control-panel'),
            controlPanelToggle : document.getElementById('control-panel-toggle'),
            controlPanelClose  : document.getElementById('control-panel-close'),
            quickJump          : document.getElementById('quick-jump'),
            quickJumpInput     : document.getElementById('quick-jump-input'),
            quickJumpClose     : document.getElementById("quick-jump-close")
        };
    }

    async initializeModules() {
        let dependencies = {
            log: this.log,
            elements: this.elements,
        };

        this.modules.quranModule = new QuranModule(dependencies);
        await this.modules.quranModule.initialize();

        this.modules.uiModule = new UIModule(dependencies);

        this.modules.audioModule = new AudioModule(dependencies);

        // TODO: this is strange
        this.globalKeybinds = new GlobalKeybinds({
            actions: this.makeActionTable()
        });

        this.modules.modalModule = new ModalModule(this.globalKeybinds.getHelpText(), this.elements);

        //TODO: rename control to controller and take this out
        this.modules.controlModule = new ControlModule(dependencies, this.modules);
    }

    makeActionTable() {
        return {
            // Audio controls
            toggleCapture: () => this.modules.controlModule.toggleAudioCapture(),
            predict: async () => await this.modules.controlModule.predict(),
            
            // Navigation
            toggleQuickJump: () => this.modules.controlModule.toggleQuickJump(),
            
            // View modes
            setMode: (mode) => this.modules.controlModule.updateMode(mode),
            
            // Quick navigation
            nextItem: () => this.modules.controlModule.navigateNext(),
            previousItem: () => this.modules.controlModule.navigatePrevious(),
            goHome: () => this.modules.controlModule.goToHome(),
            goEnd: () => this.modules.controlModule.goToEnd(),
            
            // UI controls
            toggleControlPanel: () => this.modules.controlModule.toggleControlPanel(),
            toggleHelp: () => this.modules.controlModule.toggleHelp(),
            reload: () => this.modules.controlModule.reloadQuranView()
        };
    }

    bindEvents() {
        const { elements } = this;

        // Button click handlers
        elements.toggleCaptureBtn.onclick      = () => this.modules.controlModule.toggleAudioCapture();
        elements.analyzeBtn.onclick            = () => this.modules.controlModule.predict();
        elements.goBtn.onclick                 = () => this.modules.controlModule.controlPanelGoTo();
        elements.modeSelect.onchange           = async () => this.modules.controlModule.updateMode();

        // Modal handlers
        elements.controlPanelToggle.onclick = () => this.modules.controlModule.showControlPanel();
        elements.controlPanelClose.onclick  = () => this.modules.controlModule.hideControlPanel();

        elements.quickJumpClose.onclick  = () => this.modules.controlModule.hideQuickJump();

        // Backdrop click
        elements.controlPanel.onclick = (e) => {
            if (e.target === elements.controlPanel) {
                this.modules.controlModule.hideControlPanel();
            }
        };

        elements.quickJump.onclick = (e) => {
            if (e.target === elements.quickJump) {
                this.modules.controlModule.hideQuickJump();
            }
        };

        // Keyboard handlers for inputs
        elements.surahInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.modules.controlModule.controlPanelGoTo();
        });

        elements.ayahInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.modules.controlModule.controlPanelGoTo();
        });

        elements.pageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.modules.controlModule.controlPanelGoTo();
        });

        elements.quickJumpInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.modules.controlModule.quickJumpGoTo();
        });

        // Global escape key for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.modules.controlModule.hideControlPanel();
                this.modules.controlModule.hideQuickJump();
            }
        });
        
        // Log toggle functionality
        const logContainer = document.getElementById('log');
        const logStatusBar = logContainer.querySelector('.log-status-bar');
        const logToggle = logContainer.querySelector('.log-toggle');
        const logFullContent = logContainer.querySelector('.log-full-content');
        
        const toggleLog = () => {
            const isExpanded = logContainer.classList.contains('expanded');
            if (isExpanded) {
                logContainer.classList.remove('expanded');
            } else {
                logContainer.classList.add('expanded');
                // Update full content with current history
                const history = logContainer.dataset.history || '';
                logFullContent.textContent = history;
                // Small delay to allow transition to start before scrolling
                setTimeout(() => {
                    logFullContent.scrollTop = logFullContent.scrollHeight;
                }, 50);
            }
        };
        
        logStatusBar.addEventListener('click', toggleLog);
        logToggle.addEventListener('click', toggleLog);
    }

    async initialize() {
        try {
            await this.initializeModules();

            this.modules.controlModule.showStartupScreen('surah');

            this.log('Initialization successfully, Press q or F1 help');

            return true;
        } catch (error) {
            this.log(`[X] Failed to initialize application`);
            console.error(error);
            return false;
        }
    }

    destroy() {
        if (this.globalKeybinds) {
            this.globalKeybinds.destroy();
        }
        if (this.modules.audioModule) {
            this.modules.audioModule.stopCapture();
        }
    }
}
