// ============================================================================
// Main Rendering Functions
// ============================================================================

import { 
    loadWordsData, 
    loadLayoutData, 
    loadVersesData, 
    loadTranslationData 
} from './quran-data.js';

import { 
    generateMushafPageHTML,
    generateVerseWithContextHTML,
    generateSurahHTML,
    updateMushafPageDOM,
    updateVerseContextDOM,
    updateSurahDOM
} from './quran-renderers.js';

import { 
    scrollToTargetVerse,
    setTargetVerse,
    scrollToVerse,
    findVerseElements,
    findTargetVerseElement,
    findCurrentTargetVerseElements
} from './quran-navigation.js';

/**
 * Initialize the Quran renderer
 * @returns {Promise<void>}
 */
async function initializeQuranRenderer() {
    try {
        console.log('Initializing Quran Renderer...');
        await Promise.all([
            loadWordsData(),
            loadLayoutData(),
            loadVersesData(),
            loadTranslationData()
        ]);
        console.log('Quran Renderer initialized successfully ✓');
    } catch (error) {
        console.error('Failed to initialize Quran Renderer:', error);
        throw error;
    }
}

/**
 * Renders a mushaf page directly to a DOM element
 * @param {number} pageNumber - Page number (1-604)
 * @param {Object} options - Rendering options
 * @param {string} targetElementId - ID of the container element (default: 'quran')
 */
async function renderMushafPage(pageNumber, options = {}, targetElementId = 'quran') {
    const html = await generateMushafPageHTML(pageNumber, options);
    updateMushafPageDOM(html, pageNumber, targetElementId);
}

/**
 * Renders a single verse with context (surrounding verses)
 * @param {number} surahNumber - Surah number (1-114)
 * @param {number} verseNumber - Verse number within surah (1-based)
 * @param {number} contextBefore - Number of verses before to include
 * @param {number} contextAfter - Number of verses after to include
 * @param {Object} options - Rendering options
 * @param {string} targetElementId - ID of the container element (default: 'quran')
 */
async function renderVerseWithContext(surahNumber, verseNumber, contextBefore = 4, contextAfter = 4, options = {}, targetElementId = 'quran') {
    const html = generateVerseWithContextHTML(surahNumber, verseNumber, contextBefore, contextAfter, options);
    updateVerseContextDOM(html, surahNumber, verseNumber, contextBefore, contextAfter, targetElementId);
    
    // Scroll to target verse
    scrollToTargetVerse();
}

/**
 * Renders an entire surah
 * @param {number} surahNumber - Surah number (1-114)
 * @param {number} targetVerse - Target verse to highlight (optional)
 * @param {Object} options - Rendering options
 * @param {string} targetElementId - ID of the container element (default: 'quran')
 */
async function renderSurah(surahNumber, targetVerse = null, options = {}, targetElementId = 'quran') {
    const html = generateSurahHTML(surahNumber, targetVerse, options);
    updateSurahDOM(html, surahNumber, targetVerse, targetElementId);
    
    // Scroll to target verse
    scrollToTargetVerse();
}

export {
    // Main rendering functions
    initializeQuranRenderer,
    renderMushafPage,
    renderVerseWithContext,
    renderSurah,

    // target verse functions
    setTargetVerse,

    // Scrolling utilities
    scrollToTargetVerse,
    scrollToVerse,
    
    // DOM query utilities
    findVerseElements,
    findTargetVerseElement,
    findCurrentTargetVerseElements,

    // HTML generation functions (for advanced usage)
    generateMushafPageHTML,
    generateVerseWithContextHTML,
    generateSurahHTML,

    // DOM update functions (for advanced usage)
    updateMushafPageDOM,
    updateVerseContextDOM,
    updateSurahDOM
};
