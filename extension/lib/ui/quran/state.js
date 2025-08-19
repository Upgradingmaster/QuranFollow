import {
    getPageFromKey,
    getKeyFromPage
} from './data.js';

//TODO: remove the useless properties
export const QuranState = {
    // Private state
    _state: {
        mode: null, // 'mushaf', 'context', 'surah'
        surah: null,
        ayah: null,
        page: null,
        contextBefore: null, // for context mode
        contextAfter: null, // for context mode
        quranContainer: null,
        lastUpdated: null
    },

    initialize(quranContainer) {
        this._state.mode           = null;
        this._state.surah          = 1;
        this._state.ayah           = 1;
        this._state.page           = 1;
        this._state.contextBefore  = 4;
        this._state.contextAfter   = 4;
        this._state.quranContainer = quranContainer;
        this._state.lastUpdated    = Date.now();
    },

    // Getters
    getMode()             { return this._state.mode; },
    getSurah()            { return this._state.surah; },
    getAyah()             { return this._state.ayah; },
    getContainerElement() { return this._state.quranContainer; },
    getPage()             { return this._state.page; },
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
            mode          : this._state.mode,
            surah         : this._state.surah,
            ayah          : this._state.ayah,
            page          : this._state.page,
            contextBefore : this._state.contextBefore,
            contextAfter  : this._state.contextAfter,
            lastUpdated   : this._state.lastUpdated,
            hasContainer  : !!this._state.quranContainer // TODO: redundant
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

    setState(mode, surah, ayah, page, opts = {}) {
        if (!this.isValidPage(page)) {
            throw new Error(`Invalid page: ${page}`);
        }
        if (!this.isValidSurah(surah)) {
            throw new Error(`Invalid surah: ${surah}`);
        }
        if (!this.isValidVerse(ayah)) {
            throw new Error(`Invalid ayah: ${ayah}`);
        }


        switch (mode) {
        case 'mushaf':
            this._state.mode = 'mushaf';
            break;
        case 'context':
            this._state.mode = 'context';
            this._state.contextBefore = opts.contextBefore;
            this._state.contextAfter = opts.contextAfter;
            break;
        case 'surah':
            this._state.mode = 'surah';
            break;
        default:
            console.error('Unsupported Mode!');
        }

        this._state.surah         = surah;
        this._state.ayah          = ayah;
        this._state.page          = page;
        this._state.lastUpdated   = Date.now();
        console.log('State Changed: ', this._state);
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
