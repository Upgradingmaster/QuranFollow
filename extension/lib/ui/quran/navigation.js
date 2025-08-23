import { QuranState } from './state.js';


// ============================================================================
// Scrolling
// ============================================================================
function scrollToFocusedAyah(quranContainer, delay = 50) {
    setTimeout(() => {
        const focusedElement = findFocusedAyahElement(quranContainer);
        if (focusedElement) {
            focusedElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, delay);
}

function scrollToAyah(quranContainer, surah, ayah, delay = 100) {
    setTimeout(() => {
        const ayahElement = findAyahElements(quranContainer, surah, ayah, false);

        if (ayahElement) {
            ayahElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, delay);
}

// ============================================================================
// Focused Ayah Management
// ============================================================================

function setFocusedAyah(quranContainer, newFocusedAyah, surah, scrollIntoView = true) {
    try {
        const currentSurah = QuranState.getSurah();
        const currentAyah  = QuranState.getAyah();
        
        // Remove existing focused ayah styling
        if (currentAyah !== null) {
            const focusedElement = findFocusedAyahElement(quranContainer);
            if (focusedElement) {
                focusedElement.classList.remove('focused-ayah');
            }
        }
        
        // Add new focused ayah styling
        if (newFocusedAyah !== null) {
            const newFocusedElement = findAyahElements(quranContainer, currentSurah, newFocusedAyah, false);
            if (newFocusedElement) {
                newFocusedElement.classList.add('focused-ayah');
            }

            // Scroll to the new focused ayah
            if (scrollIntoView) {
                scrollToFocusedAyah(quranContainer);
            }
        }
        
        // Update state
        QuranState.setAyah(newFocusedAyah, surah);
        return true;
    } catch (error) {
        console.error('Error setting focused ayah:', error.message);
        return false;
    }
}

// ============================================================================
// DOM Query Utilities
// ============================================================================

function findAyahElements(quranContainer, surah, ayah, all = false) {
    const selector = `[data-surah="${surah}"][data-ayah="${ayah}"]`;

    if (all) {
        return quranContainer.querySelectorAll(selector);
    } else {
        return quranContainer.querySelector(selector);
    }
}

function findFocusedAyahElement(quranContainer) {
    return quranContainer.querySelector('.focused-ayah');
}

export {
    scrollToFocusedAyah,
    setFocusedAyah,
};
