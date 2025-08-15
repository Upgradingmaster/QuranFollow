import { QuranModule } from '../ui/quran/quran.js';
import { GlobalKeybinds } from '../control/keybinds.js';
import { AudioCapture }   from '../audio/capture.js';
import { AudioModule }   from '../audio/audio.js';
import { ControlModule } from '../control/control.js';
import { UIModule }      from '../ui/ui.js';

export class AppModule {
    constructor() {
        this.log = this.log.bind(this);
        this.initializeElements();
        this.bindEvents();
        this.modules = {};
    }

    log(msg) {
        if (this.elements.logel) {
            this.elements.logel.textContent += msg + "\n"; 
            this.elements.logel.scrollTop = this.elements.logel.scrollHeight;
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
            quran                 : document.getElementById('quran'),
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
            modules: {},
            getModules: () => { return this.modules; }
        };

        try {
            this.modules.quranModule = new QuranModule(dependencies);
        } catch (error){
            this.log(`❌ Failed to initialize quran module`);
            console.error(`❌ Failed to initialize quran module`, error);
            return; // Exit early if module creation fails
        }

        await this.modules.quranModule.initialize();
        dependencies.modules.quranModule = this.modules.quranModule;

        this.modules.uiModule = new UIModule(dependencies);
        dependencies.modules.uiModule = this.modules.uiModule;

        this.modules.controlModule = new ControlModule(dependencies);
        dependencies.modules.controlModule = this.modules.controlModule;
        
        this.modules.audioModule = new AudioModule(dependencies);
        dependencies.modules.audioModule = this.modules.audioModule;

        this.globalKeybinds = new GlobalKeybinds({
            actions: this.createKeybindActions()
        });
    }

    createKeybindActions() {
        return {
            // Audio controls
            toggleCapture: () => this.modules.controlModule.toggleAudioCapture(),
            predict: async () => await this.modules.controlModule.predict(),
            
            // Navigation
            goToPage: () => this.modules.controlModule.promptAndNavigateTo('page'),
            goToVerse: () => this.modules.controlModule.promptAndNavigateTo('verse'),
            goToSurah: () => this.modules.controlModule.promptAndNavigateTo('surah'),
            
            // View modes
            setMode: (mode) => this.modules.uiModule.setViewMode(mode),
            
            // Quick navigation
            nextItem: () => this.modules.controlModule.navigateNext(),
            previousItem: () => this.modules.controlModule.navigatePrevious(),
            goHome: () => this.modules.controlModule.goToHome(),
            goEnd: () => this.modules.controlModule.goToEnd(),
            
            // UI controls
            toggleControlPanel: () => this.modules.uiModule.toggleControlPanel(),
            clearLog: () => this.modules.uiModule.clearLogContent(),
            showHelp: () => this.globalKeybinds.showHelp(),
            reload: () => this.modules.controlModule.reloadCurrentView()
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
        elements.modeSelect.onchange = () => this.modules.controlModule.updateMode();

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
            if (e.key === 'Enter') { console.log("pageInput"); this.modules.controlModule.loadQuranPageFromControlPanel();}
        });

        //ContextView
        elements.contextSurahInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { console.log("contextSurahInput"); this.modules.controlModule.loadVerseWithContextFromControlPanel();}
        });

        elements.contextVerseInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { console.log("contextVerseInput"); this.modules.controlModule.loadVerseWithContextFromControlPanel();}
        });

        // Surah View
        elements.surahNumberInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { console.log("surahNumberInput"); this.modules.controlModule.loadSurahFromControlPanel();}
        });

        elements.surahVerseInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { console.log("surahVerseInput"); this.modules.controlModule.loadSurahFromControlPanel();}
        });

        // Global escape key for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && elements.controlModalBackdrop.classList.contains('show')) {
                this.modules.uiModule.hideControlPanel();
            }
        });
    }

    async initialize() {
        try {
            await this.initializeModules();

            // Initialize mode visibility
            this.modules.controlModule.updateMode();

            // Load initial content
            await this.modules.controlModule.loadMushafPageFromControlPanel(18);

            // Log success
            this.log('⌨️ Global keybinds initialized. Press ? or F1 for help.');
            this.log('🎯 Application initialized successfully');

            return true;
        } catch (error) {
            this.log(`❌ Failed to initialize application: ${error.message}`);
            console.log(this.modules.controlModule);
            console.error(`App initialization error: ${this.modules.controlModule}`, error);
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
