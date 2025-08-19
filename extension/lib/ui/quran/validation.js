function isValidMode(mode) {
    const validModes = ['mushaf', 'context', 'surah'];
    return mode && mode != '' && validModes.includes(mode);
}

function isValidSurah(surah) {
    return Number.isInteger(surah) && surah >= 1 && surah <= 114;
}

function isValidAyah(ayah) {
    return Number.isInteger(ayah) && ayah >= 1;
}

function isValidPage(page) {
    return Number.isInteger(page) && page >= 1 && page <= 604;
}

export {
    isValidMode,
    isValidSurah,
    isValidAyah,
    isValidPage,
}
