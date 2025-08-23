import { QuranState } from './state.js';
import { isValidAyah } from './validation.js';

// ============================================================================
// Scrolling
// ============================================================================
function scrollToFocusedAyah(quranContainer, delay = 50) {
    setTimeout(() => {
        const focusedElement = findFocusedAyahElement(quranContainer, false);
        if (focusedElement) {
            focusedElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, delay);
}

// ============================================================================
// Focused Ayah Management
// ============================================================================

function setFocusedAyah(quranContainer, surah, ayah, scrollIntoView = true) {
    if (!isValidAyah(ayah, surah)) {
        throw new Error(`Can't highlight invalid key ${surah}:${ayah}`);
    }

    try {
        // Remove existing focused ayah styling
        const focusedAyat = findFocusedAyahElement(quranContainer, true);
        for (const el of focusedAyat ) {
            console.log('Removing');
            el.classList.remove('focused-ayah');
        };

        // Add new focused ayah styling
        const toFocus = findAyahElement(quranContainer, surah, ayah, true);
        for (const el of toFocus) {
            console.log('Adding');
            el.classList.add('focused-ayah');
        }

        // Scroll to the new focused ayah
        if (scrollIntoView) {
            scrollToFocusedAyah(quranContainer);
        }
        // Update state
        QuranState.setAyah(ayah, surah);
    } catch (error) {
        throw new Error();
    }
}

// ============================================================================
// DOM Query Utilities
// ============================================================================

function findAyahElement(quranContainer, surah, ayah, all = false) {
    const selector = `[data-surah="${surah}"][data-ayah="${ayah}"]`;

    if (all) {
        return quranContainer.querySelectorAll(selector);
    } else {
        return quranContainer.querySelector(selector);
    }
}

function findFocusedAyahElement(quranContainer, all = false) {
    if (all) {
        return quranContainer.querySelectorAll('.focused-ayah');
    } else {
        return document.querySelector('.focused-ayah');
    }
}

export {
    setFocusedAyah,
    scrollToFocusedAyah,
};
