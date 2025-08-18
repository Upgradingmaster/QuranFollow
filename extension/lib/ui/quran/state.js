//TODO: remove the useless elements
export const QuranState = {
    // Private state
    _state: {
        mode: null, // 'mushaf', 'context', 'surah'
        surah: null,
        ayah: null,
        quranContainer: null,
        page: null, // for mushaf mode
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
    getTargetVerse() { return this._state.ayah; },
    getContainerElement() { return this._state.quranContainer; },
    getPage() { return this._state.page; },
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
            ayah: this._state.ayah,
            page: this._state.page,
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
    setMushafState(page, surah = null, ayah = null) {
        if (!this.isValidPage(page)) {
            throw new Error(`Invalid page: ${page}`);
        }
        if (!this.isValidSurah(surah)) {
            throw new Error(`Invalid surah: ${surah}`);
        }
        if (!this.isValidVerse(ayah)) {
            throw new Error(`Invalid ayah: ${ayah}`);
        }

        this._state.mode = 'mushaf';
        this._state.surah = surah;
        this._state.ayah = ayah;
        this._state.page = page;
        this._state.contextBefore = null;
        this._state.contextAfter = null;
        this._state.lastUpdated = Date.now();
    },

    setContextState(surah, ayah, contextBefore, contextAfter) {
        if (!this.isValidSurah(surah)) {
            throw new Error(`Invalid surah: ${surah}`);
        }
        if (!this.isValidVerse(ayah)) {
            throw new Error(`Invalid ayah: ${ayah}`);
        }

        this._state.mode = 'context';
        this._state.surah = surah;
        this._state.ayah = ayah;
        this._state.page = null;
        this._state.contextBefore = contextBefore;
        this._state.contextAfter = contextAfter;
        this._state.lastUpdated = Date.now();
    },

    setSurahState(surah, ayah) {
        if (!this.isValidSurah(surah)) {
            throw new Error(`Invalid surah: ${surah}`);
        }
        if (!this.isValidVerse(ayah)) {
            throw new Error(`Invalid ayah: ${ayah}`);
        }

        this._state.mode = 'surah';
        this._state.surah = surah;
        this._state.ayah = ayah;
        this._state.page = null;
        this._state.contextBefore = null;
        this._state.contextAfter = null;
        this._state.lastUpdated = Date.now();
    },

    setState(mode, state) {
        switch (mode) {
        case 'mushaf':  this.setMushafState(state.page); break;
        case 'context': this.setContextState(state.surah, state.ayah, state.contextBefore, state.contextAfter); break;
        case 'surah':   this.setSurahState(state.surah, state.ayah); break;
        default: console.error('Setting quran state: Unsupported Mode');
        }
    },

    setTargetVerse(ayah) {
        if (!this.isValidVerse(ayah)) {
            throw new Error(`Invalid ayah: ${ayah}`);
        }

        this._state.ayah = ayah;
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
        this._state.ayah = null;
        this._state.quranContainer = null;
        this._state.page = null;
        this._state.contextBefore = null;
        this._state.contextAfter = null;
        this._state.lastUpdated = Date.now();
    }
};
