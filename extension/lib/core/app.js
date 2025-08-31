import { QuranModule }    from '../ui/quran/quran.js';
import { AudioModule }    from '../audio/audio.js';
import { UIModule }       from '../ui/ui.js';
import { KeybindsModule } from '../control/keybinds.js';
import { ModalModule }    from '../ui/modal.js';
import { ControlModule }  from '../control/control.js';
import { SettingsModule } from './settings.js';
import * as Log           from './log.js';
import * as Theme         from '../ui/theme.js';

export class AppModule {
    constructor() {
        this.initializeElements();
        Log.initializeLogger(this.elements);
        this.log = Log.log.bind(this);
        this.bindEvents();
        this.modules = {};
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

        this.modules.settingsModule = new SettingsModule(dependencies);

        this.keybindsModule = new KeybindsModule(this.makeActionTable(), dependencies);

        this.modules.modalModule = new ModalModule(this.keybindsModule.getHelpText(), this.elements);

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
            up: () => this.modules.controlModule.up(),
            down: () => this.modules.controlModule.down(),
            next: () => this.modules.controlModule.next(),
            prev: () => this.modules.controlModule.prev(),
            home: () => this.modules.controlModule.home(),
            end: () => this.modules.controlModule.end(),

            // UI controls
            toggleControlPanel: () => this.modules.controlModule.toggleControlPanel(),
            toggleHelp: () => this.modules.controlModule.toggleHelp(),
            toggleTheme: () => Theme.toggleTheme(),

            // Other
            reload: () => this.modules.controlModule.reloadQuranView(),
            quit: () => this.modules.controlModule.quit()
        };
    }

    initializeElements() {
        this.elements = {
            /* Modals */
            // Help
            help          : document.getElementById('help'),
            helpText      : document.getElementById('help-text'),
            helpClose     : document.getElementById('help-close'),

            // Control Panel
            controlPanel       : document.getElementById('control-panel'),
            controlPanelClose  : document.getElementById('control-panel-close'),

            // Quick Jump
            quickJump          : document.getElementById('quick-jump'),
            quickJumpInput     : document.getElementById('quick-jump-input'),
            quickJumpClose     : document.getElementById("quick-jump-close"),

            // Settings
            settings      : document.getElementById('settings'),
            settingsClose : document.getElementById('settings-close'),
            settingUseASR : document.getElementById('setting-use-asr'),

            /* Control Panel*/
            // Audio
            captureStatus      : document.getElementById('control-audio-status'),
            toggleCaptureBtn   : document.getElementById('control-audio-capture'),
            analyzeBtn         : document.getElementById('control-audio-analyse'),

            // Mode
            modeSelect         : document.getElementById('control-mode-select'),

            // Navigation elements
            surahInput         : document.getElementById('control-surah-input'),
            ayahInput          : document.getElementById('control-ayah-input'),
            pageInput          : document.getElementById('control-page-input'),
            goBtn              : document.getElementById('control-go'),

            // Theme
            toggleThemeBtn     : document.getElementById('control-toggle-theme'),

            /* Log */
            logContainer        : document.getElementById('log'),
            logStatusBar : document.getElementById('log-status-bar'),
            logExpanded  : document.getElementById('log-expanded'),
            logToggle    : document.getElementById('log-toggle'),


            /* Footer */
            footerHelpBtn : document.getElementById('footer-help'),
            footerCPBtn : document.getElementById('footer-control-panel'),
            footerQJBtn : document.getElementById('footer-quick-jump'),
            footerSettingsBtn : document.getElementById('footer-settings'),
            footerQuitBtn : document.getElementById('footer-quit'),


            /* Main UI elements */
            locationInfo       : document.getElementById('location-info'),
            quranContainer     : document.getElementById('quran'),
        };
    }

    bindEvents() {
        const { elements } = this;

        // Control Panel: Audio
        elements.toggleCaptureBtn.onclick = () => this.modules.controlModule.toggleAudioCapture();
        elements.toggleThemeBtn.onclick   = () => Theme.toggleTheme();
        elements.analyzeBtn.onclick       = () => this.modules.controlModule.predict();
        elements.goBtn.onclick            = () => this.modules.controlModule.controlPanelGoTo();

        // Control Panel: Mode
        elements.modeSelect.onchange = async () => this.modules.controlModule.updateMode();

        // Control Panel: Navigation
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

        // Control Panel: Navigation: Sync
        elements.surahInput.addEventListener('input', (e) => {
            this.modules.controlModule.onControlPanelKeyInput();
        });

        elements.ayahInput.addEventListener('input', (e) => {
            this.modules.controlModule.onControlPanelKeyInput();
        });

        elements.pageInput.addEventListener('input', (e) => {
            this.modules.controlModule.onControlPanelPageInput();
        });

        // Modal: Close
        elements.helpClose.onclick         = () => this.modules.controlModule.hideHelp();
        elements.controlPanelClose.onclick = () => this.modules.controlModule.hideControlPanel();
        elements.quickJumpClose.onclick    = () => this.modules.controlModule.hideQuickJump();
        elements.settingsClose.onclick     = () => this.modules.controlModule.hideSettings();

        // Modal: Backdrop Click
        elements.help.onclick = (e) => {
            if (e.target === elements.help) {
                this.modules.controlModule.hideHelp();
            }
        };
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

        elements.settings.onclick = (e) => {
            if (e.target === elements.settings) {
                this.modules.controlModule.hideSettings();
            }
        };

        // Header Log Panel
        elements.logStatusBar.onclick      = () => this.modules.controlModule.toggleLogPanel();
        elements.logToggle.onclick         = () => this.modules.controlModule.toggleLogPanel();

        // Footer
        elements.footerHelpBtn.onclick     = () => this.modules.controlModule.showHelp();
        elements.footerCPBtn.onclick       = () => this.modules.controlModule.showControlPanel();
        elements.footerQJBtn.onclick       = () => this.modules.controlModule.showQuickJump();
        elements.footerSettingsBtn.onclick = () => this.modules.controlModule.showSettings();
        elements.footerQuitBtn.onclick     = () => this.modules.controlModule.quit();

        // Settings
        elements.settingUseASR.addEventListener('change', (e) => {
            this.modules.controlModule.setSetting('useASR', e.target.checked);
        });

        // Quran: Click to focus
        elements.quranContainer.addEventListener('click', (event) => {
            const ayah = event.target.closest('.ayah');
            if (ayah && elements.quranContainer.contains(ayah)) {
                this.modules.controlModule.goTo(null, Number(ayah.dataset.surah), Number(ayah.dataset.ayah), null);
            }
        });

        // Escape to hide any modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.modules.controlModule.hideHelp();
                this.modules.controlModule.hideControlPanel();
                this.modules.controlModule.hideQuickJump();
                this.modules.controlModule.hideSettings();
            }
        });
    }

    async initialize() {
        try {
            Theme.setThemeFromLocalStorage('sepia');
            await this.initializeModules();
            this.modules.controlModule.initializeSettingsMenu();
            this.modules.controlModule.setBrowserSpecifics();

            this.modules.controlModule.showStartupScreen('surah');

            this.log('Initialization successfully, Press q for help');

            return true;
        } catch (error) {
            this.log(`[X] Failed to initialize application`, error);
            return false;
        }
    }

    destroy() {
        if (this.keybindsModule) {
            this.keybindsModule.destroy();
        }
        if (this.modules.audioModule) {
            this.modules.audioModule.stopCapture();
        }
    }
}
