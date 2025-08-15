// ============================================================================
// QuranModule
// ============================================================================

import { QuranState } from './state.js'

import {
    initializeQuranData,
    findPageContainingVerse,
} from './data.js';

import {
    generateMushafPageHTML,
    generateVerseWithContextHTML,
    generateSurahHTML,
} from './generators.js';

import { 
    scrollToTargetVerse,
    scrollToVerse,

    setTargetVerse,
} from './navigation.js';

export class QuranModule {
    constructor(dependencies) {
        this.log = dependencies.log;
        this.quranContainer = dependencies.elements.quranContainer;
        QuranState.setQuranContainer(this.quranContainer);
    }

    async initialize() {
        await initializeQuranData();
    }

    goTo(surahNumber, ayahNumber) {
        const currentState = QuranState.getStateClone();
        const mode = currentState.mode;

        // Check if we need to render new content or just update target verse
        const needsNewRender = !currentState.mode ||
              currentState.mode !== mode ||
              (mode === 'surah' && currentState.surah !== surahNumber) ||
              (mode === 'context') || // Always re-render for context mode
              (mode === 'mushaf'); // Always re-render for mushaf to find correct page // TODO:

        if (needsNewRender) {
            switch (mode) {
            case 'surah':
                this.renderSurah(surahNumber, ayahNumber);
                break;
            case 'context':
                this.renderVerseWithContext(surahNumber, ayahNumber);
                break;
            case 'mushaf':
                const pageNumber = this.findPageContainingVerse(surahNumber, ayahNumber);
                if (pageNumber) {
                    this.renderMushafPage(pageNumber, {
                        targetSurah: surahNumber,
                        targetVerse: ayahNumber
                    });
                } else {
                    this.log(`[X] Could not find page containing verse ${surahNumber}:${ayahNumber}`);
                    console.error('findPageContainingVerse() failed');
                    return;
                }
                break;
            }
        } else {
            // Just update target verse if we're in the same mode and context
            if (currentState.targetVerse !== ayahNumber) {
                const success = this.setTargetVerse(ayahNumber);
                if (success) {
                    this.log(`Move to ayah ${ayahNumber}`);
                } else {
                    this.log(`[X] Failed to switch to verse ${ayahNumber}`);
                    console.error('setTargetVerse() failed')
                }
            } else {
                this.scrollToTargetVerse();
                this.log(`Same verse, ${surahNumber}:${ayahNumber}`);
            }
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
    renderMushafPage(pageNumber, options = {}) {
        this.log(`Loading page ${pageNumber}...`);
        try {
            const html = generateMushafPageHTML(pageNumber, options);
            this.quranContainer.innerHTML = html;
            scrollToTargetVerse();
            QuranState.setMushafState(pageNumber);
            this.log(`Loaded  page ${pageNumber}`);
        } catch (error) {
            this.log(`[X] Failed to load page ${pageNumber}: `);
            console.error(error);
        }
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
    renderVerseWithContext(surahNumber, verseNumber, contextBefore = 4, contextAfter = 4, options) {
        const locText = `${surahNumber}:${verseNumber}`
        this.log(`Loading ${locText}...`);
        try {
            const html = generateVerseWithContextHTML(surahNumber, verseNumber, contextBefore, contextAfter, options);
            this.quranContainer.innerHTML = html;
            scrollToTargetVerse();
            QuranState.setContextState(surahNumber, verseNumber, contextBefore, contextAfter);
            this.log(`Loaded  ${locText}`);
        } catch (error) {
            this.log(`[X] Failed to load verse ${surahNumber}:${verseNumber}`);
            console.error(error);
        }
    }

    /**
     * Renders an entire surah
     * @param {number} surahNumber - Surah number (1-114)
     * @param {number} targetVerse - Target verse to highlight (optional)
     * @param {Object} options - Rendering options
     * @param {string} targetElementId - ID of the container element (default: 'quran')
     */
    renderSurah(surahNumber, verseNumber = null, options = {}) {
        const locText = `${surahNumber}:${verseNumber ? verseNumber : '1'}`;
        this.log(`Loading ${locText}...`);
        try {
            const html = generateSurahHTML(surahNumber, verseNumber, options);
            this.quranContainer.innerHTML = html;
            scrollToTargetVerse();
            QuranState.setSurahState(surahNumber, verseNumber);
            this.log(`Loaded  ${locText}`);
        } catch (error) {
            this.log(`[X] Failed to load ${locText}`);
            console.error(error);
        }
    }

    reload() {
        const currentState = QuranState.getStateClone();
        const mode = currentState.mode;
        switch (mode) {
            case 'surah':
                this.modules.quranModule.renderSurah(currentState.surah, currentState.targetVerse);
                break;
            case 'context':
                this.modules.quranModule.renderVerseWithContext(currentState.surah, currentState.targetVerse);
                break;
            case 'mushaf':
                this.modules.quranModule.renderMushafPage(currentState.page);
                break;
            default:
                console.error('Unsupported mode');
        }
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
