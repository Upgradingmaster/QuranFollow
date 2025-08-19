import { QuranState } from './state.js'

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
const versesPath      = '../data/scripts/uthmani-aba.json'
const wordsPath       = '../data/scripts/uthmani-wbw.json'
const pagesPath       = '../data/pages/uthmani.json'
const translationPath = '../data/translations/si-footnotes.json'

// Global Quran data stores
let wordsData = null;
let pagesData = null;
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
        const response = await fetch(wordsPath);
        wordsData      = await response.json();
        console.log(`[Data] Loaded ${Object.keys(wordsData).length} words from ${wordsPath}`);
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
        const response = await fetch(versesPath);
        versesData     = await response.json();
        console.log(`[Data] Loaded ${Object.keys(versesData).length} verses from ${versesPath}`);
        return versesData;
    } catch (error) {
        console.error('Failed to load verses data:', error);
        throw error;
    }
}

/**
 * Loads pages data from the JSON file
 * @returns {Promise<Object>} Pages data indexed by page number
 */
async function loadPagesData() {
    if (pagesData) return pagesData;

    try {
        const response = await fetch(pagesPath);
        pagesData      = await response.json();
        console.log(`[Data] Loaded ${Object.keys(pagesPath).length} pages from ${pagesPath}`);
    } catch (error) {
        console.error('Failed to load pages data:', error);
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
        const response = await fetch(translationPath);
        translationData = await response.json();
        console.log(`[Data] Loaded ${Object.keys(translationData).length} translations from ${translationPath}`);
        return translationData;
    } catch (error) {
        console.error('Failed to load translation data:', error);
        throw error;
    }
}

async function initializeQuranData() {
        try {
            console.log('Loading Quran data...');
            await Promise.all([
                loadWordsData(),
                loadVersesData(),
                loadPagesData(),
                loadTranslationData()
            ]);
            console.log('Loaded Quran data successfully');
        } catch (error) {
            console.error('Failed to load Quran data:', error);
            throw error;
        }
}

function getVersesData() { return versesData; }
function getWordsData() { return wordsData; }
function getPagesData() { return pagesData; }
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

function getWords(firstWordId, lastWordId = null) {
    if (!wordsData) {
        return [];
    }
    if (!firstWordId) {
        return [];
    }

    if (!lastWordId) {
        return wordsData[firstWordId.toString()];
    }

    const words = [];
    for (let wordId = firstWordId; wordId <= lastWordId; wordId++) {
        const word = wordsData[wordId.toString()];
        if (word) {
            words.push(word);
        }
    }
    return words;
}

function getVerse(verseKey) {
    if (!versesData) {
        return {};
    }

    return versesData[verseKey];
}

function getPage(pageNumber) {
    if (!pagesData) {
        return [];
    }

    return pagesData[pageNumber] || [];
}

function getTranslation(verseKey, unescapeText = true) {
    if (!translationData) {
        return {};
    }

    let translation = { ...translationData[verseKey] }; // TODO: we can actually modify the data and then the next call we can try-catch the JSON.parse()

    if (unescapeText) {
        translation.text = JSON.parse(`${translation.text}`)
    }

    return translation;
}

// TODO: Move  the following fuctions to a seperate module
function getPageFromKey(surah, ayah) {
    // TODO: can we avoid this, if not optimize

    if (!pagesData || !wordsData) {
        console.error('Pages or words data not loaded');
        return null;
    }

    // Search through all pages
    for (let pageNumber = 1; pageNumber <= 604; pageNumber++) {
        const page = pagesData[pageNumber];
        if (!page) continue;

        // Check each line on the page
        for (const line of page) {
            if (line.line_type === 'ayah' && line.first_word_id && line.last_word_id) {
                // Check if any word in this line matches our target verse
                for (let wordId = line.first_word_id; wordId <= line.last_word_id; wordId++) {
                    const word = wordsData[wordId];
                    if (word && word.surah === surah && word.ayah === ayah) {
                        return pageNumber;
                    }
                }
            }
        }
    }

    console.error('getPageFromKey() failed');
    return null;
}

function getKeyFromPage(pageNumber) {
    const page = pagesData[pageNumber];
    let line = 0;
    while (page[line].line_type != 'ayah') {
        line++;
    }
    const firstAyah = page[line];
    const firstWord = getWords(firstAyah.first_word_id);

    const surah = firstWord.surah;
    const ayah  = firstWord.ayah;
    return { surah, ayah };
}



export {
    initializeQuranData,

    getSurahName,
    getWords,
    getVerse,
    getPage,
    getTranslation,


    // Utility functions
    getPageFromKey,
    getKeyFromPage,
};
