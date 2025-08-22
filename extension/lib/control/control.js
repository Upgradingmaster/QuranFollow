export class ControlModule {
    constructor(dependencies, modules) {
        this.log = dependencies.log;
        this.elements = dependencies.elements;
        this.modules = modules;
    }

    // Wrapper around quranModule.goTo to update the control panel with the state
    goTo(mode, surah, ayah, page, opts = this.defaultGoToOpts) {
        const newState = this.modules.quranModule.goTo(mode, surah, ayah, page, opts);
        const newSurah = newState.surah;
        const newAyah  = newState.ayah;
        const newPage  = newState.page;
        this.modules.uiModule.setControlPanelInputs(newSurah, newAyah, newPage);
        this.modules.uiModule.setLocationInfo(newSurah, newAyah);
    }

    async predict() {
        const pred = await this.modules.audioModule.analyzeCurrentAudio();
        if (!pred) return;

        if (pred.status == 'matched') {
            const surah = parseInt(pred.surah);
            const ayah  = parseInt(pred.ayah);
            this.log(`Found: ${surah}:${ayah}`);
            this.goTo(null, surah, ayah, null);
        } else {
            this.log("[?] Couldn't find a matching ayah")
        }
    }

    updateMode(mode, firstRun = false) {
        if (!mode) { mode = this.modules.uiModule.getSelectedMode(); }
        if (!this.modules.quranModule.isValidMode(mode)) {
            throw new Error(`Invalid mode '${mode}'`);
        }

        const currentMode = this.modules.quranModule.getMode();
        if (mode == currentMode) { return; }

        this.modules.uiModule.setSelectedMode(mode);

        // TODO: this will go away when we have a better startup screen
        let opts = this.modules.quranModule.getDefaultGoToOpts();
        if (firstRun) { // don't highlight
            opts.highlightCurrentAyah = false;
        }

        this.goTo(mode, null, null, null, opts);
    }

    showStartupScreen(mode) {
        // TODO: better startup screen
        this.updateMode(mode, true);
    }

    controlPanelGoTo() {
        const { surahInput, ayahInput, pageInput } = this.elements;

        this.goTo(null, parseInt(surahInput.value), parseInt(ayahInput.value), parseInt(pageInput.value));
    }

    quickJumpGoTo() {
        const key = this.elements.quickJumpInput.value?.trim();
        if (key && key != '') {
            this.goToKey(key);
        }
        this.hideQuickJump();
    }

    goToKey(key) {
        const parts = key.split(':');
        if (parts.length === 2) {
            let surah = parseInt(parts[0]);
            let ayah  = parseInt(parts[1]);
            this.goTo(null, surah, ayah, null);
        } else {
            this.log(`[X] Invalid key format: ${key}. Use format surah:ayah (e.g., 18:10)`);
        }
    }

    reloadQuranView() {
        this.goTo(null, null, null, null);
    }

    up() {
        this.goTo(null, null, this.modules.quranModule.getAyah() - 1, null);
    }

    down() {
        this.goTo(null, null, this.modules.quranModule.getAyah() + 1, null);
    }

    next() {
        const state = this.modules.quranModule.getState();
        switch (state.mode) {
            case 'mushaf':
                this.goTo(null, null, null, state.page + 1);
                break;
            case 'context':
                this.goTo(null, null, state.ayah + state.contextAfter, null);
                break;
            case 'surah':
                this.goTo(null, state.surah + 1, 1, null);
                break;
        }
    }

    prev() {
        const state = this.modules.quranModule.getState();
        switch (state.mode) {
            case 'mushaf':
                this.goTo(null, null, null, state.page - 1);
                break;
            case 'context':
                this.goTo(null, null, state.ayah - state.contextBefore, null);
                break;
            case 'surah':
                this.goTo(null, state.surah - 1, null, null);
                break;
        }

    }
    goToHome() {
        this.log('TODO: goToHome');
    }

    goToEnd() {
        this.log('TODO: goToEnd');
    }


    showQuickJump() {
        this.modules.modalModule.showQuickJump();
    }

    hideQuickJump() {
        this.modules.modalModule.hideQuickJump();
    }

    toggleQuickJump() {
        this.modules.modalModule.toggleQuickJump();
    }

    showControlPanel() {
        this.modules.modalModule.showControlPanel();
    }

    hideControlPanel() {
        this.modules.modalModule.hideControlPanel();
    }

    toggleControlPanel() {
        this.modules.modalModule.toggleControlPanel();
    }

    showHelp() {
        this.modules.modalModule.showHelp();
    }

    hideHelp() {
        this.modules.modalModule.hideHelp();
    }

    toggleHelp() {
        this.modules.modalModule.toggleHelp();
    }

    toggleAudioCapture() {
        this.modules.audioModule.toggleAudioCapture();
    }

    setTheme(theme) {
        if (!this.isValidTheme(theme)) {
            console.error(`Invalid Theme ${theme}`);
            return;
        }

        document.body.setAttribute('data-theme' , theme);
        localStorage.setItem('data-theme'       , theme);
        this.log(`Set theme to: '{theme}'`);
    }

    setThemeFromLocalStorage() {
        const themeFromLocalStorage = localStorage.getItem('data-theme');
        this.setTheme(themeFromLocalStorage);
    };

    toggleTheme() {
        let currentTheme = document.body.getAttribute('data-theme');
        switch (currentTheme) {
            case 'dark':
                this.setTheme('sepia');
                break;
            case 'sepia':
                this.setTheme('dark');
                break;
            default: console.error(`Invalid Theme ${theme}`);
        }
    }

    isValidTheme(theme) {
        return theme && theme != '' && ['dark', 'sepia'].includes(theme);
    }
}
