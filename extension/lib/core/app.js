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
            controlModalBackdrop  : document.getElementById('control-modal-backdrop'),

            // Mode elements
            modeSelect            : document.getElementById('mode-select'),
            mushafControls        : document.getElementById('mushaf-controls'),
            contextControls       : document.getElementById('context-controls'),
            surahControls         : document.getElementById('surah-controls'),

            // Navigation elements

            pageInput             : document.getElementById('page-input'),
            contextSurahInput     : document.getElementById('context-surah-input'),
            contextVerseInput     : document.getElementById('context-verse-input'),
            surahNumberInput      : document.getElementById('surah-number-input'),
            surahVerseInput       : document.getElementById('surah-verse-input'),

            loadSurahBtn          : document.getElementById('load-surah'),
            loadContextVerseBtn   : document.getElementById('load-context-verse'),
            loadPageBtn           : document.getElementById('load-page'),
            
            // Modal elements
            toggleControlPanelBtn : document.getElementById('toggle-control-panel'),
            closeControlPanelBtn  : document.getElementById('close-control-panel')
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

        this.modules.modalModule = new ModalModule(this.globalKeybinds.getHelpText(), this.elements.controlModalBackdrop);

        //TODO: rename control to controller and take this out
        this.modules.controlModule = new ControlModule(dependencies, this.modules);

    }

    makeActionTable() {
        return {
            // Audio controls
            toggleCapture: () => this.modules.controlModule.toggleAudioCapture(),
            predict: async () => await this.modules.controlModule.predict(),
            
            // Navigation
            goToPage: () => this.modules.controlModule.promptAndNavigateTo('page'),
            goToVerse: () => this.modules.controlModule.promptAndNavigateTo('verse'),
            goToSurah: () => this.modules.controlModule.promptAndNavigateTo('surah'),
            
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
        elements.toggleCaptureBtn.onclick = () => this.modules.controlModule.toggleAudioCapture();
        elements.analyzeBtn.onclick = () => this.modules.controlModule.predict();
        elements.loadPageBtn.onclick = () => this.modules.controlModule.loadMushafPageFromControlPanel();
        elements.loadContextVerseBtn.onclick = () => this.modules.controlModule.loadVerseWithContextFromControlPanel();
        elements.loadSurahBtn.onclick = () => this.modules.controlModule.loadSurahFromControlPanel();
        elements.modeSelect.onchange = async () => this.modules.controlModule.updateMode();

        // Modal handlers
        elements.toggleControlPanelBtn.onclick = () => this.modules.controlModule.showControlPanel();
        elements.closeControlPanelBtn.onclick = () => this.modules.controlModule.hideControlPanel();

        // Backdrop click
        elements.controlModalBackdrop.onclick = (e) => {
            if (e.target === elements.controlModalBackdrop) {
                this.modules.controlModule.hideControlPanel();
            }
        };

        // Keyboard handlers for inputs
        // Mushaf view
        elements.pageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.modules.controlModule.loadMushafPageFromControlPanel();
        });

        //ContextView
        elements.contextSurahInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.modules.controlModule.loadVerseWithContextFromControlPanel();
        });

        elements.contextVerseInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.modules.controlModule.loadVerseWithContextFromControlPanel();
        });

        // Surah View
        elements.surahNumberInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.modules.controlModule.loadSurahFromControlPanel();
        });

        elements.surahVerseInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.modules.controlModule.loadSurahFromControlPanel();
        });

        // Global escape key for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.controlModalBackdrop.classList.contains('show')) {
                this.modules.uiModule.hideControlPanel();
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

            this.modules.controlModule.updateMode('context');

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
