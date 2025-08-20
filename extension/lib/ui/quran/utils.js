import { getPage, getWords } from './data.js'

function getPageFromKey(surah, ayah) {
    // TODO: can we avoid this, if not optimize

    // Search through all pages
    for (let pageNumber = 1; pageNumber <= 604; pageNumber++) {
        const page = getPage(pageNumber);

        // Check each line on the page
        for (const line of page) {
            if (line.line_type === 'ayah' && line.first_word_id && line.last_word_id) {
                // Check if any word in this line matches our focused ayah
                for (let wordId = line.first_word_id; wordId <= line.last_word_id; wordId++) {
                    const word = getWords(wordId);
                    if (word && word.surah === surah && word.ayah === ayah) {
                        return pageNumber;
                    }
                }
            }
        }
    }

    console.error('getPageFromKey() failed');
    return null;
}

function getKeyFromPage(pageNumber) {
    const page = getPage(pageNumber);
    let line = 0;
    while (page[line].line_type != 'ayah') {
        line++;
    }
    const firstAyah = page[line];
    const firstWord = getWords(firstAyah.first_word_id);

    const surah = firstWord.surah;
    const ayah  = firstWord.ayah;
    return { surah, ayah };
}

export {
    getPageFromKey,
    getKeyFromPage,
};
