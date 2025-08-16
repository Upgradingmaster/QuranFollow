export class ControlModule {
    constructor(dependencies, modules) {
        this.log = dependencies.log;
        this.elements = dependencies.elements;
        this.modules = modules;
    }

    loadMushafPage(pageNumber) {
        const { loadPageBtn } = this.elements;

        if (loadPageBtn) { loadPageBtn.disabled = true; }
        this.modules.quranModule.renderMushafPage(pageNumber);
        this.modules.uiModule.setMode('mushaf');
        if (loadPageBtn) { loadPageBtn.disabled = false; }
    }

    loadMushafPageFromControlPanel() {
        const { pageInput } = this.elements;
        
        if (!pageInput) {
            console.error(`Page input element not found`);
            return;
        }
        
        const pageNumber = parseInt(pageInput.value);

        if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > 604) {
            this.log(`[X] Invalid page number: ${pageInput.value}. Please enter 1-604.`);
            return;
        }

        this.loadMushafPage(pageNumber);
    }

    loadVerseWithContext(surahNumber, verseNumber) {
        const { loadContextVerseBtn } = this.elements;

        if (loadContextVerseBtn) { loadContextVerseBtn.disabled = true; }
        this.modules.quranModule.renderVerseWithContext(surahNumber, verseNumber);
        this.modules.uiModule.setMode('context');
        if (loadContextVerseBtn) { loadContextVerseBtn.disabled = false; }
    }

    loadVerseWithContextFromControlPanel() {
        const { contextSurahInput, contextVerseInput } = this.elements;
        
        if (!contextSurahInput || !contextVerseInput) {
            console.error(`Required input elements not found`);
            return;
        }
        
        const surahNumber = parseInt(contextSurahInput.value);
        const verseNumber = parseInt(contextVerseInput.value);
        
        if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
            this.log(`[X] Invalid surah number: ${contextSurahInput.value}. Please enter 1-114.`);
            return;
        }

        if (isNaN(verseNumber) || verseNumber < 1) {
            this.log(`[X] Invalid verse number: ${contextVerseInput.value}. Please enter a positive number.`);
            return;
        }
        
        this.loadVerseWithContext(surahNumber, verseNumber);
    }

    loadSurah(surahNumber, verseNumber = null) {
        const { loadSurahBtn } = this.elements;

        if (loadSurahBtn) { loadSurahBtn.disabled = true; }
        this.modules.quranModule.renderSurah(surahNumber, verseNumber);
        this.modules.uiModule.setMode('surah');
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
        
        if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
            this.log(`[X] Invalid surah number: ${surahNumberInput.value}. Please enter 1-114.`);
            return;
        }
        
        if (verseNumber !== null && (isNaN(verseNumber) || verseNumber < 1)) {
            this.log(`[X] Invalid verse number: ${surahVerseInput?.value}. Please enter a positive number.`);
            return;
        }

        this.loadSurah(surahNumber, verseNumber);
    }

    // TODO: use quranModule.goto
    promptAndNavigateTo(type) { //TODO: check if this function works
        const { pageInput,
                contextSurahInput, contextVerseInput,
                surahNumberInput, surahVerseInput } = this.elements;
        let prompt, handler;
        
        switch (type) {
            case 'page':
                prompt = 'Enter page number (1-604):';
                handler = (value) => {
                    const pageNumber = parseInt(value);
                    if (pageNumber >= 1 && pageNumber <= 604) {
                        if (pageInput) pageInput.value = pageNumber;
                        this.loadQuranPage();
                    } else {
                        this.log(`[X] Invalid page number: ${value}. Please enter 1-604.`);
                    }
                };
                break;
                
            case 'verse':
                prompt = 'Enter verse (format: surah:verse, e.g., 18:10):';
                handler = (value) => {
                    const parts = value.split(':');
                    if (parts.length === 2) {
                        const surah = parseInt(parts[0]);
                        const verse = parseInt(parts[1]);
                        if (surah >= 1 && surah <= 114 && verse >= 1) {
                            if (contextSurahInput) contextSurahInput.value = surah;
                            if (contextVerseInput) contextVerseInput.value = verse;
                            this.loadVerseWithContext();
                        } else {
                            this.log(`[X] Invalid verse format: ${value}. Use format surah:verse (e.g., 18:10)`);
                        }
                    } else {
                        this.log(`[X] Invalid verse format: ${value}. Use format surah:verse (e.g., 18:10)`);
                    }
                };
                break;
                
            case 'surah':
                prompt = 'Enter surah number (1-114):';
                handler = (value) => {
                    const surahNumber = parseInt(value);
                    if (surahNumber >= 1 && surahNumber <= 114) {
                        if (surahNumberInput) surahNumberInput.value = surahNumber;
                        this.loadSurah(); //TODO
                    } else {
                        this.log(`[X] Invalid surah number: ${value}. Please enter 1-114.`);
                    }
                };
                break;
                
            default:
                console.error(`[X] Unknown navigation type: ${type}`);
                return;
        }
        
        const result = window.prompt(prompt);
        if (result !== null && result.trim() !== '') {
            handler(result.trim());
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

    //TODO: !! try to perist location on switch of modes, this could be done without changing anything here, but having shared input between modes
    updateMode(mode = null) {
        if (mode != null) {
            this.modules.uiModule.setMode(mode);
        } else {
            mode = this.modules.uiModule.updateMode();
        }

        switch (mode) {
        case 'mushaf':
            this.loadMushafPageFromControlPanel();
            break;
        case 'context':
            this.loadVerseWithContextFromControlPanel();
            break;
        case 'surah':
            this.loadSurahFromControlPanel();
            break;
        }
    }



    toggleAudioCapture() {
        this.modules.audioModule.toggleAudioCapture();
    }
}
