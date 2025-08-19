// ============================================================================
// Quran DOM Query Utilities
// ============================================================================
import { QuranState } from './state.js';

function findVerseElements(surah, ayah, all = false) {
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

function findTargetVerseElement() {
    if (!QuranState.isReady()) {
        return null;
    }

    const containerElement = QuranState.getContainerElement();
    return containerElement.querySelector('.target-verse');
}

// ============================================================================
// Scrolling
// ============================================================================
function scrollToTargetVerse(delay = 100) {
    if (!QuranState.isReady()) { // TODO: remove?
        return;
    }

    setTimeout(() => {
        const targetElement = findTargetVerseElement();
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, delay);
}

function scrollToVerse(surah, ayah, delay = 100) {
    if (!QuranState.isReady()) {
        return;
    }

    setTimeout(() => {
        const verseElement = findVerseElements(surah, ayah, false);
        if (verseElement) {
            verseElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }, delay);
}

// ============================================================================
// Target Verse Management
// ============================================================================

// TODO: naming
function setTargetVerse(newTargetVerse, scrollIntoView = true) {
    try {
        if (!QuranState.isReady()) { // TODO: remove?
            console.error('Rendering state not ready. Render content first.');
            return false;
        }

        const currentSurah = QuranState.getSurah();
        const currentAyah  = QuranState.getAyah();
        
        // Remove existing target verse styling
        if (currentAyah !== null) {
            const targetElement = findTargetVerseElement();
            if (targetElement) {
                targetElement.classList.remove('target-verse');
            }
        }
        
        // Add new target verse styling
        if (newTargetVerse !== null) {
            const newTargetElement = findVerseElements(currentSurah, newTargetVerse, false);
            if (newTargetElement) {
                newTargetElement.classList.add('target-verse');
            }

            // Scroll to the new target verse
            if (scrollIntoView) {
                scrollToTargetVerse(true, 100);
            }
        }
        
        // Update state
        QuranState.setTargetVerse(newTargetVerse);
        return true;
    } catch (error) {
        console.error('Error setting target verse:', error.message);
        return false;
    }
}

export {
    findVerseElements,
    findTargetVerseElement,

    scrollToTargetVerse,
    scrollToVerse,

    setTargetVerse,
};
