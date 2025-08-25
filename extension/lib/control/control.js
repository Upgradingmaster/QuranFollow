export class ControlModule {
    constructor(dependencies, modules) {
        this.log = dependencies.log;
        this.elements = dependencies.elements;
        this.modules = modules;
    }

    // Wrapper around quranModule.goTo to update the control panel with the state
    goTo(mode, surah, ayah, page, opts = this.defaultGoToOpts) {
        const obj = this.modules.quranModule.goTo(mode, surah, ayah, page, opts);
        if (obj.ok) {
            const newState = obj.value;
            const newSurah = newState.surah;
            const newAyah  = newState.ayah;
            const newPage  = newState.page;
            const newSurahName = this.modules.quranModule.getSurahName(newSurah)

            // TODO: only update ui elements if they've changed
            this.modules.uiModule.setControlPanelInputs(newSurah, newAyah, newPage);
            this.modules.uiModule.setLocationInfo(newSurahName, newSurah, newAyah);
        } else {
            this.log(obj.error);
        }
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
        const state = this.modules.quranModule.getState();
        if (state.ayah == 1) {
            const prevSurah = state.surah - 1;
            const lastAyah = this.modules.quranModule.getSurahLength(prevSurah);
            this.goTo(null, prevSurah, lastAyah, null);
        } else {
            this.goTo(null, null, state.ayah - 1, null);
        }
    }

    down() {
        const state = this.modules.quranModule.getState();
        if (state.ayah == this.modules.quranModule.getSurahLength(state.surah)) {
            this.goTo(null, state.surah + 1, 1, null);
        } else {
            this.goTo(null, null, state.ayah + 1, null);
        }
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
    home() {
        this.goTo(null, null, 1, null);
    }

    end() {
        const surah = this.modules.quranModule.getSurah();
        const lastAyah =  this.modules.quranModule.getSurahLength(surah);
        this.goTo(null, null, lastAyah, null);
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
        if (!this.modules.audioModule.isCapturing()) {
            this.startAudioCapture();
        } else {
            this.stopAudioCapture();
        }
    }

    startAudioCapture() {
        if (!this.browserSupportsAudioCapture()) {
            this.log(`Audio Capture is not supported on '${this.getBrowser()}'. You must use the local backend to use this feature.`);
            return;
        }

        this.modules.uiModule.startAudioCapture();
        try {
            this.modules.audioModule.startCapture();
            this.modules.uiModule.startedAudioCapture();
        } catch {
            this.modules.uiModule.failedAudioCapture();
        }
    }

    stopAudioCapture() {
        this.modules.audioModule.stopCapture();
        this.modules.uiModule.stoppedAudioCapture();
    }

    onControlPanelKeyInput () {
        const surah = parseInt(this.elements.surahInput.value);
        const ayah  = parseInt(this.elements.ayahInput.value);
        if (!this.modules.quranModule.isValidSurah(surah)) {
            this.elements.ayahInput.disabled = true;
            this.elements.pageInput.disabled = true;
        } else if (!this.modules.quranModule.isValidAyah(ayah, surah))  {
            this.elements.surahInput.disabled = true;
            this.elements.pageInput.disabled = true;
        } else {
            const page  = this.modules.quranModule.getPageFromKey(surah, ayah);
            this.elements.surahInput.disabled = false;
            this.elements.ayahInput.disabled  = false;
            this.elements.pageInput.disabled  = false;
            this.elements.pageInput.value = page;
        }
    }

    onControlPanelPageInput () {
        const page = parseInt(this.elements.pageInput.value);
        if (!this.modules.quranModule.isValidPage(page)) {
            this.elements.surahInput.disabled = true;
            this.elements.ayahInput.disabled  = true;
        } else {
            const key  = this.modules.quranModule.getKeyFromPage(page);
            this.elements.surahInput.disabled = false;
            this.elements.ayahInput.disabled  = false;
            this.elements.surahInput.value    = key.surah;
            this.elements.ayahInput.value     = key.ayah;
        }

    }

    getBrowser() {
        const userAgent = navigator.userAgent;

        if (userAgent.includes('Firefox')) {
            return 'Firefox';
        } else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            return 'Chrome';
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            return 'Safari';
        } else if (userAgent.includes('Edg')) {
            return 'Edge';
        } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
            return 'Opera';
        }

        return 'Unknown';
    }

    // TODO: Test with other Chromium browsers
    browserSupportsAudioCapture() {
        return this.getBrowser() == 'Chrome';
    }
}
