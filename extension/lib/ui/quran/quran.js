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
    generateMushafModeHTML,
    generateContextModeHTML,
    generateSurahModeHTML,
} from './generators.js';

import { 
    scrollToFocusedAyah,
    setFocusedAyah,
} from './navigation.js';

import {
    isValidMode,
    isValidSurah,
    isValidAyah,
    isValidPage,
} from './validation.js'

export class QuranModule {
    constructor(dependencies) {
        this.log = dependencies.log;
        this.quranContainer = dependencies.elements.quranContainer;
        this.defaultGoToOpts = {
            "highlightCurrentAyah" : true,
            "contextBefore"         : 4,
            "contextAfter"          : 4 };
    }

    async initialize() {
        await initializeQuranData();
    }

    goTo(mode, surah, ayah, page, opts = this.defaultGoToOpts) {
        // Ensure all params exist

        // Mode
        if (!mode) {
            mode = QuranState.getMode();
        }
        if (!isValidMode(mode)) {
            this.log(`[X] Trying to use an invalid mode`);
            return;
        }

        // Surah
        if (!surah) {
            if (page) { surah = getKeyFromPage(page).surah }
            else      { surah = QuranState.getSurah()      }
        }
        if (!isValidSurah(surah)) {
            this.log(`[X] Invalid surah number: ${surah}. Please enter 1-114.`);
            return;
        }

        // Ayah
        if (!ayah) {
            if (page) { ayah = getKeyFromPage(page).ayah }
            else      { ayah = QuranState.getAyah()      }
        }
        if (!isValidAyah(ayah)) {
            this.log(`[X] Invalid ayah number: ${ayah}. Please enter a positive number.`);
            return;
        }

        // Page
        if (!page) {
            page = getPageFromKey(surah, ayah);
        }
        if (!isValidPage(page)) {
            this.log(`[X] Invalid page number: ${page}. Please enter 1-604.`);
            return;
        }

        const currentMode  = QuranState.getMode();
        const currentSurah = QuranState.getSurah();
        const currentAyah  = QuranState.getAyah();

        const needsNewRender = !currentMode || currentMode != mode ||
              (mode === 'surah' && currentSurah !== surah) ||
              (mode === 'context') || // Always re-render for context mode
              (mode === 'mushaf');    // TODO: Always re-rendering for mushaf


        if (needsNewRender) {
            switch (mode) {
                case 'mushaf':
                this.renderMushafMode(surah, ayah, page, opts);
                break;
            case 'context':
                this.renderContextMode(surah, ayah, page, opts);
                break;
            case 'surah':
                this.renderSurahMode(surah, ayah, page, opts);
                break;
            }
        } else {
            // Just update focused ayah if we're in the same mode and context
            if (currentAyah !== ayah) {
                const success = setFocusedAyah(this.quranContainer, ayah);
                if (success) {
                    this.log(`Move to ayah ${ayah}`);
                } else {
                    this.log(`[X] Failed to switch to ayah ${ayah}`);
                    console.error('setFocusedAyah() failed')
                }
            } else {
                scrollToFocusedAyah(this.quranContainer);
                this.log(`Same ayah, ${surah}:${ayah}`);
            }
        }

        return QuranState.getStateClone();
    }

    renderMushafMode(surah, ayah, page, opts = {}) {
        this.log(`Loading page ${page}...`);
        try {
            const { html, setupInteractions } = generateMushafModeHTML(page, surah, ayah, opts);
            this.quranContainer.innerHTML = html;
            if (setupInteractions) { setupInteractions(this.quranContainer); }
            QuranState.setState('mushaf', surah, ayah, page);
            this.log(`Loaded  page ${page}`);
            if (opts.highlightCurrentAyah) { scrollToFocusedAyah(this.quranContainer); }
        } catch (error) {
            this.log(`[X] failed to load page ${page}: `);
            console.error(error);
        }
    }

    renderContextMode(surah, ayah, page, opts = {}) {
        const locText = `${surah}:${ayah}`
        this.log(`Loading ${locText}...`);
        try {
            const html = generateContextModeHTML(surah, ayah, opts);
            this.quranContainer.innerHTML = html;
            QuranState.setState('context', surah, ayah, page, opts);
            this.log(`Loaded  ${locText}`);
            if (opts.highlightCurrentAyah) { scrollToFocusedAyah(this.quranContainer); }
        } catch (error) {
            this.log(`[X] Failed to load ayah ${surah}:${ayah}`);
            console.error(error);
        }
    }

    renderSurahMode(surah, ayah, page, opts = {}) {
        const locText = `${surah}:${ayah ? ayah : '1'}`;
        this.log(`Loading ${locText}...`);
        try {
            const html = generateSurahModeHTML(surah, ayah, opts);
            this.quranContainer.innerHTML = html;
            QuranState.setState('surah', surah, ayah, page);
            this.log(`Loaded  ${locText}`);
            if (opts.highlightCurrentAyah) { scrollToFocusedAyah(this.quranContainer); }

        } catch (error) {
            this.log(`[X] Failed to load ${locText}`);
            console.error(error);
        }
    }

    reload() {
        this.goTo(null, null, null, null);
    }

    getDefaultGoToOpts() {
        return { ...this.defaultGoToOpts };
    }

    /* State Getters */
    getMode() {
        return QuranState.getMode();
    }
    getSurah() {
        return QuranState.getSurah();
    }
    getAyah() {
        return QuranState.getAyah();
    }
    getPage() {
        return QuranState.getPage();
    }


    /* Validation */
    isValidMode(mode) {
        return isValidMode(mode);
    }
    isValidSurah(surah) {
        return isValidSurah(surah);
    }
    isValidAyah(ayah) {
        return isValidAyah(ayah);
    }
    isValidPage(page) {
        return isValidPage(page);
    }
}
