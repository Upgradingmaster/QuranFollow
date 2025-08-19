// ============================================================================
// QuranModule
// ============================================================================

import { QuranState } from './state.js'

import {
    initializeQuranData,
    getPageFromKey,
    getKeyFromPage,

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
        this.defaultGoToOpts = {
            "highlightCurrentVerse" : true,
            "contextBefore"         : 4,
            "contextAfter"          : 4 };
        QuranState.initialize(this.quranContainer);
    }

    async initialize() {
        await initializeQuranData();
    }

    isValidMode(mode) {
        const validModes = ['mushaf', 'context', 'surah'];
        return mode && mode != '' && validModes.includes(mode);
    }

    getMode() {
        return QuranState.getStateClone().mode;
    }


    goTo(surah, ayah, mode = null, page = null, opts = this.defaultGoToOpts) {
        // Ensure all params exist

        // Surah
        if (!surah) {
            if (page) { surah = getKeyFromPage(page).surah }
            else      { surah = QuranState.getSurah()      }
        }
        if (surah < 1 || surah > 114) {
            this.log(`[X] Invalid surah number: ${surah}. Please enter 1-114.`);
            return;
        }

        // Ayah
        if (!ayah) {
            if (page) { ayah = getKeyFromPage(page).ayah }
            else      { ayah = QuranState.getAyah()      }
        }
        if (ayah < 1) { // TODO use validation.js and there we need to validate this better
            this.log(`[X] Invalid verse number: ${ayah}. Please enter a positive number.`);
            return;
        }

        // Mode
        if (!mode) {
            mode = QuranState.getMode();
        }

        // Page
        if (!page) {
            page = getPageFromKey(surah, ayah);
        }
        if (page < 1 || page > 604) {
            this.log(`[X] Invalid page number: ${page}. Please enter 1-604.`);
            return;
        }

        const currentMode  = QuranState.getMode();
        const currentSurah = QuranState.getSurah();

        const needsNewRender = !currentMode || currentMode != mode ||
              (mode === 'surah' && currentSurah !== surah) ||
              (mode === 'context') || // Always re-render for context mode
              (mode === 'mushaf');    // TODO: Always re-rendering for mushaf to find correct page


        if (needsNewRender) {
            switch (mode) {
                case 'mushaf':
                this.renderMushafPage(surah, ayah, page, opts);
                break;
            case 'context':
                this.renderVerseWithContext(surah, ayah, page, opts);
                break;
            case 'surah':
                this.renderSurah(surah, ayah, page, opts);
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

    renderMushafPage(surah, ayah, page, opts = {}) {
        this.log(`Loading page ${page}...`);
        try {
            const { html, setupInteractions } = generateMushafPageHTML(page, surah, ayah, opts);
            this.quranContainer.innerHTML = html;
            if (setupInteractions) { setupInteractions(this.quranContainer); }
            QuranState.setState('mushaf', surah, ayah, page);
            this.log(`Loaded  page ${page}`);
            if (opts.highlightCurrentVerse) { scrollToTargetVerse(); }
        } catch (error) {
            this.log(`[X] failed to load page ${page}: `);
            console.error(error);
        }
    }

    renderVerseWithContext(surah, ayah, page, opts = {}) {
        const locText = `${surah}:${ayah}`
        this.log(`Loading ${locText}...`);
        try {
            const html = generateVerseWithContextHTML(surah, ayah, opts);
            this.quranContainer.innerHTML = html;
            QuranState.setState('context', surah, ayah, page, opts);
            this.log(`Loaded  ${locText}`);
            if (opts.highlightCurrentVerse) { scrollToTargetVerse(); }
        } catch (error) {
            this.log(`[X] Failed to load verse ${surah}:${ayah}`);
            console.error(error);
        }
    }

    renderSurah(surah, ayah, page, opts = {}) {
        const locText = `${surah}:${ayah ? ayah : '1'}`;
        this.log(`Loading ${locText}...`);
        try {
            const html = generateSurahHTML(surah, ayah, opts);
            this.quranContainer.innerHTML = html;
            QuranState.setState('surah', surah, ayah, page);
            this.log(`Loaded  ${locText}`);
            if (opts.highlightCurrentVerse) { scrollToTargetVerse(); }

        } catch (error) {
            this.log(`[X] Failed to load ${locText}`);
            console.error(error);
        }
    }

    // TODO: use goTo instead
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

    scrollToVerse(surahNumber, verseNumber) {
        return scrollToVerse(surahNumber, verseNumber);
    }

    getDefaultGoToOpts() {
        return structuredClone(this.defaultGoToOpts);
    }
}
