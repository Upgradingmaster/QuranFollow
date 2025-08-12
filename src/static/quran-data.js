// ============================================================================
// Data Loading and State Management
// ============================================================================

// Data paths
const verses_path      = '/static/res/scripts/uthmani-aba.json'
const words_path       = '/static/res/scripts/uthmani-wbw.json'
const layout_path      = '/static/res/layouts/uthmani.json'
const translation_path = '/static/res/translations/si-simple.json'

// Global data stores
let wordsData = null;
let layoutData = null;
let surahNames = null;
let versesData = null;
let translationData = null;

// Rendering state management
const RenderingState = {
    // Private state
    _state: {
        mode: null, // 'mushaf', 'context', 'surah'
        surah: null,
        targetVerse: null,
        containerElement: null,
        pageNumber: null, // for mushaf mode
        contextBefore: null, // for context mode
        contextAfter: null, // for context mode
        lastUpdated: null
    },

    // Getters
    getMode() { return this._state.mode; },
    getSurah() { return this._state.surah; },
    getTargetVerse() { return this._state.targetVerse; },
    getContainerElement() { return this._state.containerElement; },
    getPageNumber() { return this._state.pageNumber; },
    getContextRange() { 
        return { 
            before: this._state.contextBefore, 
            after: this._state.contextAfter 
        }; 
    },
    getLastUpdated() { return this._state.lastUpdated; },

    // Get complete state (immutable copy)
    getState() {
        return {
            mode: this._state.mode,
            surah: this._state.surah,
            targetVerse: this._state.targetVerse,
            pageNumber: this._state.pageNumber,
            contextBefore: this._state.contextBefore,
            contextAfter: this._state.contextAfter,
            lastUpdated: this._state.lastUpdated,
            hasContainer: !!this._state.containerElement
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
    setMushafState(pageNumber, containerElement) {
        if (!this.isValidPage(pageNumber)) {
            throw new Error(`Invalid page number: ${pageNumber}`);
        }
        if (!containerElement) {
            throw new Error('Container element is required');
        }

        this._state.mode = 'mushaf';
        this._state.surah = null;
        this._state.targetVerse = null;
        this._state.pageNumber = pageNumber;
        this._state.contextBefore = null;
        this._state.contextAfter = null;
        this._state.containerElement = containerElement;
        this._state.lastUpdated = Date.now();
    },

    setContextState(surah, targetVerse, contextBefore, contextAfter, containerElement) {
        if (!this.isValidSurah(surah)) {
            throw new Error(`Invalid surah number: ${surah}`);
        }
        if (!this.isValidVerse(targetVerse)) {
            throw new Error(`Invalid target verse: ${targetVerse}`);
        }
        if (!containerElement) {
            throw new Error('Container element is required');
        }

        this._state.mode = 'context';
        this._state.surah = surah;
        this._state.targetVerse = targetVerse;
        this._state.pageNumber = null;
        this._state.contextBefore = contextBefore;
        this._state.contextAfter = contextAfter;
        this._state.containerElement = containerElement;
        this._state.lastUpdated = Date.now();
    },

    setSurahState(surah, targetVerse, containerElement) {
        if (!this.isValidSurah(surah)) {
            throw new Error(`Invalid surah number: ${surah}`);
        }
        if (!this.isValidVerse(targetVerse)) {
            throw new Error(`Invalid target verse: ${targetVerse}`);
        }
        if (!containerElement) {
            throw new Error('Container element is required');
        }

        this._state.mode = 'surah';
        this._state.surah = surah;
        this._state.targetVerse = targetVerse;
        this._state.pageNumber = null;
        this._state.contextBefore = null;
        this._state.contextAfter = null;
        this._state.containerElement = containerElement;
        this._state.lastUpdated = Date.now();
    },

    // Update only target verse (for dynamic changes)
    setTargetVerse(targetVerse) {
        if (!this.isValidVerse(targetVerse)) {
            throw new Error(`Invalid target verse: ${targetVerse}`);
        }
        if (this._state.mode === 'mushaf') {
            throw new Error('Cannot set target verse in mushaf mode');
        }
        if (!this._state.containerElement) {
            throw new Error('No container element available');
        }

        this._state.targetVerse = targetVerse;
        this._state.lastUpdated = Date.now();
    },

    // Check if state is ready for operations
    isReady() {
        return !!(this._state.mode && this._state.containerElement);
    },

    // Check if mode supports target verses
    supportsTargetVerse() {
        return this._state.mode === 'context' || this._state.mode === 'surah';
    },

    // Clear state
    clear() {
        this._state.mode = null;
        this._state.surah = null;
        this._state.targetVerse = null;
        this._state.containerElement = null;
        this._state.pageNumber = null;
        this._state.contextBefore = null;
        this._state.contextAfter = null;
        this._state.lastUpdated = Date.now();
    }
};

// Surah names in Arabic
const SURAH_NAMES = {
    1: "الفاتحة", 2: "البقرة", 3: "آل عمران", 4: "النساء", 5: "المائدة", 6: "الأنعام", 7: "الأعراف", 8: "الأنفال", 9: "التوبة", 10: "يونس",
    11: "هود", 12: "يوسف", 13: "الرعد", 14: "إبراهيم", 15: "الحجر", 16: "النحل", 17: "الإسراء", 18: "الكهف", 19: "مريم", 20: "طه",
    21: "الأنبياء", 22: "الحج", 23: "المؤمنون", 24: "النور", 25: "الفرقان", 26: "الشعراء", 27: "النمل", 28: "القصص", 29: "العنكبوت", 30: "الروم",
    31: "لقمان", 32: "السجدة", 33: "الأحزاب", 34: "سبأ", 35: "فاطر", 36: "يس", 37: "الصافات", 38: "ص", 39: "الزمر", 40: "غافر",
    41: "فصلت", 42: "الشورى", 43: "الزخرف", 44: "الدخان", 45: "الجاثية", 46: "الأحقاف", 47: "محمد", 48: "الفتح", 49: "الحجرات", 50: "ق",
    51: "الذاريات", 52: "الطور", 53: "النجم", 54: "القمر", 55: "الرحمن", 56: "الواقعة", 57: "الحديد", 58: "المجادلة", 59: "الحشر", 60: "الممتحنة",
    61: "الصف", 62: "الجمعة", 63: "المنافقون", 64: "التغابن", 65: "الطلاق", 66: "التحريم", 67: "الملك", 68: "القلم", 69: "الحاقة", 70: "المعارج",
    71: "نوح", 72: "الجن", 73: "المزمل", 74: "المدثر", 75: "القيامة", 76: "الإنسان", 77: "المرسلات", 78: "النبأ", 79: "النازعات", 80: "عبس",
    81: "التكوير", 82: "الانفطار", 83: "المطففين", 84: "الانشقاق", 85: "البروج", 86: "الطارق", 87: "الأعلى", 88: "الغاشية", 89: "الفجر", 90: "البلد",
    91: "الشمس", 92: "الليل", 93: "الضحى", 94: "الشرح", 95: "التين", 96: "العلق", 97: "القدر", 98: "البينة", 99: "الزلزلة", 100: "العاديات",
    101: "القارعة", 102: "التكاثر", 103: "العصر", 104: "الهمزة", 105: "الفيل", 106: "قريش", 107: "الماعون", 108: "الكوثر", 109: "الكافرون", 110: "النصر",
    111: "المسد", 112: "الإخلاص", 113: "الفلق", 114: "الناس"
};

// ============================================================================
// Data Loading Functions
// ============================================================================

/**
 * Loads words data from the SQLite database
 * @returns {Promise<Object>} Words data indexed by ID
 */
async function loadWordsData() {
    if (wordsData) return wordsData;

    try {
        const response = await fetch(words_path);
        wordsData      = await response.json();
        console.log(`Loaded ${Object.keys(wordsData).length} words from database`);
    } catch (error) {
        console.error('Failed to load words data:', error);
        throw error;
    }
}

/**
 * Loads layout data from the JSON file
 * @returns {Promise<Object>} Layout data indexed by page number
 */
async function loadLayoutData() {
    if (layoutData) return layoutData;

    try {
        const response = await fetch(layout_path);
        layoutData     = await response.json();
        console.log(`Loaded layout data for ${Object.keys(layoutData).length} pages`);
    } catch (error) {
        console.error('Failed to load layout data:', error);
        throw error;
    }
}

/**
 * Loads verses data from the JSON file
 * @returns {Promise<Object>} Verses data indexed by surah:ayah key
 */
async function loadVersesData() {
    if (versesData) return versesData;

    try {
        const response = await fetch(verses_path);
        versesData     = await response.json();
        console.log(`Loaded ${Object.keys(versesData).length} verses from uthmani.json`);
        return versesData;
    } catch (error) {
        console.error('Failed to load verses data:', error);
        throw error;
    }
}

/**
 * Loads translation data from the JSON file
 * @returns {Promise<Object>} Translation data indexed by verse reference (surah:ayah)
 */
async function loadTranslationData() {
    if (translationData) return translationData;
    try {
        const response = await fetch(translation_path);
        translationData = await response.json();
        console.log(`Loaded ${Object.keys(translationData).length} translations from si-simple.json`);
        return translationData;
    } catch (error) {
        console.error('Failed to load translation data:', error);
        throw error;
    }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Gets surah name by number
 * @param {number} surahNumber - Surah number (1-114)
 * @returns {string} Surah name or empty string if invalid
 */
function getSurahName(surahNumber) {
    return SURAH_NAMES[surahNumber] || '';
}

/**
 * Gets words text by ID range, wrapped in individual spans for hover effects
 * @param {number} firstWordId - Starting word ID
 * @param {number} lastWordId - Ending word ID
 * @returns {string} HTML string with words wrapped in spans
 */
function getWords(firstWordId, lastWordId) {
    if (!wordsData) {
        console.error('Words data not loaded');
        return '';
    }

    const words = [];
    for (let id = firstWordId; id <= lastWordId; id++) {
        if (wordsData[id]) {
            const word = wordsData[id];
            words.push(`<span class="word" data-word-id="${id}" data-surah="${word.surah}" data-ayah="${word.ayah}">${word.text} </span>`);
        }
    }
    return words.join('');
}

/**
 * Gets page layout data with caching
 * @param {number} pageNumber - Page number (1-604)
 * @returns {Array} Array of line objects for the page
 */
function getPageLayout(pageNumber) {
    if (!layoutData) {
        console.error(`Layout data not loaded`);
        return [];
    }

    return layoutData[pageNumber] || [];
}

// ============================================================================
// Data Access Functions
// ============================================================================

function getVersesData() { return versesData; }
function getTranslationData() { return translationData; }
function getWordsData() { return wordsData; }
function getLayoutData() { return layoutData; }

export {
    // State management
    RenderingState,
    
    // Data loading
    loadWordsData,
    loadLayoutData,
    loadVersesData,
    loadTranslationData,
    
    // Utility functions
    getSurahName,
    getWords,
    getPageLayout,
    
    // Data access
    getVersesData,
    getTranslationData,
    getWordsData,
    getLayoutData
};