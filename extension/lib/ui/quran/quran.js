// ============================================================================
// QuranModule
// ============================================================================

import { QuranState } from './state.js'

import {
    initializeQuranData,
    getSurahLength,
    getSurahName,
} from './data.js';

import {
    getPageFromKey,
    getKeyFromPage,
    clampAyahToSurahBounds
} from './utils.js'

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
        if (mode === null) {
            mode = QuranState.getMode();
        }
        if (!isValidMode(mode)) {
            return {ok: false, error: `[X] Invalid mode: '${mode}'`};
        }

        // Surah
        if (surah === null) {
            if (page) { surah = getKeyFromPage(page).surah }
            else      { surah = QuranState.getSurah()      }
        }
        if (!isValidSurah(surah)) {
            return {ok: false, error: `[X] Invalid surah number: ${surah}.`};
        }

        // Ayah
        if (ayah === null) {
            if (page) { ayah = getKeyFromPage(page).ayah }
            else      { ayah = QuranState.getAyah()      }
        }
        if (!isValidAyah(ayah, surah)) {
            return {ok: false, error: `[X] Invalid key, ${surah}:${ayah}.`};
        }

        // Page
        if (page === null) {
            page = getPageFromKey(surah, ayah);
        }
        if (!isValidPage(page)) {
            return {ok: false, error:`[X] Invalid page number: ${page}.`};
        }

        const currentMode  = QuranState.getMode();
        const currentSurah = QuranState.getSurah();
        const currentAyah  = QuranState.getAyah();
        const currentPage = QuranState.getPage();

        const needsNewRender = currentMode != mode ||
              (mode === 'mushaf' && currentPage !== page) ||
              (mode === 'context') || // Always re-render for context mode
              (mode === 'surah' && currentSurah !== surah);

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
            if (currentAyah !== ayah) {
                try {
                    setFocusedAyah(this.quranContainer, surah, ayah);
                    this.log(`Move to ayah ${ayah}`);
                }
                catch(error) {
                    this.log(`[X] Failed to switch to ayah ${ayah}`, error);
                }
            } else { // same position
                scrollToFocusedAyah(this.quranContainer);
                this.log(`Same key, ${surah}:${ayah}`);
            }
        }

        return { ok: true, value: QuranState.getStateClone() };
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
            this.log(`[X] failed to load page ${page}: `, error);
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
            this.log(`[X] Failed to load ayah ${surah}:${ayah}`, error);
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
            this.log(`[X] Failed to load ${locText}`, error);
        }
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
    getState() {
        return QuranState.getStateClone();
    }


    /* Validation */
    isValidMode(mode) {
        return isValidMode(mode);
    }
    isValidSurah(surah) {
        return isValidSurah(surah);
    }
    isValidAyah(ayah, surah) {
        return isValidAyah(ayah, surah);
    }
    isValidPage(page) {
        return isValidPage(page);
    }

    /* Utils */
    getPageFromKey(surah, ayah) {
        return getPageFromKey(surah, ayah);
    }

    getKeyFromPage(page) {
        return getKeyFromPage(page);
    }

    getSurahLength(surah) {
        return getSurahLength(surah);
    }

    getSurahName(surah) {
        return getSurahName(surah);
    }
}
