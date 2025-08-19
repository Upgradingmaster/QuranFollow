// ============================================================================
// HTML Generation and DOM Updates
// ============================================================================

import {
    getSurahName,
    getWords,
    getAyah,
    getPage,
    getTranslation,
} from './data.js';

// ============================================================================
// Mushaf Rendering
// ============================================================================

function generateMushafModeHTML(page, surah = null, ayah = null, opts = {}) {
    const pageData = getPage(page);
    if (!pageData.length) {
        return { html: `<div class="error">Page ${page} not found</div>`, setupInteractions: null };
    }

    let html = `<div class="quran-container mushaf-page-container" data-page="${page}">`;

    pageData.forEach(line => {
        let lineElement = '<div class="arabic-text line';
        lineElement += ` type-${line.line_type}`;
        if (line.is_centered) { lineElement += ' centered'; }
        lineElement += '">';

        // Render content based on line type
        switch (line.line_type) {
            case 'surah_name':
                lineElement += `سورۃ ${getSurahName(line.surah_number)}`;
                break;

            case 'basmallah':
                lineElement += '﷽';
                break;

            case 'ayah':
                if (line.first_word_id && line.last_word_id) {
                    const words = getWords(line.first_word_id, line.last_word_id);

                    for (const [wordId, word] of words.entries()) {
                        const highlight = opts.highlightCurrentAyah && surah && ayah && word.surah === surah && word.ayah === ayah

                        const cssClass = highlight ? 'word focused-ayah' : 'word';
                        lineElement += `<span class="${cssClass}" data-word-id="${wordId}" data-surah="${word.surah}" data-ayah="${word.ayah}">${word.text} </span>`;
                    }
                }
                break;

            default:
                lineElement += '';
        }

        lineElement += '</div>';
        html += lineElement;
    });

    html += '</div>';
    
    // Setup function for ayah highlighting
    const setupInteractions = (quranContainer) => {
        const words = quranContainer.querySelectorAll('.word');
        words.forEach(word => {
            word.addEventListener('mouseenter', () => {
                const surah = word.dataset.surah;
                const ayah = word.dataset.ayah;

                // Highlight all words in the same ayah
                const ayahWords = quranContainer.querySelectorAll(`[data-surah="${surah}"][data-ayah="${ayah}"]`);
                ayahWords.forEach(ayahWord => {
                    ayahWord.classList.add('mushaf-ayah-highlighted');
                });
            });
            word.addEventListener('mouseleave', () => {
                const highlightedWords = quranContainer.querySelectorAll('.mushaf-ayah-highlighted');
                highlightedWords.forEach(highlightedWord => {
                    highlightedWord.classList.remove('mushaf-ayah-highlighted');
                });
            });
        });
    };

    return { html, setupInteractions };
}


// ============================================================================
// Context Rendering
// ============================================================================

function generateContextModeHTML(surahNumber, ayahNumber, opts = {}) {
    const startAyah = Math.max(1, ayahNumber - opts.contextBefore);
    const endAyah = ayahNumber + opts.contextAfter;

    let ayahs = [];
    for (let ayahIdx = startAyah; ayahIdx <= endAyah; ayahIdx++) {
        const ayahKey = `${surahNumber}:${ayahIdx}`;
        const ayah = getAyah(ayahKey);
        if (ayah) {
            ayahs.push(ayah);
        }
    }

    let html = '<div class="quran-container ayah-context-container">';

    const shouldIncludeSurahName = startAyah === 1;
    const shouldIncludeBismillah = startAyah === 1 && surahNumber !== 1 && surahNumber !== 9; // TODO: basmallah not Al-Fatiha or At-Tawbah?

    if (shouldIncludeSurahName) {
        html += '<div class="surah-header">';
        html += `<div class="surah-name">سورۃ ${getSurahName(surahNumber)}</div>`;
        html += `<div class="surah-number">Surah ${surahNumber}</div>`;
        html += '</div>';
    }

    if (shouldIncludeBismillah) {
        html += '<div class="ayah bismillah">';
        html += '<div class="arabic-text">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>';
        html += '</div>';
    }
    
    // Render each ayah
    ayahs.forEach(ayah => {
        const highlight = opts.highlightCurrentAyah && ayah.ayah === ayahNumber;
        const cssClass = highlight ? 'ayah focused-ayah' : 'ayah';
        html += generateAyahHTML(ayah, cssClass, true);
    });
    
    html += '</div>';
    
    return html;
}

// ============================================================================
// Surah Rendering
// ============================================================================

function generateSurahModeHTML(surahNumber, ayahNumber = null, opts = {}) {
    // Get all ayahs for this surah
    const surahAyahs = [];
    let ayahIndex = 1;
    while (true) {
        const ayahKey = `${surahNumber}:${ayahIndex}`;
        const ayah = getAyah(ayahKey);
        if (!ayah) break;
        surahAyahs.push(ayah);
        ayahIndex++;
    }

    if (surahAyahs.length === 0) {
        return `<div class="error">No ayahs found for surah ${surahNumber}</div>`;
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
        html += '<div class="ayah bismillah">';
        html += '<div class="ayah-content">';
        html += '<div class="arabic-text">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</div>';
        html += '</div>';
        html += '</div>';
    }

    // Render each ayah
    surahAyahs.forEach(ayah => {
        const highlight = opts.highlightCurrentAyah && ayah.ayah === ayahNumber;
        const cssClass = highlight ? 'ayah focused-ayah' : 'ayah';
        html += generateAyahHTML(ayah, cssClass, false);
    });

    html += '</div>';
    
    return html;
}

// ============================================================================
// Single Ayah Rendering
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


function generateAyahHTML(ayah, cssClass = 'ayah', showFullReference = false) {
    const ayahText = ayah.text;
    const ayahSurah = ayah.surah;
    const ayahAyah = ayah.ayah;
    const ayahKey = `${ayahSurah}:${ayahAyah}`;

    const translation = getTranslation(ayahKey);
    let translationText = translation.text ? translation.text : '';
    const ayahNumberText = showFullReference ? ayahKey : `${ayahAyah}`;

    let html = `<div class="${cssClass}" data-surah="${ayahSurah}" data-ayah="${ayahAyah}">
                    <div class="ayah-metadata">
                        <div class="ayah-number">${ayahNumberText}</div>
                    </div>
                    <div class="ayah-content">
                        <div class="arabic-text">${ayahText}</div>
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



export {
    generateMushafModeHTML,
    generateContextModeHTML,
    generateSurahModeHTML,
};
