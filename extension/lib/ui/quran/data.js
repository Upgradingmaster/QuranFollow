// ============================================================================
// Data
// ============================================================================

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


// Quran Data paths
const verses_path      = '../data/scripts/uthmani-aba.json'
const words_path       = '../data/scripts/uthmani-wbw.json'
const layout_path      = '../data/layouts/uthmani.json'
const translation_path = '../data/translations/si-footnotes-inline.json'

// Global Quran data stores
let wordsData = null;
let layoutData = null;
let surahNames = null;
let versesData = null;
let translationData = null;

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

async function initializeQuranData() {
        try {
            console.log('Initializing Quran Renderer...');
            await Promise.all([
                loadWordsData(),
                loadVersesData(),
                loadLayoutData(),
                loadTranslationData()
            ]);
            console.log('Quran Renderer initialized successfully ✓');
        } catch (error) {
            console.error('Failed to initialize Quran Renderer:', error);
            throw error;
        }
}

function getVersesData() { return versesData; }
function getWordsData() { return wordsData; }
function getLayoutData() { return layoutData; }
function getTranslationData() { return translationData; }


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

//TODO: this function should just return an array of words move the HTML generation to renderers.js
/**
 * Gets words text by ID range, wrapped in individual spans for hover effects
 * @param {number} firstWordId - Starting word ID
 * @param {number} lastWordId - Ending word ID
 * @param {number} targetSurah - Target surah for highlighting (optional)
 * @param {number} targetVerse - Target verse for highlighting (optional)
 * @returns {string} HTML string with words wrapped in spans
 */
function getWords(firstWordId, lastWordId, targetSurah = null, targetVerse = null) {
    if (!wordsData) {
        console.error('Words data not loaded');
        return '';
    }

    const words = [];
    for (let id = firstWordId; id <= lastWordId; id++) {
            const word = wordsData[id];
            let cssClass = 'word';
            
            // Add target-verse class if this word is a part of the target verse
            if (targetSurah && targetVerse && word.surah === targetSurah && word.ayah === targetVerse) {
                cssClass += ' target-verse';
            }
            
            words.push(`<span class="${cssClass}" data-word-id="${id}" data-surah="${word.surah}" data-ayah="${word.ayah}">${word.text} </span>`);
    }
    return words.join('');
}

function getVerse(verseKey) {
    if (!versesData) {
        return {};
    }

    return versesData[verseKey];
}

function getLayout(pageNumber) {
    if (!layoutData) {
        return [];
    }

    return layoutData[pageNumber] || [];
}

function getTranslation(verseKey) {
    if (!translationData) {
        return {};
    }

    return translationData[verseKey];
}

//TODO: can we avoid this, if not optimize
/**
 * Finds which page contains a specific verse
 * @param {number} surahNumber - Surah number (1-114)
 * @param {number} verseNumber - Verse number within surah
 * @returns {number|null} Page number containing the verse, or null if not found
 */
function findPageContainingVerse(surahNumber, verseNumber) {
    if (!layoutData || !wordsData) {
        console.error('Layout or words data not loaded');
        return null;
    }

    // Search through all pages
    for (let pageNumber = 1; pageNumber <= 604; pageNumber++) {
        const pageLayout = layoutData[pageNumber];
        if (!pageLayout) continue;

        // Check each line on the page
        for (const line of pageLayout) {
            if (line.line_type === 'ayah' && line.first_word_id && line.last_word_id) {
                // Check if any word in this line matches our target verse
                for (let wordId = line.first_word_id; wordId <= line.last_word_id; wordId++) {
                    const word = wordsData[wordId];
                    if (word && word.surah === surahNumber && word.ayah === verseNumber) {
                        return pageNumber;
                    }
                }
            }
        }
    }

    return null;
}

export {
    initializeQuranData,

    getVersesData,
    getWordsData,
    getLayoutData,
    getTranslationData,

    getSurahName,
    getWords,
    getVerse,
    getLayout,
    getTranslation,


    // Utility functions
    findPageContainingVerse,
};
