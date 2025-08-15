export class ControlModule {
    constructor(dependencies, modules) {
        this.log = dependencies.log;
        this.elements = dependencies.elements;
        this.modules = modules;
        console.log("Building Controller with: ", this.modules);
    }

    loadMushafPage(pageNumber) {
        const { loadPageBtn } = this.elements;

        try {
            if (loadPageBtn) {
                loadPageBtn.disabled = true;
            }
            this.log(`📖 Loading page ${pageNumber}...`);
            this.modules.quranModule.renderMushafPage(pageNumber);
            this.log(`✔ Page ${pageNumber} loaded successfully`);
        } catch (error) {
            this.log(`❌ Failed to load page ${pageNumber}: ${error.message}`);
        } finally {
            if (loadPageBtn) {
                loadPageBtn.disabled = false;
            }
        }
    }

    loadMushafPageFromControlPanel() {
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
            this.modules.quranModule.renderMushafPage(pageNumber);
            this.log(`✔ Page ${pageNumber} loaded successfully`);
        } catch (error) {
            this.log(`❌ Failed to load page ${pageNumber}: ${error.message}`);
        } finally {
            if (loadPageBtn) {
                loadPageBtn.disabled = false;
            }
        }
    }

    loadVerseWithContext(surahNumber, verseNumber) {
        const { contextSurahInput, contextVerseInput, loadContextVerseBtn } = this.elements;

        try {
            if (loadContextVerseBtn) {
                loadContextVerseBtn.disabled = true;
            }
            this.log(`📖 Loading verse ${surahNumber}:${verseNumber} with context...`);
            this.modules.quranModule.renderVerseWithContext(surahNumber, verseNumber);
            this.log(`✔ Verse ${surahNumber}:${verseNumber} loaded successfully`);
        } catch (error) {
            this.log(`❌ Failed to load verse ${surahNumber}:${verseNumber}: ${error.message}`);
        } finally {
            if (loadContextVerseBtn) {
                loadContextVerseBtn.disabled = false;
            }
        }
    }

    loadVerseWithContextFromControlPanel() {
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
            this.modules.quranModule.renderVerseWithContext(surahNumber, verseNumber);
            this.log(`✔ Verse ${surahNumber}:${verseNumber} loaded successfully`);
        } catch (error) {
            this.log(`❌ Failed to load verse ${surahNumber}:${verseNumber}: ${error.message}`);
        } finally {
            if (loadContextVerseBtn) {
                loadContextVerseBtn.disabled = false;
            }
        }
    }

    loadSurah(surahNumber, verseNumber = null) {
        const { loadSurahBtn } = this.elements;

        try {
            if (loadSurahBtn) {
                loadSurahBtn.disabled = true;
            }
            const verseText = verseNumber ? ` with target verse ${verseNumber}` : '';
            this.log(`📖 Loading surah ${surahNumber}${verseText}...`);
            this.modules.quranModule.renderSurah(surahNumber, verseNumber);
            this.log(`✔ Surah ${surahNumber} loaded successfully`);
        } catch (error) {
            this.log(`❌ Failed to load surah ${surahNumber}: ${error.message}`);
        } finally {
            if (loadSurahBtn) {
                loadSurahBtn.disabled = false;
            }
        }
    }

    loadSurahFromControlPanel() {
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
            this.modules.quranModule.renderSurah(surahNumber, targetVerse);
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
        if (pred) {
            this.modules.quranModule.goToPrediction(pred);
        }
    }

    showControlPanel() {
        this.modules.uiModule.showControlPanel();
    }

    hideControlPanel() {
        this.modules.uiModule.hideControlPanel();
    }

    //TODO: try to update with where we were before, this could be done without changing anything here, but having shared input between modes
    updateMode() {
        const mode = this.modules.uiModule.updateMode();
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
