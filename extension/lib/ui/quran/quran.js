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

    goToPrediction(pred) {
        if (pred.status == 'matched') {
            const surahNumber = parseInt(pred.surah);
            const ayahNumber = parseInt(pred.ayah);

            this.log(`✔ Found verse: ${surahNumber}:${ayahNumber}`);
            const currentState = QuranState.getStateClone();
            const mode = currentState.mode;
            console.log("Displaying prediction in mode: ", mode);

            // Check if we need to render new content or just update target verse
            const needsNewRender = !currentState.mode ||
                                  currentState.mode !== mode ||
                                  (mode === 'surah' && currentState.surah !== surahNumber) ||
                                  (mode === 'context') || // Always re-render for context mode
                  (mode === 'mushaf'); // Always re-render for mushaf to find correct page // TODO:

            if (needsNewRender) {
                try {
                    switch (mode) {
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
        } else {
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
    renderMushafPage(pageNumber, options = {}) {
        const html = generateMushafPageHTML(pageNumber, options);
        this.quranContainer.innerHTML = html;
        scrollToTargetVerse();
        QuranState.setMushafState(pageNumber);
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
        const html = generateVerseWithContextHTML(surahNumber, verseNumber, contextBefore, contextAfter, options);
        this.quranContainer.innerHTML = html;
        scrollToTargetVerse();
        QuranState.setContextState(surahNumber, verseNumber, contextBefore, contextAfter);
    }

    /**
     * Renders an entire surah
     * @param {number} surahNumber - Surah number (1-114)
     * @param {number} targetVerse - Target verse to highlight (optional)
     * @param {Object} options - Rendering options
     * @param {string} targetElementId - ID of the container element (default: 'quran')
     */
    renderSurah(surahNumber, targetVerse = null, options = {}) {
        const html = generateSurahHTML(surahNumber, targetVerse, options);
        this.quranContainer.innerHTML = html;
        scrollToTargetVerse();
        QuranState.setSurahState(surahNumber, targetVerse);
    }

    reload() {
        const currentState = QuranState.getStateClone();
        const mode = currentState.mode;
        switch (mode) {
            case 'surah':
                this.modules.quranModule.renderSurah(currentState.surah, currentState.targetVerse);
                this.log(`Reloaded surah ${currentState.surah}`);
                break;
            case 'context':
                this.modules.quranModule.renderVerseWithContext(currentState.surah, currentState.targetVerse);
                this.log(`Reloaded verse ${currentState.surah}:${currentState.targetVerse} with context`);
                break;
            case 'mushaf':
                this.modules.quranModule.renderMushafPage(currentState.page);
                this.log(`Reloaded page ${currentState.page}`);
                break;
            default:
                this.log('Unsupported mode');
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
