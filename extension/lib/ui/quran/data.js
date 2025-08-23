import { QuranState } from './state.js'


// Quran Data paths
const ayatPath      = '../data/scripts/uthmani-aba.json';
const wordsPath       = '../data/scripts/uthmani-wbw.json';
const pagesPath       = '../data/pages/uthmani.json';
const translationPath = '../data/translations/si-footnotes.json';

const surahMetadataPath = '../data/metadata/surah-metadata.json';

// Global Quran data stores
let wordsData = null;
let pagesData = null;
let ayatData = null;
let translationData = null;

let surahMetadata = null;

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

async function loadAyatData() {
    if (ayatData) return ayatData;

    try {
        const response = await fetch(ayatPath);
        ayatData       = await response.json();
        console.log(`[Data] Loaded ${Object.keys(ayatData).length} ayat from ${ayatPath}`);
        return ayatData;
    } catch (error) {
        console.error('Failed to load ayat data:', error);
        throw error;
    }
}

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

async function loadSurahMetadata() {
    if (surahMetadata) return surahMetadata;
    try {
        const response = await fetch(surahMetadataPath);
        surahMetadata = await response.json();
        console.log(`[Data] Loaded ${Object.keys(surahMetadata).length} translations from ${surahMetadataPath}`);
        return surahMetadata;
    } catch (error) {
        console.error('Failed to load surah metadata:', error);
        throw error;
    }
}

async function initializeQuranData() {
        try {
            console.log('Loading Quran data...');
            await Promise.all([
                loadWordsData(),
                loadAyatData(),
                loadPagesData(),
                loadTranslationData(),
                loadSurahMetadata()
            ]);
            console.log('Loaded Quran data successfully');
        } catch (error) {
            console.error('Failed to load Quran data:', error);
            throw error;
        }
}

// ============================================================================
// Utility Functions
// ============================================================================

function getSurahName(surahNumber) {
    return "surah" + String(surahNumber).padStart(3, "0");
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

function getAyah(ayah) {
    if (!ayatData) {
        return {};
    }

    return ayatData[ayah];
}

function getPage(pageNumber) {
    if (!pagesData) {
        return [];
    }

    return pagesData[pageNumber] || [];
}

function getTranslation(ayahKey, unescapeText = true) {
    if (!translationData) {
        return {};
    }

    let translation = { ...translationData[ayahKey] };

    if (unescapeText) {
        translation.text = JSON.parse(`${translation.text}`)
    }

    return translation;
}

function getSurahMetadata(surah) {
    return surahMetadata[surah].verses_count;
}

function getSurahLength(surah) {
    if (!surah) return 0;
    return surahMetadata[surah].verses_count;
}

export {
    initializeQuranData,

    getSurahName,
    getWords,
    getAyah,
    getPage,
    getTranslation,

    getSurahLength,
};
