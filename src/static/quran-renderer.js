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
function updateMushafPageDOM(html, targetElementId = 'quran') {
    const quranContainer = document.getElementById(targetElementId);
    if (quranContainer) {
        quranContainer.innerHTML = html;


        setupVerseHighlighting(quranContainer);
    }
}

/**
 * Renders a mushaf page directly to a DOM element
 * @param {number} pageNumber - Page number (1-604)
 * @param {Object} options - Rendering options
 * @param {string} targetElementId - ID of the container element (default: 'quran')
 */
async function renderMushafPage(pageNumber, options = {}, targetElementId = 'quran') {
    const html = await generateMushafPageHTML(pageNumber, options);
    updateMushafPageDOM(html, targetElementId);
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
    // Find the target verse
    const targetVerseKey = `${surahNumber}:${verseNumber}`;
    const targetVerse = versesData[targetVerseKey];
    
    if (!targetVerse) {
        return `<div class="error">Verse ${surahNumber}:${verseNumber} not found</div>`;
    }
    
    // Calculate range of verses to include
    const startVerse = Math.max(1, verseNumber - contextBefore);
    const endVerse = verseNumber + contextAfter;
    
    // Collect verses in the range
    let versesToRender = [];
    for (let ayah = startVerse; ayah <= endVerse; ayah++) {
        const verseKey = `${surahNumber}:${ayah}`;
        const verse = versesData[verseKey];
        if (verse) {
            versesToRender.push({
                ...verse,
                isTarget: ayah === verseNumber
            });
        }
    }
    

    // Generate HTML
    let html = '<div class="quran-container verse-context-container">';
    
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
        const cssClass = verse.isTarget ? 'verse target-verse' : 'verse context-verse';
        const verseKey = `${verse.surah}:${verse.ayah}`;
        const translationVerse = translationData ? translationData[verseKey] : null;
        
        html += `<div class="${cssClass}" data-surah="${verse.surah}" data-ayah="${verse.ayah}">`;
        html += `<div class="verse-metadata">`;
        html += `<div class="verse-number">${verse.surah}:${verse.ayah}</div>`;
        html += `</div>`;
        html += `<div class="verse-content">`;
        html += `<div class="arabic-text">${verse.text}</div>`;
        
        // Add translation if available
        if (translationVerse && translationVerse.text) {
            html += `<div class="translation-text">${translationVerse.text}</div>`;
        }
        
        html += `</div>`;
        html += '</div>';
    });
    
    html += '</div>';
    
    return html;
}

/**
 * Updates DOM with verse context HTML and handles scrolling
 * @param {string} html - HTML string to insert
 * @param {string} targetElementId - ID of the container element (default: 'quran')
 */
function updateVerseContextDOM(html, targetElementId = 'quran') {
    const quranContainer = document.getElementById(targetElementId);
    if (quranContainer) {
        quranContainer.innerHTML = html;
        
        // Scroll the target verse into view
        setTimeout(() => {
            const targetElement = quranContainer.querySelector('.target-verse');
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }, 100);
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
async function renderVerseWithContext(surahNumber, verseNumber, contextBefore = 4, contextAfter = 4, options = {}, targetElementId = 'quran') {
    const html = generateVerseWithContextHTML(surahNumber, verseNumber, contextBefore, contextAfter, options);
    updateVerseContextDOM(html, targetElementId);
}


// ============================================================================
// DATABASE AND GLOBAL DATA
// ============================================================================


const verses_path      = '/static/res/scripts/uthmani-aba.json'
const words_path       = '/static/res/scripts/uthmani-wbw.json'
const layout_path      = '/static/res/layouts/uthmani.json'
const translation_path = '/static/res/translations/si-simple.json'

// Global data stores
let wordsData = null;
let layoutData = null;
let surahNames = null;
let versesData = null;
let translationData = null;

// Surah names in Arabic
const SURAH_NAMES = {
    1: "الفاتحة", 2: "البقرة", 3: "آل عمران", 4: "النساء", 5: "المائدة", 6: "الأنعام", 7: "الأعراف", 8: "الأنفال", 9: "التوبة", 10: "يونس",
    11: "هود", 12: "يوسف", 13: "الرعد", 14: "إبراهيم", 15: "الحجر", 16: "النحل", 17: "الإسراء", 18: "الكهف", 19: "مريم", 20: "طه",
    21: "الأنبياء", 22: "الحج", 23: "المؤمنون", 24: "النور", 25: "الفرقان", 26: "الشعراء", 27: "النمل", 28: "القصص", 29: "العنكبوت", 30: "الروم",
    31: "لقمان", 32: "السجدة", 33: "الأحزاب", 34: "سبأ", 35: "فاطر", 36: "يس", 37: "الصافات", 38: "ص", 39: "الزمر", 40: "غافر",
    41: "فصلت", 42: "الشورى", 43: "الزخرف", 44: "الدخان", 45: "الجاثية", 46: "الأحقاف", 47: "محمد", 48: "الفتح", 49: "الحجرات", 50: "ق",
    51: "الذاريات", 52: "الطور", 53: "النجم", 54: "القمر", 55: "الرحمن", 56: "الواقعة", 57: "الحديد", 58: "المجادلة", 59: "الحشر", 60: "الممتحنة",
    61: "الصف", 62: "الجمعة", 63: "المنافقون", 64: "التغابن", 65: "الطلاق", 66: "التحريم", 67: "الملك", 68: "القلم", 69: "الحاقة", 70: "المعارج",
    71: "نوح", 72: "الجن", 73: "المزمل", 74: "المدثر", 75: "القيامة", 76: "الإنسان", 77: "المرسلات", 78: "النبأ", 79: "النازعات", 80: "عبس",
    81: "التكوير", 82: "الانفطار", 83: "المطففين", 84: "الانشقاق", 85: "البروج", 86: "الطارق", 87: "الأعلى", 88: "الغاشية", 89: "الفجر", 90: "البلد",
    91: "الشمس", 92: "الليل", 93: "الضحى", 94: "الشرح", 95: "التين", 96: "العلق", 97: "القدر", 98: "البينة", 99: "الزلزلة", 100: "العاديات",
    101: "القارعة", 102: "التكاثر", 103: "العصر", 104: "الهمزة", 105: "الفيل", 106: "قريش", 107: "الماعون", 108: "الكوثر", 109: "الكافرون", 110: "النصر",
    111: "المسد", 112: "الإخلاص", 113: "الفلق", 114: "الناس"
};

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the Quran renderer
 * @returns {Promise<void>}
 */
async function initializeQuranRenderer() {
    try {
        console.log('Initializing Quran Renderer...');
        await Promise.all([
            loadWordsData(),
            loadLayoutData(),
            loadVersesData(),
            loadTranslationData()
        ]);
        console.log('Quran Renderer initialized successfully ✓');
    } catch (error) {
        console.error('Failed to initialize Quran Renderer:', error);
        throw error;
    }
}


/**
 * Loads words data from the SQLite database
 * @returns {Promise<Object>} Words data indexed by ID
 */
async function loadWordsData() {
    if (wordsData) return wordsData;

    try {
        const response = await fetch(words_path);
        wordsData      = await response.json();
        console.log(`Loaded ${Object.keys(wordsData).length} words from database`);
    } catch (error) {
        console.error('Failed to load words data:', error);
        throw error;
    }
}

/**
 * Loads layout data from the JSON file
 * @returns {Promise<Object>} Layout data indexed by page number
 */
async function loadLayoutData() {
    if (layoutData) return layoutData;

    try {
        const response = await fetch(layout_path);
        layoutData     = await response.json();
        console.log(`Loaded layout data for ${Object.keys(layoutData).length} pages`);
    } catch (error) {
        console.error('Failed to load layout data:', error);
        throw error;
    }
}

/**
 * Loads verses data from the JSON file
 * @returns {Promise<Object>} Verses data indexed by surah:ayah key
 */
async function loadVersesData() {
    if (versesData) return versesData;

    try {
        const response = await fetch(verses_path);
        versesData     = await response.json();
        console.log(`Loaded ${Object.keys(versesData).length} verses from uthmani.json`);
        return versesData;
    } catch (error) {
        console.error('Failed to load verses data:', error);
        throw error;
    }
}

/**
 * Loads translation data from the JSON file
 * @returns {Promise<Object>} Translation data indexed by verse reference (surah:ayah)
 */
async function loadTranslationData() {
    if (translationData) return translationData;
    try {
        const response = await fetch(translation_path);
        translationData = await response.json();
        console.log(`Loaded ${Object.keys(translationData).length} translations from si-simple.json`);
        return translationData;
    } catch (error) {
        console.error('Failed to load translation data:', error);
        throw error;
    }
}

// ============================================================================
// UTIL
// ============================================================================

/**
 * Gets surah name by number
 * @param {number} surahNumber - Surah number (1-114)
 * @returns {string} Surah name or empty string if invalid
 */
function getSurahName(surahNumber) {
    return SURAH_NAMES[surahNumber] || '';
}

/**
 * Gets words text by ID range, wrapped in individual spans for hover effects
 * @param {number} firstWordId - Starting word ID
 * @param {number} lastWordId - Ending word ID
 * @returns {string} HTML string with words wrapped in spans
 */
function getWords(firstWordId, lastWordId) {
    if (!wordsData) {
        console.error('Words data not loaded');
        return '';
    }

    const words = [];
    for (let id = firstWordId; id <= lastWordId; id++) {
        if (wordsData[id]) {
            const word = wordsData[id];
            words.push(`<span class="word" data-word-id="${id}" data-surah="${word.surah}" data-ayah="${word.ayah}">${word.text} </span>`);
        }
    }
    return words.join('');
}

/**
 * Gets page layout data with caching
 * @param {number} pageNumber - Page number (1-604)
 * @returns {Array} Array of line objects for the page
 */
function getPageLayout(pageNumber) {
    if (!layoutData) {
        console.error(`Layout data not loaded`);
        return [];
    }

    return layoutData[pageNumber] || [];
}

export {
    // Main rendering functions
    initializeQuranRenderer,
    renderMushafPage,
    renderVerseWithContext,

    // HTML generation functions (for advanced usage)
    generateMushafPageHTML,
    generateVerseWithContextHTML,

    // DOM update functions (for advanced usage)
    updateMushafPageDOM,
    updateVerseContextDOM
}
