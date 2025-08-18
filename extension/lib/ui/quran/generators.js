// ============================================================================
// HTML Generation and DOM Updates
// ============================================================================

import {
    getSurahName,
    getWords,
    getVerse,
    getPage,
    getTranslation,
} from './data.js';

// ============================================================================
// Mushaf Rendering
// ============================================================================

function generateMushafPageHTML(page, surah = null, ayah = null) {
    const pageData = getPage(page);
    if (!pageData.length) {
        return { html: `<div class="error">Page ${page} not found</div>`, setupInteractions: null };
    }

    let html = `<div class="quran-container mushaf-page-container" data-page="${page}">`;

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
                    const words = getWords(line.first_word_id, line.last_word_id);

                    for (const [wordId, word] of words.entries()) {
                        let cssClass = 'word';
                        if (surah && ayah && word.surah === surah && word.ayah === ayah) {
                            cssClass += ' target-verse'; //TODO: what class to give
                        }
                        lineElement += `<span class="${cssClass}" data-word-id="${wordId}" data-surah="${word.surah}" data-ayah="${word.ayah}">${word.text} </span>`;
                    }
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
    
    // Setup function for verse highlighting
    const setupInteractions = (quranContainer) => {
        const words = quranContainer.querySelectorAll('.word');
        words.forEach(word => {
            word.addEventListener('mouseenter', () => {
                const surah = word.dataset.surah;
                const ayah = word.dataset.ayah;

                // Highlight all words in the same verse
                const verseWords = quranContainer.querySelectorAll(`[data-surah="${surah}"][data-ayah="${ayah}"]`);
                verseWords.forEach(verseWord => {
                    verseWord.classList.add('verse-highlighted');
                });
            });
            word.addEventListener('mouseleave', () => {
                const highlightedWords = quranContainer.querySelectorAll('.verse-highlighted');
                highlightedWords.forEach(highlightedWord => {
                    highlightedWord.classList.remove('verse-highlighted');
                });
            });
        });
    };

    return { html, setupInteractions };
}


// ============================================================================
// Shared Verse Rendering
// ============================================================================

// returns { globalId: localId }
// example{ "226402": "1", "226403": "2" ...}
function generateFootnoteIdTable(html) {
const idMap = Object.fromEntries(
  [...html.matchAll(/<sup foot_note="(\d+)">([^<]+)<\/sup>/g)]
    .map(match => [match[1], match[2]])
);
    return idMap;
}

function generateFootnote(header, body) {
    return `<div class="footnote">
                <div class="footnote-header">
                    ${header}
                </div>
                <div class="footnote-body">
                    ${body}
                </div>
            </div>`;
}


function generateVerseHTML(verse, cssClass = 'verse', showFullReference = false) {
    const verseText = verse.text;
    const verseKey = `${verse.surah}:${verse.ayah}`;

    const translation = getTranslation(verseKey);
    let translationText = translation.text ? translation.text : '';
    const verseNumberText = showFullReference ? verseKey : `${verse.ayah}`;

    let html = `<div class="${cssClass}" data-surah="${verse.surah}" data-ayah="${verse.ayah}">
                    <div class="verse-metadata">
                        <div class="verse-number">${verseNumberText}</div>
                    </div>
                    <div class="verse-content">
                        <div class="arabic-text">${verseText}</div>
                        <div class="translation-text">${translationText}</div>`;

    if (translation.footnotes) {
        const footnotes = JSON.parse(translation.footnotes);
        const idMap = generateFootnoteIdTable(translationText);
        for (const footnoteId in footnotes) {
            const footnoteText = footnotes[footnoteId];
            const footnoteLocalId = idMap[footnoteId];
            html += generateFootnote(footnoteLocalId, footnoteText);
        }
    }

    html += `</div>
             </div>`;

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

    // Calculate range of verses to include
    const startVerse = Math.max(1, verseNumber - contextBefore);
    const endVerse = verseNumber + contextAfter;
    
    // Collect verses in the range
    let versesToRender = [];
    for (let ayah = startVerse; ayah <= endVerse; ayah++) {
        const verseKey = `${surahNumber}:${ayah}`;
        const verse = getVerse(verseKey);
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
        html += generateVerseHTML(verse, cssClass, true);
    });
    
    html += '</div>';
    
    return html;
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

    // Get all verses for this surah
    const surahVerses = [];
    let verseNumber = 1;
    while (true) {
        const verseKey = `${surahNumber}:${verseNumber}`;
        const verse = getVerse(verseKey);
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
        html += generateVerseHTML(verse, cssClass, false);
    });

    html += '</div>';
    
    return html;
}

export {
    // HTML generation functions
    generateMushafPageHTML,
    generateVerseWithContextHTML,
    generateSurahHTML,
};
