import {
    isValidMode,
    isValidSurah,
    isValidAyah,
    isValidPage,
} from './validation.js'

export const QuranState = {
    // Private state
    _state: {
        mode          : null, // 'mushaf', 'context', 'surah'
        surah         : 1,
        ayah          : 1,
        page          : 1,
        contextBefore : 4, // for context mode
        contextAfter  : 4, // for context mode
        lastUpdated   : Date.now()
    },

    // Getters
    getMode()             { return this._state.mode; },
    getSurah()            { return this._state.surah; },
    getAyah()             { return this._state.ayah; },
    getPage()             { return this._state.page; },
    getContextRange()     { return {before: this._state.contextBefore, after: this._state.contextAfter}; },
    getLastUpdated()      { return this._state.lastUpdated; },

    // Get state (immutable copy)
    getStateClone() {
        return structuredClone(this._state);
    },

    setState(mode, surah, ayah, page, opts = {}) {
        if (!isValidPage(page)) {
            throw new Error(`Invalid page: ${page}`);
        }
        if (!isValidSurah(surah)) {
            throw new Error(`Invalid surah: ${surah}`);
        }
        if (!isValidAyah(ayah)) {
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

    setAyah(ayah) {
        if (!isValidAyah(ayah)) {
            throw new Error(`Invalid ayah: ${ayah}`);
        }

        this._state.ayah = ayah;
        this._state.lastUpdated = Date.now();
    },

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
