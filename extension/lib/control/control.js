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
            const surahNumber = parseInt(pred.surah);
            const ayahNumber = parseInt(pred.ayah);
            this.log(`Found: ${surahNumber}:${ayahNumber}`);
            this.modules.quranModule.goTo(surahNumber, ayahNumber);
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

        this.goTo(Number(surahInput.value), Number(ayahInput.value), null, Number(pageInput.value));
    }

    modalGoTo(mode = null) { // TODO:
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


    // loadMushafPageFromControlPanel() {
    //     const {mushafPageInput, mushafSurahInput, mushafVerseInput} = this.elements;
    //
    //     if (!mushafPageInput || !mushafSurahInput || !mushafVerseInput) {
    //         console.error(`Required input elements not found`);
    //         return;
    //     }
    //
    //     const page  = parseInt(mushafPageInput.value);
    //     const surah = parseInt(mushafSurahInput.value);
    //     const ayah  = parseInt(mushafVerseInput.value);
    //     this.loadMushafPage(page, surah, ayah);
    // }


    // loadVerseWithContextFromControlPanel() {
    //     const { contextSurahInput, contextVerseInput } = this.elements;

    //     if (!contextSurahInput || !contextVerseInput) {
    //         console.error(`Required input elements not found`);
    //         return;
    //     }

    //     const surah = parseInt(contextSurahInput.value);
    //     const ayah  = parseInt(contextVerseInput.value);

    //     this.loadVerseWithContext(surah, ayah);
    // }


    // loadSurahFromControlPanel() {
    //     const { surahNumberInput, surahVerseInput } = this.elements;

    //     if (!surahNumberInput) {
    //         console.error(`Surah number input element not found`);
    //         return;
    //     }

    //     const surahNumber = parseInt(surahNumberInput.value);
    //     const verseNumber = surahVerseInput && surahVerseInput.value ? parseInt(surahVerseInput.value) : null;

    //     this.loadSurah(surahNumber, verseNumber);
    // }
