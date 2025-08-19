export class ControlModule {
    constructor(dependencies, modules) {
        this.log = dependencies.log;
        this.elements = dependencies.elements;
        this.modules = modules;
    }

    goTo(surah, ayah, mode = null, page = null) {
        this.surahInput.value = surah;
        this.ayahInput.value  = ayah;
        this.pageInput.value  = page;
        this.goBtn.value      = surah;
        this.modules.quranModule.goTo(surah, ayah, mode, page);
    }

    loadMushafPage(page, surah, ayah) {
        const { loadPageBtn } = this.elements;

        if (loadPageBtn) { loadPageBtn.disabled = true; }
        //TODO: disable the other input event listeners here

        this.modules.uiModule.setMode('mushaf');
        this.modules.quranModule.goTo(surah, ayah, 'mushaf', page);

        if (loadPageBtn) { loadPageBtn.disabled = false; }
    }

    loadMushafPageFromControlPanel() {
        const {mushafPageInput, mushafSurahInput, mushafVerseInput} = this.elements;

        if (!mushafPageInput || !mushafSurahInput || !mushafVerseInput) {
            console.error(`Required input elements not found`);
            return;
        }

        const page  = parseInt(mushafPageInput.value);
        const surah = parseInt(mushafSurahInput.value);
        const ayah  = parseInt(mushafVerseInput.value);

        this.loadMushafPage(page, surah, ayah);
    }

    loadVerseWithContext(surah, ayah) {
        const { loadContextVerseBtn } = this.elements;

        if (loadContextVerseBtn) { loadContextVerseBtn.disabled = true; }
        //TODO: disable the other input event listeners here

        this.modules.uiModule.setMode('context');
        this.modules.quranModule.goTo(surah, ayah, 'context');

        if (loadContextVerseBtn) { loadContextVerseBtn.disabled = false; }
    }

    loadVerseWithContextFromControlPanel() {
        const { contextSurahInput, contextVerseInput } = this.elements;
        
        if (!contextSurahInput || !contextVerseInput) {
            console.error(`Required input elements not found`);
            return;
        }
        
        const surah = parseInt(contextSurahInput.value);
        const ayah  = parseInt(contextVerseInput.value);
        
        this.loadVerseWithContext(surah, ayah);
    }

    loadSurah(surah, ayah = null) {
        const { loadSurahBtn } = this.elements;

        if (loadSurahBtn) { loadSurahBtn.disabled = true; }
        //TODO: disable the other input event listeners here

        this.modules.uiModule.setMode('surah');
        this.modules.quranModule.goTo(surah, ayah, 'surah');

        if (loadSurahBtn) { loadSurahBtn.disabled = false; }
    }

    loadSurahFromControlPanel() {
        const { surahNumberInput, surahVerseInput } = this.elements;
        
        if (!surahNumberInput) {
            console.error(`Surah number input element not found`);
            return;
        }
        
        const surahNumber = parseInt(surahNumberInput.value);
        const verseNumber = surahVerseInput && surahVerseInput.value ? parseInt(surahVerseInput.value) : null;
        
        this.loadSurah(surahNumber, verseNumber);
    }

    controlPanelGoTo(mode = null) {
        if (!mode) { mode = this.modules.quranModule.getMode(); }
        throw new Error("TODO: controlPanelGoTo");
    }

    modalGoTo(mode = null) {
        if (!mode) { mode = this.modules.quranModule.getMode(); }
        const { mushafPageInput,
                contextSurahInput, contextVerseInput,
                surahNumberInput, surahVerseInput } = this.elements;

        let prompt, handler;
        let surah, ayah, page;
        
        switch (mode) {
            case 'mushaf':
                prompt = 'Enter page number (1-604):';
                handler = (value) => {
                    page = parseInt(value);
                    if (mushafPageInput) mushafPageInput.value = page;
                };
                break;
                
            case 'context':
                prompt = 'Enter verse (format: surah:verse, e.g., 18:10):';
                handler = (value) => {
                    const parts = value.split(':');
                    if (parts.length === 2) {
                        surah = parseInt(parts[0]);
                        ayah = parseInt(parts[1]);
                        if (contextSurahInput) contextSurahInput.value = surah;
                        if (contextVerseInput) contextVerseInput.value = ayah;
                    } else {
                        this.log(`[X] Invalid verse format: ${value}. Use format surah:verse (e.g., 18:10)`);
                    }
                };
                break;
                
            case 'surah':
                prompt = 'Enter surah number (1-114):';
                handler = (value) => {
                    surah = parseInt(value);
                    if (surahNumberInput) surahNumberInput.value = surah;
                };
                break;
                
            default:
                console.error('Unsupported Mode!');
                return;
        }

        const result = window.prompt(prompt)?.trim();
        if (result && result != '') {
            handler(result);
            this.modules.quranModule.goTo(surah, ayah, mode, page);
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

    async predict() {
        const pred = await this.modules.audioModule.analyzeCurrentAudio();
        if (!pred) return;

        if (pred.status == 'matched') {
            const surahNumber = parseInt(pred.surah);
            const ayahNumber = parseInt(pred.ayah);
            this.log(`Found: ${surahNumber}:${ayahNumber}`);
            this.modules.quranModule.goTo(surahNumber, ayahNumber);
        } else {
            this.log("[?] Couldn't find a matching verse")
        }
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

    updateMode(mode, firstRun = false) {
        if (!mode) { mode = this.modules.uiModule.getSelectedMode(); }
        if (!this.modules.quranModule.isValidMode(mode)) {
            throw new Error('Invalid mode');
        }
        const currentMode = this.modules.quranModule.getMode();
        if (mode == currentMode) { return; }

        this.modules.uiModule.setSelectedMode(mode);

        // TODO: this will go away when we have a better startup screen
        let opts = this.modules.quranModule.getDefaultGoToOpts();
        if (firstRun) { // don't highlight
            opts.highlightCurrentVerse = false;
        }

        this.modules.quranModule.goTo(null, null, mode, null, opts);
    }

    showStartupScreen(mode) {
        // TODO: better startup screen
        this.updateMode(mode, true);
    }

    toggleAudioCapture() {
        this.modules.audioModule.toggleAudioCapture();
    }
}
