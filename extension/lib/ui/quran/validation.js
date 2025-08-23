import { getSurahTotalAyat } from './data.js'

function isValidMode(mode) {
    const validModes = ['mushaf', 'context', 'surah'];
    return mode && mode != '' && validModes.includes(mode);
}

function isValidSurah(surah) {
    return Number.isInteger(surah) && surah >= 1 && surah <= 114;
}

function isValidAyah(ayah, surah) {
    return Number.isInteger(ayah) && ayah > 0 && ayah <= getSurahTotalAyat(surah);
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
