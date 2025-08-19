import { QuranState } from './state.js';


// ============================================================================
// Scrolling
// ============================================================================
function scrollToFocusedAyah(delay = 100) {
    if (!QuranState.isReady()) { // TODO: remove?
        return;
    }

    setTimeout(() => {
        const focusedElement = findFocusedAyahElement();
        if (focusedElement) {
            focusedElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, delay);
}

function scrollToAyah(surah, ayah, delay = 100) {
    if (!QuranState.isReady()) {
        return;
    }

    setTimeout(() => {
        const ayahElement = findAyahElements(surah, ayah, false);

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

function setFocusedAyah(newFocusedAyah, scrollIntoView = true) {
    try {
        if (!QuranState.isReady()) { // TODO: remove?
            console.error('Rendering state not ready. Render content first.');
            return false;
        }

        const currentSurah = QuranState.getSurah();
        const currentAyah  = QuranState.getAyah();
        
        // Remove existing focused ayah styling
        if (currentAyah !== null) {
            const focusedElement = findFocusedAyahElement();
            if (focusedElement) {
                focusedElement.classList.remove('focused-ayah');
            }
        }
        
        // Add new focused ayah styling
        if (newFocusedAyah !== null) {
            const newFocusedElement = findAyahElements(currentSurah, newFocusedAyah, false);
            if (newFocusedElement) {
                newFocusedElement.classList.add('focused-ayah');
            }

            // Scroll to the new focused ayah
            if (scrollIntoView) {
                scrollToFocusedAyah(true, 100);
            }
        }
        
        // Update state
        QuranState.setAyah(newFocusedAyah);
        return true;
    } catch (error) {
        console.error('Error setting focused ayah:', error.message);
        return false;
    }
}

// ============================================================================
// DOM Query Utilities
// ============================================================================

function findAyahElements(surah, ayah, all = false) {
    if (!QuranState.isReady()) {
        return all ? [] : null;
    }

    const containerElement = QuranState.getContainerElement();
    const selector = `[data-surah="${surah}"][data-ayah="${ayah}"]`;

    if (all) {
        return containerElement.querySelectorAll(selector);
    } else {
        return containerElement.querySelector(selector);
    }
}

function findFocusedAyahElement() {
    if (!QuranState.isReady()) {
        return null;
    }

    const containerElement = QuranState.getContainerElement();
    return containerElement.querySelector('.focused-ayah');
}

export {
    scrollToFocusedAyah,

    setFocusedAyah,
};
