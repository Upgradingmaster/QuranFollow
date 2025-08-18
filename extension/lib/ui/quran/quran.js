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

    getMode() {
        return QuranState.getStateClone().mode;
    }

    goTo(surah, ayah, mode = null, page = null) {

        const currentState = QuranState.getStateClone();
        if (mode == null) { mode = currrentState.mode; }
        const currentMode = currentState.mode;

        // Check if we need to render new content or just update target verse
        const needsNewRender = !currentMode || currentMode != mode ||
              (mode === 'surah' && currentState.surah !== surah) ||
              (mode === 'context') || // Always re-render for context mode
              (mode === 'mushaf');    // TODO: Always re-rendering for mushaf to find correct page

        if (needsNewRender) {
            switch (mode) {
                case 'surah':
                    this.renderSurah(surah, ayah);
                    break;
                case 'context':
                    this.renderVerseWithContext(surah, ayah);
                    break;
                case 'mushaf':
                    this.renderMushafPage(page, surah, ayah);
                    break;
            }
        } else {
            // Just update target verse if we're in the same mode and context
            if (currentState.targetVerse !== ayah) {
                const success = this.setTargetVerse(ayah);
                if (success) {
                    this.log(`Move to ayah ${ayah}`);
                } else {
                    this.log(`[X] Failed to switch to verse ${ayah}`);
                    console.error('setTargetVerse() failed')
                }
            } else {
                this.scrollToTargetVerse();
                this.log(`Same verse, ${surah}:${ayah}`);
            }
        }
    }

    renderMushafPage(page, surah, ayah) {
        if (!page && !(surah && ayah)) {
            console.error(`[X] no combination of information to locate the page: got Page: ${page}, Surah: ${surah}, Ayah: ${ayah}`);
        }

        if (page && (page < 1 || page > 604)) {
            this.log(`[X] Invalid page number: ${page}. Please enter 1-604.`);
            return;
        }

        if (surah && (surah < 1 || surah > 114)) {
            this.log(`[X] Invalid surah number: ${surah}. Please enter 1-114.`);
            return;
        }

        if (ayah && ayah < 1) {
            this.log(`[X] Invalid verse number: ${ayah}. Please enter a positive number.`);
            return;
        }


        if (surah && ayah && !page) {
            page = findPageContainingVerse(surah, ayah);
        }

        this.log(`Loading page ${page}...`);
        try {
            const { html, setupInteractions } = generateMushafPageHTML(page, surah, ayah);
            this.quranContainer.innerHTML = html;
            if (setupInteractions) { setupInteractions(this.quranContainer); }
            scrollToTargetVerse();
            QuranState.setMushafState(page);
            this.log(`Loaded  page ${page}`);
        } catch (error) {
            this.log(`[X] failed to load page ${page}: `);
            console.error(error);
        }
    }

    renderVerseWithContext(surah, ayah, contextBefore = 4, contextAfter = 4, options = {}) {
        if (isNaN(surah) || surah < 1 || surah > 114) {
            this.log(`[X] Invalid surah number: ${surah}. Please enter 1-114.`);
            return;
        }

        if (isNaN(ayah) || ayah < 1) {
            this.log(`[X] Invalid verse number: ${ayah}. Please enter a positive number.`);
            return;
        }

        const locText = `${surah}:${ayah}`
        this.log(`Loading ${locText}...`);
        try {
            const html = generateVerseWithContextHTML(surah, ayah, contextBefore, contextAfter, options);
            this.quranContainer.innerHTML = html;
            scrollToTargetVerse();
            QuranState.setContextState(surah, ayah, contextBefore, contextAfter);
            this.log(`Loaded  ${locText}`);
        } catch (error) {
            this.log(`[X] Failed to load verse ${surah}:${ayah}`);
            console.error(error);
        }
    }

    renderSurah(surahNumber, verseNumber = null, options = {}) {
        if (isNaN(surahNumber) || surahNumber < 1 || surahNumber > 114) {
            this.log(`[X] Invalid surah number: ${surah}. Please enter 1-114.`);
            return;
        }

        if (verseNumber !== null && (isNaN(verseNumber) || verseNumber < 1)) {
            this.log(`[X] Invalid verse number: ${ayah}. Please enter a positive number.`);
            return;
        }

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
                this.modules.quranModule.renderSurah(currentState.surah, currentState.ayah);
                break;
            case 'context':
                this.modules.quranModule.renderVerseWithContext(currentState.surah, currentState.ayah);
                break;
            case 'mushaf':
            this.modules.quranModule.renderMushafPage(currentState.page, currentState.surah, currentState.ayah);
                break;
            default:
                console.error('Unsupported mode!');
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
    findPageContainingVerse(surah, verse) {
        return findPageContainingVerse(surah, verse);
    }

}
