/**
 * Renders verses by absolute verse numbers (0-6235, total 6236 verses)
 * @param {number} startVerse - Starting absolute verse number (0-based)
 * @param {number} endVerse - Ending absolute verse number (0-based, inclusive)
 * @param {Object} options - Rendering options (font, size, etc.)
 * @returns {Promise<string>} HTML string of rendered verses
 */
async function renderVersesByAbsoluteRange(startVerse, endVerse, options = {}) {
    // TODO: Implement absolute verse range rendering
    console.log(`Rendering verses ${startVerse}-${endVerse} (absolute)`);
}

/**
 * Renders verses by surah and relative verse numbers within that surah
 * @param {number} surahNumber - Surah number (1-114)
 * @param {number} startVerse - Starting verse number within surah (1-based)
 * @param {number} endVerse - Ending verse number within surah (1-based, inclusive)
 * @param {Object} options - Rendering options
 * @returns {Promise<string>} HTML string of rendered verses
 */
async function renderVersesBySurahRange(surahNumber, startVerse, endVerse, options = {}) {
    // TODO: Implement surah-relative verse range rendering
    console.log(`Rendering Surah ${surahNumber}, verses ${startVerse}-${endVerse}`);
}

/**
 * Renders a complete surah
 * @param {number} surahNumber - Surah number (1-114)
 * @param {Object} options - Rendering options
 * @returns {Promise<string>} HTML string of rendered surah
 */
async function renderSurah(surahNumber, options = {}) {
    // TODO: Implement complete surah rendering
    console.log(`Rendering complete Surah ${surahNumber}`);
}

/**
 * Renders verses by page number (Mushaf page numbering)
 * @param {number} pageNumber - Page number (1-604 for standard Mushaf)
 * @param {Object} options - Rendering options
 * @returns {Promise<string>} HTML string of rendered page
 */
async function renderVersesByPage(pageNumber, options = {}) {
    await loadQuranDatabase();


    const pageData = getPageLayout(pageNumber);
    if (!pageData.length) {
        console.log(pageData);
        return `<div class="error">Page ${pageNumber} not found</div>`;
    }

    // Sort by line number to ensure correct order
    pageData.sort((a, b) => a.line_number - b.line_number);

    let html = `<div class="mushaf-page qpc-hafs" data-page="${pageNumber}">`;

    pageData.forEach(line => {
        let lineElement = '<div class="line';

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
 * Renders a single verse with context (surrounding verses)
 * @param {number} surahNumber - Surah number (1-114)
 * @param {number} verseNumber - Verse number within surah (1-based)
 * @param {number} contextBefore - Number of verses before to include
 * @param {number} contextAfter - Number of verses after to include
 * @param {Object} options - Rendering options
 * @returns {Promise<string>} HTML string of verse with context
 */
async function renderVerseWithContext(surahNumber, verseNumber, contextBefore = 2, contextAfter = 2, options = {}) {
    // TODO: Implement verse with context rendering
    console.log(`Rendering Surah ${surahNumber}:${verseNumber} with context (${contextBefore}, ${contextAfter})`);
}

// ============================================================================
// DATABASE AND GLOBAL DATA
// ============================================================================

// Global data stores
let wordsData = null;
let layoutData = null;
let surahNames = null;

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
// QURAN DATA ACCESS FUNCTIONS
// ============================================================================

/**
 * Converts absolute verse number to surah:verse format
 * @param {number} absoluteVerse - Absolute verse number (0-based)
 * @returns {Object} {surah: number, verse: number} or null if invalid
 */
function absoluteToSurahVerse(absoluteVerse) {
    // TODO: Implement conversion using verse count data
    console.log(`Converting absolute verse ${absoluteVerse} to surah:verse`);
}

/**
 * Converts surah:verse to absolute verse number
 * @param {number} surahNumber - Surah number (1-114)
 * @param {number} verseNumber - Verse number within surah (1-based)
 * @returns {number} Absolute verse number (0-based) or -1 if invalid
 */
function surahVerseToAbsolute(surahNumber, verseNumber) {
    // TODO: Implement conversion using verse count data
    console.log(`Converting Surah ${surahNumber}:${verseNumber} to absolute`);
}

/**
 * Gets the total number of verses in a surah
 * @param {number} surahNumber - Surah number (1-114)
 * @returns {number} Number of verses in the surah, or -1 if invalid
 */
function getSurahVerseCount(surahNumber) {
    // TODO: Implement using verse count data
    console.log(`Getting verse count for Surah ${surahNumber}`);
}

/**
 * Gets surah name by number
 * @param {number} surahNumber - Surah number (1-114)
 * @returns {string} Surah name or empty string if invalid
 */
function getSurahName(surahNumber) {
    return SURAH_NAMES[surahNumber] || '';
}

/**
 * Gets words text by ID range
 * @param {number} firstWordId - Starting word ID
 * @param {number} lastWordId - Ending word ID
 * @returns {string} Concatenated words separated by spaces
 */
function getWords(firstWordId, lastWordId) {
    if (!wordsData) {
        console.error('Words data not loaded');
        return '';
    }

    const words = [];
    for (let id = firstWordId; id <= lastWordId; id++) {
        if (wordsData[id]) {
            words.push(wordsData[id]);
        }
    }
    return words.join(' ');
}

/**
 * Gets page layout data
 * @param {number} pageNumber - Page number (1-604)
 * @returns {Array} Array of line objects for the page
 */
function getPageLayout(pageNumber) {
    if (!layoutData) {
        console.error('Layout data not loaded');
        return [];
    }

    return layoutData[pageNumber] || [];
}

// ============================================================================
// RENDERING UTILITIES
// ============================================================================

/**
 * Loads words data from the SQLite database
 * @returns {Promise<Array>} Words data indexed by ID
 */
async function loadWordsData() {
    if (wordsData) return wordsData;

    try {
        const response = await fetch('/static/res/scripts/uthmani-wbw.json');
        const words    = await response.json();

        wordsData = [];
        Object.values(words).forEach(word => {
            wordsData[word.id] = word.text;
        });

        console.log(`Loaded ${Object.keys(words).length} words from database`);
        return wordsData;
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
        const response = await fetch('/static/res/layouts/uthmani-15-lines.json');
        const pages = await response.json();

        // Index layout by page number
        layoutData = {};
        pages.forEach(page => {
            if (!layoutData[page.page_number]) {
                layoutData[page.page_number] = [];
            }
            layoutData[page.page_number].push(page);
        });

        console.log(`Loaded layout data for ${Object.keys(layoutData).length} pages`);
        return layoutData;
    } catch (error) {
        console.error('Failed to load layout data:', error);
        throw error;
    }
}

/**
 * Loads Quran database for rendering
 * @returns {Promise<Object>} Database connection/data object
 */
async function loadQuranDatabase() {
    console.log('Loading Quran database...');
    await Promise.all([
        loadWordsData(),
        loadLayoutData()
    ]);
    return { words: wordsData, layout: layoutData };
}

/**
 * Applies rendering options to verse HTML
 * @param {string} verseText - Raw verse text
 * @param {Object} verseInfo - Verse metadata (surah, verse number, etc.)
 * @param {Object} options - Rendering options
 * @returns {string} Formatted HTML string
 */
function formatVerseHtml(verseText, verseInfo, options = {}) {
    // Apply basic styling and font classes
    const fontClass = options.font || 'qpc-hafs';
    const fontSize = options.fontSize || '';

    let html = `<div class="verse ${fontClass}"`;
    if (fontSize) {
        html += ` style="font-size: ${fontSize}"`;
    }
    html += `>${verseText}</div>`;

    return html;
}

/**
 * Renders a mushaf page directly to a DOM element
 * @param {number} pageNumber - Page number (1-604)
 * @param {string|Element} targetElement - CSS selector or DOM element
 * @param {Object} options - Rendering options
 * @returns {Promise<void>}
 */
async function renderPageToElement(pageNumber, targetElement, options = {}) {
    const element = typeof targetElement === 'string'
        ? document.querySelector(targetElement)
        : targetElement;

    if (!element) {
        throw new Error('Target element not found');
    }

    try {
        const html = await renderVersesByPage(pageNumber, options);
        element.innerHTML = html;

        // Add CSS classes for proper styling
        if (!element.classList.contains('quran-container')) {
            element.classList.add('quran-container');
        }
    } catch (error) {
        element.innerHTML = `<div class="error">Failed to render page ${pageNumber}: ${error.message}</div>`;
        throw error;
    }
}

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
        let foo = await loadQuranDatabase();
        console.log('Quran Renderer initialized successfully ✓');
        console.log(foo);
    } catch (error) {
        console.error('Failed to initialize Quran Renderer:', error);
        throw error;
    }
}

export { initializeQuranRenderer, renderPageToElement }
