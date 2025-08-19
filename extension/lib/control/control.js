export class ControlModule {
    constructor(dependencies, modules) {
        this.log = dependencies.log;
        this.elements = dependencies.elements;
        this.modules = modules;
    }

    // Wrapper around quranModule.goTo to update the control panel with the state
    goTo(surah, ayah, mode = null, page = null, opts = this.defaultGoToOpts) {
        const newState = this.modules.quranModule.goTo(surah, ayah, mode, page, opts);

        const newSurah = this.modules.quranModule.getSurah();
        const newAyah  = this.modules.quranModule.getAyah();
        const newPage  = this.modules.quranModule.getPage();
        this.modules.uiModule.setControlPanelInputs(newSurah, newAyah, newPage);
    }

    async predict() {
        const pred = await this.modules.audioModule.analyzeCurrentAudio();
        if (!pred) return;

        if (pred.status == 'matched') {
            const surah = parseInt(pred.surah);
            const ayah  = parseInt(pred.ayah);
            this.log(`Found: ${surah}:${ayah}`);
            this.goTo(surah, ayah);
        } else {
            this.log("[?] Couldn't find a matching verse")
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
            opts.highlightCurrentVerse = false;
        }

        this.goTo(null, null, mode, null, opts);
    }

    showStartupScreen(mode) {
        // TODO: better startup screen
        this.updateMode(mode, true);
    }

    controlPanelGoTo() {
        const { surahInput, ayahInput, pageInput } = this.elements;

        this.goTo(parseInt(surahInput.value), parseInt(ayahInput.value), null, parseInt(pageInput.value));
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
            this.goTo(surah, ayah, null, null);
        } else {
            this.log(`[X] Invalid verse format: ${key}. Use format surah:verse (e.g., 18:10)`);
        }
    }

    reloadQuranView() {
        this.modules.quranModule.reload();
    }

    navigateNext() {
        this.log('TODO: navigateNext');
    }

    navigatePrevious() {
        this.log('TODO: navigatePrevious');
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
}
