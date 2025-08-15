//TODO: remove the useless elements
export const QuranState = {
    // Private state
    _state: {
        mode: null, // 'mushaf', 'context', 'surah'
        surah: null,
        targetVerse: null,
        quranContainer: null,
        pageNumber: null, // for mushaf mode
        contextBefore: null, // for context mode
        contextAfter: null, // for context mode
        lastUpdated: null
    },

    setQuranContainer(quranContainer) {
        this._state.quranContainer = quranContainer;
    },

    // Getters
    getMode() { return this._state.mode; },
    getSurah() { return this._state.surah; },
    getTargetVerse() { return this._state.targetVerse; },
    getContainerElement() { return this._state.quranContainer; },
    getPageNumber() { return this._state.pageNumber; },
    getContextRange() {
        return {
            before: this._state.contextBefore,
            after: this._state.contextAfter
        };
    },
    getLastUpdated() { return this._state.lastUpdated; },

    // Get complete state (immutable copy)
    getStateClone() { // TODO: structured clone?
        return {
            mode: this._state.mode,
            surah: this._state.surah,
            targetVerse: this._state.targetVerse,
            pageNumber: this._state.pageNumber,
            contextBefore: this._state.contextBefore,
            contextAfter: this._state.contextAfter,
            lastUpdated: this._state.lastUpdated,
            hasContainer: !!this._state.quranContainer // TODO: redundant
        };
    },

    // Validation
    isValidMode(mode) {
        return ['mushaf', 'context', 'surah'].includes(mode);
    },

    isValidSurah(surah) {
        return surah === null || (Number.isInteger(surah) && surah >= 1 && surah <= 114);
    },

    isValidVerse(verse) {
        return verse === null || (Number.isInteger(verse) && verse >= 1);
    },

    isValidPage(page) {
        return page === null || (Number.isInteger(page) && page >= 1 && page <= 604);
    },

    // State setters with validation
    setMushafState(pageNumber, surah = null, targetVerse = null) {
        if (!this.isValidPage(pageNumber)) {
            throw new Error(`Invalid page number: ${pageNumber}`);
        }
        if (!this.isValidSurah(surah)) {
            throw new Error(`Invalid surah number: ${surah}`);
        }
        if (!this.isValidVerse(targetVerse)) {
            throw new Error(`Invalid target verse: ${targetVerse}`);
        }

        this._state.mode = 'mushaf';
        this._state.surah = surah;
        this._state.targetVerse = targetVerse;
        this._state.pageNumber = pageNumber;
        this._state.contextBefore = null;
        this._state.contextAfter = null;
        this._state.lastUpdated = Date.now();
    },

    setContextState(surah, targetVerse, contextBefore, contextAfter) {
        if (!this.isValidSurah(surah)) {
            throw new Error(`Invalid surah number: ${surah}`);
        }
        if (!this.isValidVerse(targetVerse)) {
            throw new Error(`Invalid target verse: ${targetVerse}`);
        }

        this._state.mode = 'context';
        this._state.surah = surah;
        this._state.targetVerse = targetVerse;
        this._state.pageNumber = null;
        this._state.contextBefore = contextBefore;
        this._state.contextAfter = contextAfter;
        this._state.lastUpdated = Date.now();
    },

    setSurahState(surah, targetVerse) {
        if (!this.isValidSurah(surah)) {
            throw new Error(`Invalid surah number: ${surah}`);
        }
        if (!this.isValidVerse(targetVerse)) {
            throw new Error(`Invalid target verse: ${targetVerse}`);
        }

        this._state.mode = 'surah';
        this._state.surah = surah;
        this._state.targetVerse = targetVerse;
        this._state.pageNumber = null;
        this._state.contextBefore = null;
        this._state.contextAfter = null;
        this._state.lastUpdated = Date.now();
    },

    // Update only target verse (for dynamic changes)
    setTargetVerse(targetVerse) {
        if (!this.isValidVerse(targetVerse)) {
            throw new Error(`Invalid target verse: ${targetVerse}`);
        }

        this._state.targetVerse = targetVerse;
        this._state.lastUpdated = Date.now();
    },

    // Check if state is ready for operations //TODO: useless?
    isReady() {
        return !!(this._state.mode && this._state.quranContainer);
    },

    // Clear state
    clear() {
        this._state.mode = null;
        this._state.surah = null;
        this._state.targetVerse = null;
        this._state.quranContainer = null;
        this._state.pageNumber = null;
        this._state.contextBefore = null;
        this._state.contextAfter = null;
        this._state.lastUpdated = Date.now();
    }
};
