export class ControlModule {
    constructor(dependencies) {
        this.log = dependencies.log;
        this.elements = dependencies.elements;
        this.modules = dependencies.modules;
    }

    async loadMushafPageFromControlPanel() {
        const { pageInput, loadPageBtn } = this.elements;
        
        if (!pageInput) {
            this.log(`❌ Page input element not found`);
            return;
        }
        
        const pageNumber = parseInt(pageInput.value);
        
        if (isNaN(pageNumber) || pageNumber < 1 || pageNumber > 604) {
            this.log(`❌ Invalid page number: ${pageInput.value}. Please enter 1-604.`);
            return;
        }
        
        try {
            if (loadPageBtn) {
                loadPageBtn.disabled = true;
            }
            this.log(`📖 Loading page ${pageNumber}...`);
            await this.modules.quranModule.renderMushafPage(pageNumber);
            this.log(`✔ Page ${pageNumber} loaded successfully`);
        } catch (error) {
            this.log(`❌ Failed to load page ${pageNumber}: ${error.message}`);
        } finally {
            if (loadPageBtn) {
                loadPageBtn.disabled = false;
            }
        }
    }

    async loadVerseWithContextFromControlPanel() {
        const { contextSurahInput, contextVerseInput, loadContextVerseBtn } = this.elements;
        
        if (!contextSurahInput || !contextVerseInput) {
            this.log(`❌ Required input elements not found`);
            return;
        }
        
        const surahNumber = parseInt(contextSurahInput.value);
        const verseNumber = parseInt(contextVerseInput.value);
        
        if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
            this.log(`❌ Invalid surah number: ${contextSurahInput.value}. Please enter 1-114.`);
            return;
        }
        
        if (isNaN(verseNumber) || verseNumber < 1) {
            this.log(`❌ Invalid verse number: ${contextVerseInput.value}. Please enter a positive number.`);
            return;
        }
        
        try {
            if (loadContextVerseBtn) {
                loadContextVerseBtn.disabled = true;
            }
            this.log(`📖 Loading verse ${surahNumber}:${verseNumber} with context...`);
            await this.modules.quranModule.renderVerseWithContext(surahNumber, verseNumber);
            this.log(`✔ Verse ${surahNumber}:${verseNumber} loaded successfully`);
        } catch (error) {
            this.log(`❌ Failed to load verse ${surahNumber}:${verseNumber}: ${error.message}`);
        } finally {
            if (loadContextVerseBtn) {
                loadContextVerseBtn.disabled = false;
            }
        }
    }

    async loadSurahFromControlPanel() {
        const { surahNumberInput, surahVerseInput, loadSurahBtn } = this.elements;
        
        if (!surahNumberInput) {
            this.log(`❌ Surah number input element not found`);
            return;
        }
        
        const surahNumber = parseInt(surahNumberInput.value);
        const targetVerse = surahVerseInput && surahVerseInput.value ? parseInt(surahVerseInput.value) : null;
        
        if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
            this.log(`❌ Invalid surah number: ${surahNumberInput.value}. Please enter 1-114.`);
            return;
        }
        
        if (targetVerse !== null && (isNaN(targetVerse) || targetVerse < 1)) {
            this.log(`❌ Invalid verse number: ${surahVerseInput?.value}. Please enter a positive number.`);
            return;
        }
        
        try {
            if (loadSurahBtn) {
                loadSurahBtn.disabled = true;
            }
            const verseText = targetVerse ? ` with target verse ${targetVerse}` : '';
            this.log(`📖 Loading surah ${surahNumber}${verseText}...`);
            await this.modules.quranModule.renderSurah(surahNumber, targetVerse);
            this.log(`✔ Surah ${surahNumber} loaded successfully`);
        } catch (error) {
            this.log(`❌ Failed to load surah ${surahNumber}: ${error.message}`);
        } finally {
            if (loadSurahBtn) {
                loadSurahBtn.disabled = false;
            }
        }
    }

    promptAndNavigateTo(type) {
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
                        this.log(`❌ Invalid page number: ${value}. Please enter 1-604.`);
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
                            this.log(`❌ Invalid verse format: ${value}. Use format surah:verse (e.g., 18:10)`);
                        }
                    } else {
                        this.log(`❌ Invalid verse format: ${value}. Use format surah:verse (e.g., 18:10)`);
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
                        this.log(`❌ Invalid surah number: ${value}. Please enter 1-114.`);
                    }
                };
                break;
                
            default:
                this.log(`❌ Unknown navigation type: ${type}`);
                return;
        }
        
        const result = window.prompt(prompt);
        if (result !== null && result.trim() !== '') {
            handler(result.trim());
        }
    }

    reloadCurrentView() {
        const currentState = this.modules.quranModule.getCurrentRenderingState();
        if (currentState.mode) {
            switch (currentState.mode) {
                case 'surah':
                    if (currentState.surah) {
                        this.modules.quranModule.renderSurah(currentState.surah, currentState.targetVerse);
                        this.log(`🔄 Reloaded surah ${currentState.surah}`);
                    }
                    break;
                case 'context':
                    if (currentState.surah && currentState.targetVerse) {
                        this.modules.quranModule.renderVerseWithContext(currentState.surah, currentState.targetVerse);
                        this.log(`🔄 Reloaded verse ${currentState.surah}:${currentState.targetVerse} with context`);
                    }
                    break;
                case 'mushaf':
                    if (currentState.page) {
                        this.modules.quranModule.renderMushafPage(currentState.page);
                        this.log(`🔄 Reloaded page ${currentState.page}`);
                    }
                    break;
                default:
                    this.log('❌ No current view to reload');
            }
        } else {
            this.log('❌ No current view to reload');
        }
    }

    navigateNext() {
        const currentState = this.modules.quranModule.getCurrentRenderingState();
        // Basic implementation - can be enhanced based on current mode
        this.log('⏭ Next navigation (to be implemented based on current view)');
    }

    navigatePrevious() {
        const currentState = this.modules.quranModule.getCurrentRenderingState();
        // Basic implementation - can be enhanced based on current mode
        this.log('⏮ Previous navigation (to be implemented based on current view)');
    }

    goToHome() {
        const currentState = this.modules.quranModule.getCurrentRenderingState();
        if (currentState.surah) {
            this.modules.quranModule.renderSurah(currentState.surah, 1); //TODO: no need to re-render
            this.log(`🏠 Navigated to beginning of surah ${currentState.surah}`);
        } else {
            this.log('❌ No current surah to navigate to beginning');
        }
    }

    goToEnd() {
        const currentState = this.modules.quranModule.getCurrentRenderingState();
        if (currentState.surah) {
            // TODO: This would need surah length data to implement properly
            this.log(`🔚 Navigate to end of surah ${currentState.surah} (to be implemented)`);
        } else {
            this.log('❌ No current surah to navigate to end');
        }
    }

    async predict() {
        const pred = await this.modules.audioModule.analyzeCurrentAudio();
        this.modules.quranModule.goToPrediction(pred);
    }

    showControlPanel() {
        this.modules.uiModule.showControlPanel();
    }

    hideControlPanel() {
        this.modules.uiModule.hideControlPanel();
    }

    updateMode() {
        this.modules.uiModule.updateMode();
        // this.quranModule.updateMode();
    }

    toggleAudioCapture() {
        this.modules.audioModule.toggleAudioCapture();
    }
}
