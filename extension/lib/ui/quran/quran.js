// ============================================================================
// QuranModule - Singleton for Quran Rendering and Navigation
// ============================================================================

import { 
    loadWordsData, 
    loadLayoutData, 
    loadVersesData, 
    loadTranslationData,
    initializeQuranData,
    findPageContainingVerse,
    getLayoutData
} from './data.js';

import { 
    generateMushafPageHTML,
    generateVerseWithContextHTML,
    generateSurahHTML,
    updateMushafPageDOM,
    updateVerseContextDOM,
    updateSurahDOM
} from './renderers.js';

import { 
    scrollToTargetVerse,
    setTargetVerse,
    getCurrentTargetVerse,
    getCurrentRenderingState,
    scrollToVerse,
    findVerseElements,
    findTargetVerseElement,
    findCurrentTargetVerseElements
} from './navigation.js';

export class QuranModule {
    constructor(dependencies) {
        this.log = dependencies.log;
        this.dependencies = dependencies;
    }

    async initialize() {
        await initializeQuranData();
    }

    goToPrediction(pred) {
        if (pred.status == 'matched') {
            const surahNumber = parseInt(pred.surah);
            const ayahNumber = parseInt(pred.ayah);

            this.log(`✔ Found verse: ${surahNumber}:${ayahNumber}`);
            const currentState = this.getCurrentRenderingState();
            const selectedMode = this.dependencies.getModules().uiModule.getSelectedMode(); // TODO: get this from our state instead

            // Check if we need to render new content or just update target verse
            const needsNewRender = !currentState.mode ||
                                  currentState.mode !== selectedMode ||
                                  (selectedMode === 'surah' && currentState.surah !== surahNumber) ||
                                  (selectedMode === 'context') || // Always re-render for context mode
                  (selectedMode === 'mushaf'); // Always re-render for mushaf to find correct page // TODO:

            if (needsNewRender) {
                try {
                    switch (selectedMode) {
                        case 'surah':
                            this.renderSurah(surahNumber, ayahNumber);
                            this.log(`📖 Loaded surah ${surahNumber} with verse ${ayahNumber} highlighted`);
                            break;
                        case 'context':
                            this.renderVerseWithContext(surahNumber, ayahNumber);
                            this.log(`📖 Loaded verse ${surahNumber}:${ayahNumber} with context`);
                            break;
                        case 'mushaf':
                            const pageNumber = this.findPageContainingVerse(surahNumber, ayahNumber);
                            if (pageNumber) {
                                this.renderMushafPage(pageNumber, {
                                    targetSurah: surahNumber,
                                    targetVerse: ayahNumber
                                });
                                this.log(`📖 Loaded page ${pageNumber} with verse ${surahNumber}:${ayahNumber} highlighted`);
                            } else {
                                this.log(`❌ Could not find page containing verse ${surahNumber}:${ayahNumber}`);
                                return;
                            }
                            break;
                    }
                } catch (error) {
                    this.log(`❌ Failed to load content: ${error.message}`);
                    return;
                }
            } else {
                // Just update target verse if we're in the same mode and context
                if (currentState.targetVerse !== ayahNumber) {
                    const success = this.setTargetVerse(ayahNumber);
                    if (success) {
                        this.log(`🎯 Switched to verse ${ayahNumber} in current view`);
                    } else {
                        this.log(`❌ Failed to switch to verse ${ayahNumber}`);
                    }
                } else {
                    this.scrollToTargetVerse();
                    this.log(`📍 Scrolled to current verse ${surahNumber}:${ayahNumber}`);
                }
            }
        }
        else {
            this.log("❌ No matching verse found.")
        }
    }

    /**
     * Renders a mushaf page directly to a DOM element
     * @param {number} pageNumber - Page number (1-604)
     * @param {Object} options - Rendering options
     * @param {number} options.targetSurah - Target surah for highlighting
     * @param {number} options.targetVerse - Target verse for highlighting
     * @param {string} targetElementId - ID of the container element (default: 'quran')
     */
    renderMushafPage(pageNumber, options = {}, targetElementId = 'quran') {
        const html = generateMushafPageHTML(pageNumber, options);
        updateMushafPageDOM(html, pageNumber, options.targetSurah, options.targetVerse, targetElementId);
        scrollToTargetVerse();
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
    renderVerseWithContext(surahNumber, verseNumber, contextBefore = 4, contextAfter = 4, options = {}, targetElementId = 'quran') {
        const html = generateVerseWithContextHTML(surahNumber, verseNumber, contextBefore, contextAfter, options);
        updateVerseContextDOM(html, surahNumber, verseNumber, contextBefore, contextAfter, targetElementId);
        scrollToTargetVerse();
    }

    /**
     * Renders an entire surah
     * @param {number} surahNumber - Surah number (1-114)
     * @param {number} targetVerse - Target verse to highlight (optional)
     * @param {Object} options - Rendering options
     * @param {string} targetElementId - ID of the container element (default: 'quran')
     */
    renderSurah(surahNumber, targetVerse = null, options = {}, targetElementId = 'quran') {
        const html = generateSurahHTML(surahNumber, targetVerse, options);
        updateSurahDOM(html, surahNumber, targetVerse, targetElementId);
        scrollToTargetVerse();
    }

    // ========================================================================
    // Target Verse Management
    // ========================================================================

    /**
     * Set the target verse for highlighting
     * @param {number} verseNumber - Verse number to target
     * @returns {boolean} - Success status
     */
    setTargetVerse(verseNumber) {
        return setTargetVerse(verseNumber);
    }

    /**
     * Get the current target verse
     * @returns {number|null} - Current target verse number
     */
    getCurrentTargetVerse() {
        return getCurrentTargetVerse();
    }

    /**
     * Get the current rendering state
     * @returns {Object} - Current state object
     */
    getCurrentRenderingState() {
        return getCurrentRenderingState();
    }

    // ========================================================================
    // Navigation and Scrolling
    // ========================================================================

    /**
     * Scroll to the current target verse
     */
    scrollToTargetVerse() {
        return scrollToTargetVerse();
    }

    /**
     * Scroll to a specific verse
     * @param {number} surahNumber - Surah number
     * @param {number} verseNumber - Verse number
     */
    scrollToVerse(surahNumber, verseNumber) {
        return scrollToVerse(surahNumber, verseNumber);
    }

    // ========================================================================
    // DOM Utilities
    // ========================================================================

    /**
     * Find verse elements in the DOM
     * @param {number} surahNumber - Surah number
     * @param {number} verseNumber - Verse number
     * @returns {NodeList} - Found verse elements
     */
    findVerseElements(surahNumber, verseNumber) {
        return findVerseElements(surahNumber, verseNumber);
    }

    /**
     * Find the current target verse element
     * @returns {Element|null} - Target verse element
     */
    findTargetVerseElement() {
        return findTargetVerseElement();
    }

    /**
     * Find all current target verse elements
     * @returns {NodeList} - Target verse elements
     */
    findCurrentTargetVerseElements() {
        return findCurrentTargetVerseElements();
    }

    // ========================================================================
    // Advanced/Internal Methods (for power users)
    // ========================================================================

    /**
     * Generate HTML for mushaf page (advanced usage)
     * @param {number} pageNumber - Page number
     * @param {Object} options - Options
     * @returns {Promise<string>} - Generated HTML
     */
    generateMushafPageHTML(pageNumber, options = {}) {
        return generateMushafPageHTML(pageNumber, options);
    }

    /**
     * Generate HTML for verse with context (advanced usage)
     * @param {number} surahNumber - Surah number
     * @param {number} verseNumber - Verse number
     * @param {number} contextBefore - Context before
     * @param {number} contextAfter - Context after
     * @param {Object} options - Options
     * @returns {string} - Generated HTML
     */
    generateVerseWithContextHTML(surahNumber, verseNumber, contextBefore = 4, contextAfter = 4, options = {}) {
        return generateVerseWithContextHTML(surahNumber, verseNumber, contextBefore, contextAfter, options);
    }

    /**
     * Generate HTML for surah (advanced usage)
     * @param {number} surahNumber - Surah number
     * @param {number} targetVerse - Target verse
     * @param {Object} options - Options
     * @returns {string} - Generated HTML
     */
    generateSurahHTML(surahNumber, targetVerse = null, options = {}) {
        return generateSurahHTML(surahNumber, targetVerse, options);
    }

    /**
     * Update DOM with mushaf page (advanced usage)
     * @param {string} html - HTML content
     * @param {number} pageNumber - Page number
     * @param {number} targetSurah - Target surah
     * @param {number} targetVerse - Target verse
     * @param {string} targetElementId - Target element ID
     */
    updateMushafPageDOM(html, pageNumber, targetSurah, targetVerse, targetElementId = 'quran') {
        return updateMushafPageDOM(html, pageNumber, targetSurah, targetVerse, targetElementId);
    }

    /**
     * Update DOM with verse context (advanced usage)
     * @param {string} html - HTML content
     * @param {number} surahNumber - Surah number
     * @param {number} verseNumber - Verse number
     * @param {number} contextBefore - Context before
     * @param {number} contextAfter - Context after
     * @param {string} targetElementId - Target element ID
     */
    updateVerseContextDOM(html, surahNumber, verseNumber, contextBefore, contextAfter, targetElementId = 'quran') {
        return updateVerseContextDOM(html, surahNumber, verseNumber, contextBefore, contextAfter, targetElementId);
    }

    /**
     * Update DOM with surah (advanced usage)
     * @param {string} html - HTML content
     * @param {number} surahNumber - Surah number
     * @param {number} targetVerse - Target verse
     * @param {string} targetElementId - Target element ID
     */
    updateSurahDOM(html, surahNumber, targetVerse, targetElementId = 'quran') {
        return updateSurahDOM(html, surahNumber, targetVerse, targetElementId);
    }

    // ========================================================================
    // Utility Methods
    // ========================================================================

    /**
     * Find which page contains a specific verse
     * @param {number} surahNumber - Surah number
     * @param {number} verseNumber - Verse number
     * @returns {number|null} - Page number containing the verse
     */
    findPageContainingVerse(surahNumber, verseNumber) {
        return findPageContainingVerse(surahNumber, verseNumber);
    }
}

