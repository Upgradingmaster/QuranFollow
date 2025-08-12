// ============================================================================
// HTML Generation and DOM Updates
// ============================================================================

import { RenderingState, getSurahName, getWords, getPageLayout, getVersesData, getTranslationData } from './quran-data.js';

// ============================================================================
// Mushaf Rendering
// ============================================================================

/**
 * Generates HTML for a Mushaf page
 * @param {number} pageNumber - Page number (1-604 for standard Mushaf)
 * @param {Object} options - Rendering options
 * @returns {string} HTML string of rendered page
 */
function generateMushafPageHTML(pageNumber, options = {}) {
    const pageData = getPageLayout(pageNumber);
    if (!pageData.length) {
        console.log(pageData);
        return `<div class="error">Page ${pageNumber} not found</div>`;
    }

    // Sort by line number to ensure correct order
    pageData.sort((a, b) => a.line_number - b.line_number);

    let html = `<div class="quran-container mushaf-page-container" data-page="${pageNumber}">`;

    pageData.forEach(line => {
        let lineElement = '<div class="arabic-text line';

        // Add line type class
        lineElement += ` ${line.line_type}`;

        if (line.is_centered) {
            lineElement += ' centered';
        }

        lineElement += '">';

        // Render content based on line type
        switch (line.line_type) {
            case 'surah_name':
                lineElement += `سورۃ ${getSurahName(line.surah_number)}`;
                break;

            case 'ayah':
                if (line.first_word_id && line.last_word_id) {
                    lineElement += getWords(line.first_word_id, line.last_word_id);
                }
                break;

            case 'basmallah':
                lineElement += '﷽';
                break;

            default:
                lineElement += '';
        }

        lineElement += '</div>';
        html += lineElement;
    });

    html += '</div>';
    return html;
}

/**
 * Updates DOM with Mushaf page HTML and sets up interactions
 * @param {string} html - HTML string to insert
 * @param {string} targetElementId - ID of the container element (default: 'quran')
 */
function updateMushafPageDOM(html, pageNumber, targetElementId = 'quran') {
    const quranContainer = document.getElementById(targetElementId);
    if (quranContainer) {
        quranContainer.innerHTML = html;
        
        // Update state
        RenderingState.setMushafState(pageNumber, quranContainer);

        setupVerseHighlighting(quranContainer);
    }
}

/**
 * Sets up verse-level highlighting for all words in the container
 * @param {Element} container - The container element with rendered Quran text
 */
function setupVerseHighlighting(container) {
    const words = container.querySelectorAll('.word');
    words.forEach(word => {
        word.addEventListener('mouseenter', () => {
            const surah = word.dataset.surah;
            const ayah = word.dataset.ayah;

            // Highlight all words in the same verse
            const verseWords = container.querySelectorAll(`[data-surah="${surah}"][data-ayah="${ayah}"]`);
            verseWords.forEach(verseWord => {
                verseWord.classList.add('verse-highlighted');
            });
        });
        word.addEventListener('mouseleave', () => {
            // Remove all verse highlighting instantly
            const highlightedWords = container.querySelectorAll('.verse-highlighted');
            highlightedWords.forEach(highlightedWord => {
                highlightedWord.classList.remove('verse-highlighted');
            });

        });
    });
}

// ============================================================================
// Shared Verse Rendering
// ============================================================================

/**
 * Renders a single verse HTML
 * @param {Object} verse - Verse object with surah, ayah, text properties
 * @param {string} cssClass - CSS class for the verse container
 * @param {boolean} showFullReference - Whether to show full surah:ayah reference (default: false, shows only ayah)
 * @returns {string} HTML string for the verse
 */
function renderVerseHTML(verse, cssClass = 'verse', showFullReference = false) {
    const verseKey = `${verse.surah}:${verse.ayah}`;
    const translationData = getTranslationData();
    const translationVerse = translationData ? translationData[verseKey] : null;
    const verseNumber = showFullReference ? `${verse.surah}:${verse.ayah}` : `${verse.ayah}`;
    
    let html = `<div class="${cssClass}" data-surah="${verse.surah}" data-ayah="${verse.ayah}">`;
    html += `<div class="verse-metadata">`;
    html += `<div class="verse-number">${verseNumber}</div>`;
    html += `</div>`;
    html += `<div class="verse-content">`;
    html += `<div class="arabic-text">${verse.text}</div>`;
    
    // Add translation if available
    if (translationVerse && translationVerse.text) {
        html += `<div class="translation-text">${translationVerse.text}</div>`;
    }
    
    html += `</div>`;
    html += '</div>';
    
    return html;
}

// ============================================================================
// Context Rendering
// ============================================================================

/**
 * Generates HTML for a single verse with context (surrounding verses)
 * @param {number} surahNumber - Surah number (1-114)
 * @param {number} verseNumber - Verse number within surah (1-based)
 * @param {number} contextBefore - Number of verses before to include
 * @param {number} contextAfter - Number of verses after to include
 * @param {Object} options - Rendering options
 * @returns {string} HTML string of verse with context
 */
function generateVerseWithContextHTML(surahNumber, verseNumber, contextBefore = 4, contextAfter = 4, options = {}) {
    const versesData = getVersesData();

    // Calculate range of verses to include
    const startVerse = Math.max(1, verseNumber - contextBefore);
    const endVerse = verseNumber + contextAfter;
    
    // Collect verses in the range
    let versesToRender = [];
    for (let ayah = startVerse; ayah <= endVerse; ayah++) {
        const verseKey = `${surahNumber}:${ayah}`;
        const verse = versesData[verseKey];
        if (verse) {
            versesToRender.push(verse);
        }
    }

    // Generate HTML
    let html = '<div class="quran-container verse-context-container">';

    // TODO: Add surah name if needed
    // Add Bismillah if needed
    const shouldIncludeBismillah = startVerse === 1 &&
          surahNumber !== 1 &&
          surahNumber !== 9; // If we're starting from verse 1, include Bismillah if not Al-Fatiha or At-Tawbah
    if (shouldIncludeBismillah) {
        html += '<div class="verse bismillah">';
        html += '<div class="arabic-text">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>';
        html += '</div>';
    }
    
    // Render each verse
    versesToRender.forEach(verse => {
        const isTarget = verse.ayah === verseNumber;
        const cssClass = isTarget ? 'verse target-verse' : 'verse';
        html += renderVerseHTML(verse, cssClass, true);
    });
    
    html += '</div>';
    
    return html;
}

/**
 * Updates DOM with verse context HTML and handles scrolling
 * @param {string} html - HTML string to insert
 * @param {number} surahNumber - Surah number for state tracking
 * @param {number} targetVerse - Target verse number for state tracking
 * @param {string} targetElementId - ID of the container element (default: 'quran')
 */
function updateVerseContextDOM(html, surahNumber, targetVerse, contextBefore, contextAfter, targetElementId = 'quran') {
    const quranContainer = document.getElementById(targetElementId);
    if (quranContainer) {
        quranContainer.innerHTML = html;
        
        // Update state
        RenderingState.setContextState(surahNumber, targetVerse, contextBefore, contextAfter, quranContainer);
    }
}

// ============================================================================
// Surah Rendering
// ============================================================================

/**
 * Generates HTML for an entire surah
 * @param {number} surahNumber - Surah number (1-114)
 * @param {number} targetVerse - Target verse to highlight (optional)
 * @param {Object} options - Rendering options
 * @returns {string} HTML string of rendered surah
 */
function generateSurahHTML(surahNumber, targetVerse = null, options = {}) {
    if (surahNumber < 1 || surahNumber > 114) {
        return `<div class="error">Invalid surah number: ${surahNumber}</div>`;
    }

    const versesData = getVersesData();

    // Get all verses for this surah
    const surahVerses = [];
    let verseNumber = 1;
    while (true) {
        const verseKey = `${surahNumber}:${verseNumber}`;
        const verse = versesData[verseKey];
        if (!verse) break;
        surahVerses.push(verse);
        verseNumber++;
    }

    if (surahVerses.length === 0) {
        return `<div class="error">No verses found for surah ${surahNumber}</div>`;
    }

    // Generate HTML
    let html = `<div class="quran-container surah-container" data-surah="${surahNumber}">`;
    
    // Add Surah header
    html += '<div class="surah-header">';
    html += `<div class="surah-name">سورۃ ${getSurahName(surahNumber)}</div>`;
    html += `<div class="surah-number">Surah ${surahNumber}</div>`;
    html += '</div>';
    
    // Add Bismillah if needed (not for Al-Fatiha or At-Tawbah)
    if (surahNumber !== 1 && surahNumber !== 9) {
        html += '<div class="verse bismillah">';
        html += '<div class="verse-content">';
        html += '<div class="arabic-text">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>';
        html += '</div>';
        html += '</div>';
    }
    
    // Render each verse
    surahVerses.forEach(verse => {
        const isTarget = targetVerse && verse.ayah === targetVerse;
        const cssClass = isTarget ? 'verse target-verse' : 'verse';
        html += renderVerseHTML(verse, cssClass, false);
    });
    
    html += '</div>';
    
    return html;
}

/**
 * Updates DOM with surah HTML and handles scrolling to target verse
 * @param {string} html - HTML string to insert
 * @param {number} surahNumber - Surah number for state tracking
 * @param {number} targetVerse - Target verse number for state tracking
 * @param {string} targetElementId - ID of the container element (default: 'quran')
 */
function updateSurahDOM(html, surahNumber, targetVerse, targetElementId = 'quran') {
    const quranContainer = document.getElementById(targetElementId);
    if (quranContainer) {
        quranContainer.innerHTML = html;
        
        // Update state
        RenderingState.setSurahState(surahNumber, targetVerse, quranContainer);
    }
}

export {
    // HTML generation functions
    generateMushafPageHTML,
    generateVerseWithContextHTML,
    generateSurahHTML,
    renderVerseHTML,

    // DOM update functions
    updateMushafPageDOM,
    updateVerseContextDOM,
    updateSurahDOM,
    
    // Utilities
    setupVerseHighlighting
};